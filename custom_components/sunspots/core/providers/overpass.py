"""OpenStreetMap buildings via Overpass (opt-in only; sends the spot's coordinates out)."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from typing import Any

from ..buildings import BUILDING_KIND, RawFeature
from .base import Chunk, ProviderSchemaError, RangeFetcher

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
MAX_RESPONSE_BYTES = 10 * 1024 * 1024

_NUMBER = re.compile(r"^\s*([0-9]+(?:[.,][0-9]+)?)\s*(m|meters?|metres?)?\s*$", re.IGNORECASE)
# OSM building=* values that carry no usable class information.
_GENERIC_BUILDING = frozenset({"yes", "true", "1"})


def chunk_key(lat: float, lon: float, radius: float) -> str:
    return f"op-{lat:.4f}-{lon:.4f}-{int(radius)}"


def build_query(lat: float, lon: float, radius: float) -> str:
    around = f"(around:{int(radius)},{lat:.6f},{lon:.6f})"
    return (
        "[out:json][timeout:25];"
        f'(way["building"]{around};relation["building"]{around};);'
        "out tags geom;"
    )


def _parse_height(value: Any) -> float | None:
    if not isinstance(value, str):
        return None
    m = _NUMBER.match(value)
    if not m:
        return None
    number = float(m.group(1).replace(",", "."))
    return number if number > 0 else None


def _ring(geometry: list[dict[str, float]]) -> list[tuple[float, float]]:
    ring = [(float(p["lon"]), float(p["lat"])) for p in geometry]
    if len(ring) > 1 and ring[0] == ring[-1]:
        ring.pop()
    return ring


def _join_ways(ways: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
    """Join open way fragments end to end into closed rings; drop what cannot be closed."""
    rings: list[list[tuple[float, float]]] = []
    pool = [w[:] for w in ways if len(w) >= 2]
    while pool:
        current = pool.pop()
        progressed = True
        while progressed and current[0] != current[-1]:
            progressed = False
            for i, other in enumerate(pool):
                if other[0] == current[-1]:
                    current.extend(other[1:])
                elif other[-1] == current[-1]:
                    current.extend(reversed(other[:-1]))
                elif other[-1] == current[0]:
                    current[:0] = other[:-1]
                elif other[0] == current[0]:
                    current[:0] = list(reversed(other[1:]))
                else:
                    continue
                pool.pop(i)
                progressed = True
                break
        if current[0] == current[-1] and len(current) >= 4:
            rings.append(current[:-1])
    return rings


def _element_polygons(el: dict[str, Any]) -> list[list[list[tuple[float, float]]]]:
    if el["type"] == "way":
        ring = _ring(el.get("geometry", []))
        return [[ring]] if len(ring) >= 3 else []
    outers: list[list[tuple[float, float]]] = []
    inners: list[list[tuple[float, float]]] = []
    for member in el.get("members", []):
        if member.get("type") != "way" or "geometry" not in member:
            continue
        fragment = [(float(p["lon"]), float(p["lat"])) for p in member["geometry"]]
        (inners if member.get("role") == "inner" else outers).append(fragment)
    polygons: list[list[list[tuple[float, float]]]] = []
    inner_rings = _join_ways(inners)
    for outer in _join_ways(outers):
        polygons.append([outer, *inner_rings])  # holes are filtered by containment downstream
    return polygons


def parse_overpass(payload: dict[str, Any]) -> list[RawFeature]:
    """Convert an Overpass JSON result into raw features."""
    if "elements" not in payload:
        raise ProviderSchemaError("Overpass response has no 'elements'")
    features: list[RawFeature] = []
    for el in payload["elements"]:
        if el.get("type") not in ("way", "relation"):
            continue
        tags = el.get("tags", {})
        if tags.get("location") == "underground" or tags.get("building") == "no":
            continue
        try:
            layer = float(tags.get("layer", 0))
        except ValueError:
            layer = 0.0
        height = _parse_height(tags.get("height")) or _parse_height(tags.get("building:height"))
        levels = _parse_height(tags.get("building:levels"))
        min_h = _parse_height(tags.get("min_height")) or 0.0
        klass = tags.get("building")
        props: dict[str, Any] = {"is_underground": layer < 0}
        if height:
            props["height"] = height
        if levels:
            props["num_floors"] = levels
        if min_h:
            props["min_height"] = min_h
        if klass and klass not in _GENERIC_BUILDING:
            props["class"] = klass
        polygons = _element_polygons(el)
        if polygons:
            features.append(
                RawFeature(f"{el['type'][0]}{el['id']}", BUILDING_KIND, None, props, polygons)
            )
    return features


class OverpassProvider:
    """Fetches buildings around a point (explicit opt-in by the user)."""

    name = "overpass"

    def __init__(self, fetcher: RangeFetcher) -> None:
        self._fetcher = fetcher

    async def fetch_chunk(self, lat: float, lon: float, radius: float) -> Chunk:
        raw = await self._fetcher.post(
            OVERPASS_URL, "data=" + build_query(lat, lon, radius), max_bytes=MAX_RESPONSE_BYTES
        )
        try:
            payload = json.loads(raw)
        except ValueError as err:
            raise ProviderSchemaError("Overpass returned invalid JSON") from err
        return Chunk(
            chunk_key(lat, lon, radius),
            "overpass",
            None,
            datetime.now(UTC).isoformat(),
            parse_overpass(payload),
        )
