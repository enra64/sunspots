"""Height resolution per building and the skyline-weighted coverage metric (spec 4.2)."""

from __future__ import annotations

from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

import numpy as np

from .const import (
    COVERAGE_MIN_ELEVATION_DEG,
    DEFAULT_BUILDING_HEIGHT_M,
    DEFAULT_FLOOR_HEIGHT_M,
)
from .horizon import HorizonResult
from .models import (
    EXPLICIT_SOURCES,
    SOURCE_CLASS,
    SOURCE_DEFAULT,
    SOURCE_FLOORS,
    SOURCE_HEIGHT,
    SOURCE_OVERRIDE,
    SOURCES,
    Building,
)

# Starting values from the spec, extended with the class values observed in Overture
# tiles from Berlin/Munich/Paris/Portland/Quedlinburg. To be tuned against observations.
CLASS_DEFAULT_HEIGHTS: dict[str, float] = {
    "garage": 3,
    "garages": 3,
    "shed": 3,
    "carport": 3,
    "hut": 3,
    "cabin": 3,
    "roof": 3,
    "kiosk": 3,
    "shelter": 3,
    "greenhouse": 3,
    "toilets": 3,
    "pavilion": 3,
    "allotment_house": 3,
    "houseboat": 3,
    "stable": 5,
    "bungalow": 4,
    "house": 8,
    "detached": 8,
    "semidetached_house": 8,
    "terrace": 9,
    "chapel": 8,
    "apartments": 15,
    "residential": 15,
    "dormitory": 15,
    "hotel": 15,
    "commercial": 15,
    "office": 15,
    "retail": 12,
    "supermarket": 6,
    "school": 12,
    "university": 15,
    "college": 15,
    "kindergarten": 6,
    "hospital": 15,
    "government": 12,
    "civic": 12,
    "public": 12,
    "library": 10,
    "church": 20,
    "cathedral": 20,
    "temple": 12,
    "synagogue": 12,
    "warehouse": 8,
    "industrial": 8,
    "hangar": 10,
    "grandstand": 8,
}
SUBTYPE_DEFAULT_HEIGHTS: dict[str, float] = {"outbuilding": 3, "agricultural": 5}


@dataclass(frozen=True, slots=True)
class HeightSettings:
    """Hub-level height assumptions."""

    floor_height: float = DEFAULT_FLOOR_HEIGHT_M
    default_height: float = DEFAULT_BUILDING_HEIGHT_M


def resolve_height(
    building: Building, settings: HeightSettings, override: float | None = None
) -> tuple[float, str]:
    """Return (height in metres, source); first match wins."""
    if override is not None:
        return override, SOURCE_OVERRIDE
    if building.height is not None and building.height > 0:
        return building.height, SOURCE_HEIGHT
    if building.num_floors is not None and building.num_floors > 0:
        return building.num_floors * settings.floor_height, SOURCE_FLOORS
    for key, table in (
        (building.klass, CLASS_DEFAULT_HEIGHTS),
        (building.subtype, SUBTYPE_DEFAULT_HEIGHTS),
    ):
        if key is not None and key in table:
            return float(table[key]), SOURCE_CLASS
    return settings.default_height, SOURCE_DEFAULT


def resolve_all(
    buildings: Sequence[Building],
    settings: HeightSettings,
    overrides: Mapping[str, float] | None = None,
) -> tuple[list[float], list[str]]:
    """Resolve every building; ``overrides`` maps building id -> user height."""
    overrides = overrides or {}
    heights: list[float] = []
    sources: list[str] = []
    for b in buildings:
        h, s = resolve_height(b, settings, overrides.get(b.id))
        heights.append(h)
        sources.append(s)
    return heights, sources


def coverage_metric(result: HorizonResult, sources: Sequence[str]) -> float | None:
    """Skyline-weighted real-height coverage.

    Share of horizon bins with elevation above 2 degrees whose limiting building has an
    explicit height, floor count or user override. ``None`` when no bin qualifies.
    """
    mask = (result.angles > COVERAGE_MIN_ELEVATION_DEG) & (result.limiter >= 0)
    if not mask.any():
        return None
    explicit = np.array([s in EXPLICIT_SOURCES for s in sources], dtype=bool)
    return float(explicit[result.limiter[mask]].mean())


def source_percentages(sources: Sequence[str]) -> dict[str, float]:
    """Plain building-count percentage per height source."""
    counts = Counter(sources)
    total = len(sources) or 1
    return {s: round(100.0 * counts.get(s, 0) / total, 1) for s in SOURCES}
