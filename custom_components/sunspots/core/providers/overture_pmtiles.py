"""Overture Maps buildings via the PMTiles archive on S3 (read z14 only)."""

from __future__ import annotations

import asyncio
import json
import zlib
from datetime import UTC, datetime
from typing import Any

from pmtiles.tile import (
    Compression,
    TileType,
    deserialize_directory,
    deserialize_header,
    find_tile,
    zxy_to_tileid,
)

from ..buildings import BUILDING_KIND, PART_KIND, RawFeature
from ..geometry import tile_pixel_to_lonlat, tiles_for_radius
from ..mvt import MvtError, decode_tile
from .base import Chunk, ProviderSchemaError, RangeFetcher

STAC_URL = "https://stac.overturemaps.org/catalog.json"
TILE_URL = "https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/{release}/buildings.pmtiles"
ZOOM = 14
MAX_COMPRESSED_TILE = 8 * 1024 * 1024
MAX_DECOMPRESSED_TILE = 32 * 1024 * 1024
MAX_DIRECTORY_BYTES = 2 * 1024 * 1024
MAX_STAC_BYTES = 1024 * 1024
_EXPECTED_KEYS = frozenset({"height", "num_floors", "class", "subtype"})
_PROP_KEYS = (
    "height",
    "num_floors",
    "min_height",
    "class",
    "subtype",
    "has_parts",
    "is_underground",
)


def chunk_key(x: int, y: int) -> str:
    return f"ov-{ZOOM}-{x}-{y}"


def keys_for(lat: float, lon: float, radius: float) -> list[tuple[str, int, int]]:
    """(chunk key, x, y) for every z14 tile covering the radius."""
    return [(chunk_key(x, y), x, y) for x, y in tiles_for_radius(lat, lon, radius, ZOOM)]


def _decompress(data: bytes, compression: Compression, limit: int) -> bytes:
    if compression == Compression.NONE:
        if len(data) > limit:
            raise ProviderSchemaError("tile larger than limit")
        return data
    if compression != Compression.GZIP:
        raise ProviderSchemaError(f"unsupported compression {compression.name}")
    decomp = zlib.decompressobj(16 + zlib.MAX_WBITS)
    try:
        out = decomp.decompress(data, limit + 1)
    except zlib.error as err:
        raise ProviderSchemaError("corrupt gzip data") from err
    if len(out) > limit:
        raise ProviderSchemaError("decompressed tile larger than limit")
    return out


def parse_tile(raw: bytes, x: int, y: int, release: str, fetched_at: str) -> Chunk:
    """Decode a decompressed MVT tile into a chunk of raw features (CPU-bound)."""
    try:
        layers = decode_tile(raw)
    except MvtError as err:
        raise ProviderSchemaError(f"malformed tile: {err}") from err
    features: list[RawFeature] = []
    for layer in layers:
        if layer.name not in ("building", "building_part"):
            continue
        if layer.features and not (_EXPECTED_KEYS & set(layer.keys)):
            raise ProviderSchemaError(
                "building attributes (height/num_floors/class/subtype) missing from tile"
            )
        is_part = layer.name == "building_part"
        for f in layer.features:
            fid = f.properties.get("id")
            if not isinstance(fid, str):
                continue
            props = {k: f.properties.get(k) for k in _PROP_KEYS if f.properties.get(k) is not None}
            polygons = [
                [
                    [tile_pixel_to_lonlat(ZOOM, x, y, px, py, layer.extent) for px, py in ring]
                    for ring in poly
                ]
                for poly in f.polygons
            ]
            parent = f.properties.get("building_id") if is_part else None
            features.append(
                RawFeature(
                    fid,
                    PART_KIND if is_part else BUILDING_KIND,
                    parent if isinstance(parent, str) else None,
                    props,
                    polygons,
                )
            )
    return Chunk(chunk_key(x, y), "overture", release, fetched_at, features)


class OvertureProvider:
    """Fetches tiles from the latest Overture release."""

    name = "overture"

    def __init__(self, fetcher: RangeFetcher) -> None:
        self._fetcher = fetcher
        self._headers: dict[str, Any] = {}
        self._dirs: dict[tuple[str, int, int], list[Any]] = {}

    async def latest_release(self) -> str:
        data = await self._fetcher.get(STAC_URL, max_bytes=MAX_STAC_BYTES)
        try:
            release = json.loads(data)["latest"]
        except (ValueError, KeyError, TypeError) as err:
            raise ProviderSchemaError("STAC catalog has no 'latest'") from err
        if not isinstance(release, str) or not release.replace("-", "").replace(".", "").isalnum():
            raise ProviderSchemaError("unexpected release id")
        return release

    async def _header(self, url: str) -> Any:
        if url not in self._headers:
            raw = await self._fetcher.get(url, start=0, length=127, max_bytes=127)
            try:
                header = deserialize_header(raw)
            except Exception as err:
                raise ProviderSchemaError("not a PMTiles archive") from err
            if header["tile_type"] != TileType.MVT:
                raise ProviderSchemaError("archive does not contain vector tiles")
            if header["max_zoom"] < ZOOM:
                raise ProviderSchemaError(f"archive max_zoom {header['max_zoom']} < {ZOOM}")
            if header["internal_compression"] != Compression.GZIP:
                raise ProviderSchemaError("unsupported directory compression")
            self._headers[url] = header
        return self._headers[url]

    async def _directory(self, url: str, offset: int, length: int) -> list[Any]:
        key = (url, offset, length)
        if key not in self._dirs:
            raw = await self._fetcher.get(
                url, start=offset, length=length, max_bytes=MAX_DIRECTORY_BYTES
            )
            try:
                self._dirs[key] = deserialize_directory(raw)
            except (OSError, zlib.error, EOFError, ValueError) as err:
                raise ProviderSchemaError("corrupt directory") from err
        return self._dirs[key]

    async def fetch_chunk(self, release: str, x: int, y: int) -> Chunk:
        """Download and decode one z14 tile; an absent tile yields an empty chunk."""
        url = TILE_URL.format(release=release)
        fetched_at = datetime.now(UTC).isoformat()
        header = await self._header(url)
        tile_id = zxy_to_tileid(ZOOM, x, y)
        offset, length = header["root_offset"], header["root_length"]
        entry = None
        for _ in range(4):
            directory = await self._directory(url, offset, length)
            entry = find_tile(directory, tile_id)
            if entry is None:
                return Chunk(chunk_key(x, y), "overture", release, fetched_at, [])
            if entry.run_length != 0:
                break
            offset, length = header["leaf_directory_offset"] + entry.offset, entry.length
        else:
            raise ProviderSchemaError("directory nesting too deep")
        raw = await self._fetcher.get(
            url,
            start=header["tile_data_offset"] + entry.offset,
            length=entry.length,
            max_bytes=MAX_COMPRESSED_TILE,
        )
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, self._decode, raw, header["tile_compression"], x, y, release, fetched_at
        )

    @staticmethod
    def _decode(
        raw: bytes, compression: Compression, x: int, y: int, release: str, fetched_at: str
    ) -> Chunk:
        return parse_tile(
            _decompress(raw, compression, MAX_DECOMPRESSED_TILE), x, y, release, fetched_at
        )
