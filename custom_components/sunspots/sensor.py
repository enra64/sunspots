"""Sensors: next change, sun remaining, sun hours today, data quality, and the hub summary."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
)
from homeassistant.const import PERCENTAGE, EntityCategory, UnitOfTime
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import SpotCoordinator, local_day_bounds
from .core.forecast import best_window, forecast_state
from .data import SunspotsConfigEntry
from .entity import SunspotsEntity, hourly_attribute, windows_attribute

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SunspotsConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([SunnyNowSensor(entry)])
    for subentry_id, coordinator in entry.runtime_data.spots.items():
        async_add_entities(
            [
                NextChangeSensor(coordinator),
                SunRemainingSensor(coordinator),
                SunHoursTodaySensor(coordinator),
                SunForecastSensor(coordinator),
                SunTomorrowSensor(coordinator),
                DataQualitySensor(coordinator),
            ],
            config_subentry_id=subentry_id,
        )


class NextChangeSensor(SunspotsEntity, SensorEntity):
    """When the spot next flips between sunny and shaded."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "next_change")

    @property
    def native_value(self) -> datetime | None:
        if self.coordinator.data is None:
            return None
        return self.coordinator.data.timeline.next_change(dt_util.utcnow())


class SunRemainingSensor(SunspotsEntity, SensorEntity):
    """Continuous sun left; 0 while shaded."""

    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_suggested_display_precision = 0

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "sun_remaining")

    @property
    def native_value(self) -> int | None:
        if self.coordinator.data is None:
            return None
        remaining = self.coordinator.data.timeline.remaining(dt_util.utcnow())
        return int(remaining.total_seconds() // 60)


class SunHoursTodaySensor(SunspotsEntity, SensorEntity):
    """Geometric sun hours for today's local calendar day (resets at midnight)."""

    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.HOURS
    _attr_suggested_display_precision = 1

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "sun_hours_today")

    @property
    def native_value(self) -> float | None:
        if self.coordinator.data is None:
            return None
        start, end = local_day_bounds(dt_util.now().date())
        total = self.coordinator.data.timeline.sun_time(start, end)
        return round(total / timedelta(hours=1), 2)


FORECAST_STATES = ["sunny_now", "partly", "sunny_later", "partly_later", "no_sun_today"]


class SunForecastSensor(SunspotsEntity, SensorEntity):
    """What the rest of today looks like: geometry combined with the cloud forecast."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = FORECAST_STATES
    _unrecorded_attributes = frozenset({"windows", "best_window", "hourly"})

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "sun_forecast")

    @property
    def available(self) -> bool:
        return super().available and self.coordinator.forecast_day is not None

    @property
    def native_value(self) -> str | None:
        day = self.coordinator.forecast_day
        return forecast_state(day.windows, dt_util.utcnow()) if day else None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        day = self.coordinator.forecast_day
        if day is None:
            return None
        now = dt_util.utcnow()
        best = best_window(day.windows, now)
        return {
            "windows": windows_attribute(day.windows, now),
            "best_window": windows_attribute([best], now)[0] if best else None,
            "hourly": hourly_attribute(day.hourly),
            "forecast_available": day.forecast_available,
            "forecast_resolution": self.coordinator.forecast_resolution,
            "source_entity": self.coordinator.settings.weather_entity,
        }


class SunTomorrowSensor(SunspotsEntity, SensorEntity):
    """When there will be sun tomorrow: first sunny window (else first partly sunny one)."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _unrecorded_attributes = frozenset({"windows", "best_window", "intervals"})

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "sun_tomorrow")

    @property
    def available(self) -> bool:
        return super().available and self.coordinator.tomorrow is not None

    @property
    def native_value(self) -> datetime | None:
        tomorrow = self.coordinator.tomorrow
        if tomorrow is None:
            return None
        for cls in ("sunny", "partly"):
            starts = [w.start for w in tomorrow.forecast.windows if w.cls == cls]
            if starts:
                return min(starts)
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        tomorrow = self.coordinator.tomorrow
        if tomorrow is None:
            return None
        now = dt_util.utcnow()
        best = best_window(tomorrow.forecast.windows, now)
        return {
            "intervals": [
                {
                    "start": dt_util.as_local(a).isoformat(timespec="seconds"),
                    "end": dt_util.as_local(b).isoformat(timespec="seconds"),
                }
                for a, b in tomorrow.intervals
            ],
            "sun_hours": round(
                sum((b - a).total_seconds() for a, b in tomorrow.intervals) / 3600, 2
            ),
            "windows": windows_attribute(tomorrow.forecast.windows, now),
            "best_window": windows_attribute([best], now)[0] if best else None,
            "forecast_available": tomorrow.forecast.forecast_available,
            "forecast_resolution": self.coordinator.forecast_resolution,
        }


class DataQualitySensor(SunspotsEntity, SensorEntity):
    """Skyline-weighted real-height coverage, with the data provenance as attributes."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_entity_registry_enabled_default = False
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_suggested_display_precision = 0

    def __init__(self, coordinator: SpotCoordinator) -> None:
        super().__init__(coordinator, "data_quality")

    @property
    def native_value(self) -> float | None:
        data = self.coordinator.data
        if data is None or data.model.coverage is None:
            return None
        return round(100 * data.model.coverage, 1)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        data = self.coordinator.data
        if data is None:
            return None
        return {
            "provider": data.meta.provider,
            "release": data.meta.release,
            "fetched_at": data.meta.fetched_at,
            "building_count": data.building_count,
            "height_source_percent": data.model.source_pct,
            "parts_with_min_height": data.model.parts_with_min_height,
            "height_overrides": len(data.corrections.overrides),
            "horizon_entries": len(data.corrections.entries),
        }


class SunnyNowSensor(SensorEntity):
    """Hub summary: how many spots are sunny right now."""

    _attr_has_entity_name = True
    _attr_translation_key = "sunny_now"
    _attr_should_poll = False

    def __init__(self, entry: SunspotsConfigEntry) -> None:
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_sunny_now"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name="Sunspots",
            entry_type=DeviceEntryType.SERVICE,
            manufacturer="Sunspots",
        )

    def _sunny_spots(self) -> list[SpotCoordinator]:
        now = dt_util.utcnow()
        return [
            c
            for c in self._entry.runtime_data.spots.values()
            if c.data is not None
            and (
                c.sunny_weather_aware(now) if c.settings.weather_entity else c.sunny_geometric(now)
            )
        ]

    @property
    def native_value(self) -> int:
        return len(self._sunny_spots())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        registry = er.async_get(self.hass)
        sunny = self._sunny_spots()
        now = dt_util.utcnow()
        upcoming = [
            (w, c)
            for c in self._entry.runtime_data.spots.values()
            if c.forecast_day is not None
            for w in c.forecast_day.windows
            if w.cls in ("sunny", "partly") and w.end > now
        ]
        upcoming.sort(key=lambda item: (item[0].cls != "sunny", item[0].start))
        next_window = None
        if upcoming:
            w, c = upcoming[0]
            next_window = {
                "spot": c.settings.name,
                "start": dt_util.as_local(w.start).isoformat(timespec="seconds"),
                "end": dt_util.as_local(w.end).isoformat(timespec="seconds"),
                "class": w.cls,
            }
        return {
            "next_window": next_window,
            "spots": [c.settings.name for c in sunny],
            "entity_ids": [
                eid
                for c in sunny
                if (
                    eid := registry.async_get_entity_id(
                        "binary_sensor", DOMAIN, f"{c.subentry_id}_sunny"
                    )
                )
            ],
        }

    async def async_added_to_hass(self) -> None:
        for coordinator in self._entry.runtime_data.spots.values():
            self.async_on_remove(coordinator.async_add_listener(self._handle_update))
        # the spots' binary sensors may register after this entity: refresh the entity_ids list
        self.async_on_remove(
            self.hass.bus.async_listen(
                er.EVENT_ENTITY_REGISTRY_UPDATED, self._handle_registry_update
            )
        )

    @callback
    def _handle_registry_update(self, event: Event[er.EventEntityRegistryUpdatedData]) -> None:
        if event.data["action"] == "create" and event.data["entity_id"].startswith(
            "binary_sensor."
        ):
            self.async_write_ha_state()

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()
