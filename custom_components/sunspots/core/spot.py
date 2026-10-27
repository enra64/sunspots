"""Everything needed to turn buildings + settings + corrections into a spot's horizon."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from .corrections import Corrections, apply_entries, override_heights
from .heights import HeightSettings, coverage_metric, resolve_all, source_percentages
from .horizon import FloatArray, compute_horizon
from .models import Building


@dataclass(slots=True)
class SpotParameters:
    lat: float
    lon: float
    radius: float
    observer_height: float
    ground_offset: float
    heights: HeightSettings

    @property
    def h_obs(self) -> float:
        return self.observer_height + self.ground_offset


@dataclass(slots=True)
class SpotModel:
    """Result of the geometric computation (before manual horizon entries)."""

    geometric: FloatArray
    coverage: float | None
    source_pct: dict[str, float]
    building_count: int
    parts_with_min_height: int


def build_spot_model(
    buildings: Sequence[Building],
    params: SpotParameters,
    corrections: Corrections,
    parts_with_min_height: int,
) -> SpotModel:
    overrides = override_heights(buildings, params.lat, params.lon, corrections.overrides)
    heights, sources = resolve_all(buildings, params.heights, overrides)
    result = compute_horizon(buildings, heights, params.h_obs, params.radius)
    return SpotModel(
        geometric=result.angles,
        coverage=coverage_metric(result, sources),
        source_pct=source_percentages(sources),
        building_count=len(buildings),
        parts_with_min_height=parts_with_min_height,
    )


def final_horizon(model: SpotModel, corrections: Corrections) -> FloatArray:
    """Geometric horizon with manual obstacles and clearances applied."""
    return apply_entries(model.geometric, corrections.entries)
