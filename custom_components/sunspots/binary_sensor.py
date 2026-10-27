"""Binary sensors: geometric 'sunny' and the weather-aware variant."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .coordinator import SpotCoordinator, local_day_bounds
from .data import SunspotsConfigEntry
from .entity import SpotServicesMixin, SunspotsEntity, _local_iso

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SunspotsConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    for subentry_id, coordinator in entry.runtime_data.spots.items():
        entities: list[BinarySensorEntity] = [SunnyBinarySensor(coordinator)]
        if coordinator.settings.weather_entity:
            entities.append(SunnyWeatherAwareBinarySensor(coordinator))
        async_add_entities(entities, config_subentry_id=subentry_id)


class SunnyBinarySensor(SpotServicesMixin, SunspotsEntity, BinarySensorEntity):
    """On while the sun is geometrically unobstructed at the spot."""

    _unrecorded_attributes = frozenset(
        {
            "sun_azimuth",
            "sun_elevation",
            "horizon_elevation_at_sun",
            "intervals_today",
            "intervals_tomorrow",
        }
    )

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "sunny")

    @property
    def is_on(self) -> bool | None:
        if self.coordinator.data is None:
            return None
        return self.coordinator.sunny_geometric(dt_util.utcnow())

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        data = self.coordinator.data
        if data is None:
            return None
        now = dt_util.utcnow()
        az, el = self.coordinator.sun_position_now(now)
        day_start, day_end = local_day_bounds(dt_util.now().date())
        today = [
            [_local_iso(max(a, day_start)), _local_iso(min(b, day_end))]
            for a, b in data.timeline.intervals
            if b > day_start and a < day_end
        ]
        tomorrow = self.coordinator.tomorrow
        return {
            "intervals_tomorrow": [
                [_local_iso(a), _local_iso(b)] for a, b in (tomorrow.intervals if tomorrow else [])
            ],
            "sun_azimuth": round(az, 1),
            "sun_elevation": round(el, 1),
            "horizon_elevation_at_sun": round(self.coordinator.horizon_at_sun(now), 1),
            "intervals_today": today,
        }


class SunnyWeatherAwareBinarySensor(SpotServicesMixin, SunspotsEntity, BinarySensorEntity):
    """On while geometrically sunny and the current cloud cover allows direct sun."""

    _unrecorded_attributes = frozenset({"cloud_coverage"})

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "sunny_weather_aware")

    @property
    def is_on(self) -> bool | None:
        if self.coordinator.data is None:
            return None
        return self.coordinator.sunny_weather_aware(dt_util.utcnow())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        coordinator = self.coordinator
        return {
            "weather_entity": coordinator.settings.weather_entity,
            "cloud_coverage": coordinator.cloud,
            "cloud_known": coordinator.gate.clear is not None,
            "cloud_threshold": coordinator.gate.threshold,
        }
