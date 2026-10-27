"""Diagnostics: counters, versions and timings only; no coordinates and no geometry."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from .core.const import ALGO_VERSION
from .data import SunspotsConfigEntry

TO_REDACT = {"latitude", "longitude", "location", "name", "title", "lat", "lon"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: SunspotsConfigEntry
) -> dict[str, Any]:
    runtime = entry.runtime_data
    spots = []
    for subentry_id, coordinator in runtime.spots.items():
        data = coordinator.data
        spot: dict[str, Any] = {
            "subentry_id": subentry_id,
            "settings": {
                "radius": coordinator.settings.radius,
                "observer_height": coordinator.settings.observer_height,
                "ground_offset": coordinator.settings.ground_offset,
                "weather_entity": coordinator.settings.weather_entity,
            },
            "loaded": data is not None,
            "timings": coordinator.timings,
        }
        if data is not None:
            spot |= {
                "provider": data.meta.provider,
                "release": data.meta.release,
                "fetched_at": data.meta.fetched_at,
                "chunk_count": len(data.meta.chunk_keys),
                "building_count": data.building_count,
                "coverage_metric": data.model.coverage,
                "height_source_percent": data.model.source_pct,
                "parts_with_min_height": data.model.parts_with_min_height,
                "height_overrides": len(data.corrections.overrides),
                "horizon_entries": [
                    {"kind": e.kind, "source": e.source} for e in data.corrections.entries
                ],
                "sunlit_intervals_in_window": len(data.timeline.intervals),
                "max_horizon_deg": round(float(data.horizon.max()), 1),
            }
        spots.append(spot)
    return {
        "algo_version": ALGO_VERSION,
        "options": async_redact_data(dict(entry.options), TO_REDACT),
        "spot_count": len(spots),
        "spots": async_redact_data({"spots": spots}, TO_REDACT)["spots"],
    }
