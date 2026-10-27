"""Fakes for provider tests: an in-memory PMTiles server and recording fetcher."""

from __future__ import annotations

import gzip
import io
import json
from pathlib import Path

from pmtiles.tile import Compression, TileType, zxy_to_tileid
from pmtiles.writer import Writer

from custom_components.sunspots.core.providers import overture_pmtiles as ov
from custom_components.sunspots.core.providers.base import HttpStatusError

FIXTURE = Path(__file__).parents[1] / "fixtures" / "overture_buildings_z14_8802_5370.mvt"
RELEASE = "2026-10-21.0"


def build_archive(
    tiles: dict[tuple[int, int], bytes],
    max_zoom: int = 14,
    compression: Compression = Compression.GZIP,
) -> bytes:
    out = io.BytesIO()
    writer = Writer(out)
    for (x, y), raw in sorted(tiles.items(), key=lambda kv: zxy_to_tileid(14, *kv[0])):
        writer.write_tile(
            zxy_to_tileid(14, x, y), gzip.compress(raw) if compression == Compression.GZIP else raw
        )
    writer.finalize(
        {
            "tile_type": TileType.MVT,
            "tile_compression": compression,
            "min_zoom": 14,
            "max_zoom": max_zoom,
        },
        {},
    )
    data = bytearray(out.getvalue())
    data[101] = max_zoom  # header max_zoom byte (writer derives it from the tiles)
    return bytes(data)


class FakeFetcher:
    """Serves a STAC catalogue and one PMTiles archive; records requests."""

    def __init__(self, archive: bytes, release: str = RELEASE) -> None:
        self.archive = archive
        self.release = release
        self.requests: list[tuple[str, int | None, int | None]] = []
        self.fail_with: int | None = None
        self.posted: list[tuple[str, str]] = []
        self.post_response: bytes = b'{"elements": []}'

    async def get(
        self, url: str, *, start: int | None = None, length: int | None = None, max_bytes: int
    ) -> bytes:
        self.requests.append((url, start, length))
        if self.fail_with:
            raise HttpStatusError(self.fail_with, url)
        if url == ov.STAC_URL:
            return json.dumps({"latest": self.release}).encode()
        if url == ov.TILE_URL.format(release=self.release):
            assert start is not None and length is not None
            data = self.archive[start : start + length]
            assert len(data) <= max_bytes
            return data
        raise HttpStatusError(404, url)

    async def post(self, url: str, data: str, *, max_bytes: int) -> bytes:
        self.posted.append((url, data))
        return self.post_response
