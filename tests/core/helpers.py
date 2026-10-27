"""Synthetic building helpers for core tests."""

from __future__ import annotations

import math

from custom_components.sunspots.core.geometry import EARTH_RADIUS_M
from custom_components.sunspots.core.models import Building


def rect(x0: float, y0: float, x1: float, y1: float) -> list[tuple[float, float]]:
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def box(
    bid: str, x0: float, y0: float, x1: float, y1: float, height: float | None = 10.0, **kw: object
) -> Building:
    return Building(id=bid, polygons=[[rect(x0, y0, x1, y1)]], height=height, **kw)  # type: ignore[arg-type]


def south_wall(distance: float = 20.0, half_angle: float = 60.0, height: float = 20.0) -> Building:
    """A thin wall due south, spanning +-half_angle degrees as seen from the origin."""
    half = distance * math.tan(math.radians(half_angle))
    return box("wall", -half, -distance - 0.5, half, -distance, height)


def unproject(lat0: float, lon0: float, x: float, y: float) -> tuple[float, float]:
    """Inverse of :func:`project`; returns (lat, lon)."""
    lat = lat0 + math.degrees(y / EARTH_RADIUS_M)
    lon = lon0 + math.degrees(x / (EARTH_RADIUS_M * math.cos(math.radians(lat0))))
    return lat, lon
