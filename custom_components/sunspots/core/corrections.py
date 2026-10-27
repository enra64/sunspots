"""User-driven data fixes: height overrides and horizon entries (obstacles/clearances)."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Literal

import numpy as np

from .geometry import distance_to_ring, point_in_polygon, project
from .horizon import FloatArray
from .models import Building

OVERRIDE_MATCH_DISTANCE_M = 25.0
CALIBRATION_HALF_WINDOW_DEG = 3.0
CALIBRATION_MARGIN_DEG = 0.5
MAX_CLEARANCE_DROP_DEG = 3.0

EntryKind = Literal["obstacle", "clearance"]


@dataclass(slots=True)
class HeightOverride:
    id: str
    lat: float
    lon: float
    height_m: float
    created: str


@dataclass(slots=True)
class HorizonEntry:
    """A manual obstacle (raises the horizon) or clearance (lowers it by at most 3 degrees)."""

    id: str
    kind: EntryKind
    azimuth_from: float
    azimuth_to: float
    elevation_deg: float
    created: str
    source: Literal["manual", "calibration"] = "manual"
    note: str | None = None


@dataclass(slots=True)
class Corrections:
    overrides: list[HeightOverride] = field(default_factory=list)
    entries: list[HorizonEntry] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "overrides": [asdict(o) for o in self.overrides],
            "entries": [asdict(e) for e in self.entries],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Corrections:
        return cls(
            overrides=[HeightOverride(**o) for o in data.get("overrides", [])],
            entries=[HorizonEntry(**e) for e in data.get("entries", [])],
        )

    def remove(self, entry_id: str) -> bool:
        """Delete an override or entry by id."""
        before = len(self.overrides) + len(self.entries)
        self.overrides = [o for o in self.overrides if o.id != entry_id]
        self.entries = [e for e in self.entries if e.id != entry_id]
        return len(self.overrides) + len(self.entries) < before


def match_building(
    buildings: Sequence[Building], lat0: float, lon0: float, lat: float, lon: float
) -> Building | None:
    """Building containing the point, else the nearest within 25 m."""
    x, y = project(lat0, lon0, lat, lon)
    best: tuple[float, Building] | None = None
    for b in buildings:
        for polygon in b.polygons:
            if point_in_polygon(x, y, polygon):
                return b
            d = distance_to_ring(x, y, polygon[0])
            if d <= OVERRIDE_MATCH_DISTANCE_M and (best is None or d < best[0]):
                best = (d, b)
    return best[1] if best else None


def override_heights(
    buildings: Sequence[Building], lat0: float, lon0: float, overrides: Sequence[HeightOverride]
) -> dict[str, float]:
    """Map building id -> overridden height (later overrides win)."""
    result: dict[str, float] = {}
    for o in overrides:
        building = match_building(buildings, lat0, lon0, o.lat, o.lon)
        if building is not None:
            result[building.id] = o.height_m
    return result


def _bins_in_window(bins: int, az_from: float, az_to: float) -> np.ndarray[Any, Any]:
    centres = (np.arange(bins) + 0.5) * (360.0 / bins)
    a, b = az_from % 360.0, az_to % 360.0
    if a <= b:
        return (centres >= a) & (centres <= b)
    return (centres >= a) | (centres <= b)


def apply_entries(geometric: FloatArray, entries: Sequence[HorizonEntry]) -> FloatArray:
    """Apply clearances (bounded) then obstacles (max) on top of the geometric horizon."""
    result = geometric.copy()
    bins = result.size
    for e in entries:
        if e.kind != "clearance":
            continue
        mask = _bins_in_window(bins, e.azimuth_from, e.azimuth_to)
        lowered = np.maximum(
            np.minimum(result[mask], e.elevation_deg), geometric[mask] - MAX_CLEARANCE_DROP_DEG
        )
        result[mask] = np.maximum(lowered, 0.0)
    for e in entries:
        if e.kind != "obstacle":
            continue
        mask = _bins_in_window(bins, e.azimuth_from, e.azimuth_to)
        result[mask] = np.maximum(result[mask], e.elevation_deg)
    return result


def calibration_entry(
    observed_sunny: bool,
    model_sunny: bool,
    sun_azimuth: float,
    sun_elevation: float,
    when: datetime,
    entry_id: str,
) -> HorizonEntry | None:
    """Entry that reconciles the model with an observation; None when they already agree."""
    if observed_sunny == model_sunny:
        return None
    window = CALIBRATION_HALF_WINDOW_DEG
    observed = "sunny" if observed_sunny else "shaded"
    note = f"calibration: observed {observed} on {when.date().isoformat()}"
    if observed_sunny:
        kind: EntryKind = "clearance"
        elevation = max(0.0, sun_elevation - CALIBRATION_MARGIN_DEG)
    else:
        kind = "obstacle"
        elevation = sun_elevation + CALIBRATION_MARGIN_DEG
    return HorizonEntry(
        id=entry_id,
        kind=kind,
        azimuth_from=(sun_azimuth - window) % 360.0,
        azimuth_to=(sun_azimuth + window) % 360.0,
        elevation_deg=round(elevation, 2),
        created=when.isoformat(),
        source="calibration",
        note=note,
    )


def validate_entry(az_from: float, az_to: float, elevation: float) -> None:
    """Raise ValueError for impossible manual obstacle values."""
    for v in (az_from, az_to):
        if not (0.0 <= v <= 360.0) or math.isnan(v):
            raise ValueError("azimuth must be within 0-360 degrees")
    if not (0.0 < elevation <= 90.0):
        raise ValueError("elevation must be within (0, 90] degrees")
