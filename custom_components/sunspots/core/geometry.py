"""Planar geometry helpers (local equirectangular plane, y north-up)."""

from __future__ import annotations

import math

EARTH_RADIUS_M = 6_371_000.0

Point = tuple[float, float]
Ring = list[Point]
Polygon = list[Ring]  # first ring exterior, remaining rings holes


def project(lat0: float, lon0: float, lat: float, lon: float) -> Point:
    """Project lon/lat to metres east/north of (lat0, lon0)."""
    x = EARTH_RADIUS_M * math.radians(lon - lon0) * math.cos(math.radians(lat0))
    y = EARTH_RADIUS_M * math.radians(lat - lat0)
    return x, y


def signed_area(ring: list[Point]) -> float:
    """Shoelace signed area (positive when counter-clockwise in a y-up plane)."""
    total = 0.0
    for i, (x1, y1) in enumerate(ring):
        x2, y2 = ring[(i + 1) % len(ring)]
        total += x1 * y2 - x2 * y1
    return total / 2


def point_in_ring(px: float, py: float, ring: list[Point]) -> bool:
    """Even-odd point-in-ring test."""
    inside = False
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % n]
        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def point_in_polygon(px: float, py: float, polygon: Polygon) -> bool:
    """Inside the exterior ring and not inside any hole."""
    if not polygon or not point_in_ring(px, py, polygon[0]):
        return False
    return not any(point_in_ring(px, py, hole) for hole in polygon[1:])


def distance_to_ring(px: float, py: float, ring: list[Point]) -> float:
    """Shortest distance from a point to the ring's edges."""
    best = math.inf
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % n]
        dx, dy = x2 - x1, y2 - y1
        length2 = dx * dx + dy * dy
        t = 0.0 if length2 == 0 else max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / length2))
        best = min(best, math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)))
    return best


def lonlat_to_tile(lat: float, lon: float, zoom: int) -> tuple[float, float]:
    """Fractional web-mercator tile coordinates."""
    n = 1 << zoom
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n
    return x, y


def tile_pixel_to_lonlat(
    zoom: int, tx: int, ty: int, px: float, py: float, extent: int
) -> tuple[float, float]:
    """Tile pixel (y down) to (lon, lat)."""
    n = 1 << zoom
    lon = (tx + px / extent) / n * 360.0 - 180.0
    lat = math.degrees(math.atan(math.sinh(math.pi * (1.0 - 2.0 * (ty + py / extent) / n))))
    return lon, lat


def tiles_for_radius(lat: float, lon: float, radius_m: float, zoom: int) -> list[tuple[int, int]]:
    """All (x, y) tiles intersecting the bounding box of the circle."""
    dlat = math.degrees(radius_m / EARTH_RADIUS_M)
    dlon = dlat / math.cos(math.radians(lat))
    x0, y1 = lonlat_to_tile(lat - dlat, lon - dlon, zoom)
    x1, y0 = lonlat_to_tile(lat + dlat, lon + dlon, zoom)
    n = 1 << zoom
    return [
        (x, y)
        for x in range(max(0, int(x0)), min(n - 1, int(x1)) + 1)
        for y in range(max(0, int(y0)), min(n - 1, int(y1)) + 1)
    ]
