"""Base entity and the entity-service implementations shared by the spot's binary sensors."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import date, datetime
from typing import Any

from homeassistant.core import ServiceResponse
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import SpotCoordinator, local_day_bounds
from .core.forecast import HourRow, Window


class SunspotsEntity(CoordinatorEntity[SpotCoordinator]):
    """An entity belonging to one spot's device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: SpotCoordinator, key: str) -> None:
        super().__init__(coordinator)
        self._attr_translation_key = key
        self._attr_unique_id = f"{coordinator.subentry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.subentry_id)},
            name=coordinator.settings.name,
            entry_type=DeviceEntryType.SERVICE,
            manufacturer="Sunspots",
        )

    @property
    def available(self) -> bool:
        return super().available and self.coordinator.data is not None

    @property
    def attribution(self) -> str | None:  # type: ignore[override]
        data = self.coordinator.data
        return data.meta.attribution if data else None


def _local_iso(value: datetime) -> str:
    return dt_util.as_local(value).isoformat(timespec="seconds")


def windows_attribute(windows: Iterable[Window], now: datetime) -> list[dict[str, Any]]:
    """Windows as service/attribute data; past windows stay with ``past: true``."""
    return [
        {
            "start": _local_iso(w.start),
            "end": _local_iso(w.end),
            "class": w.cls,
            "past": w.end <= now,
        }
        for w in windows
    ]


def hourly_attribute(rows: Iterable[HourRow]) -> list[dict[str, Any]]:
    return [
        {
            "start": _local_iso(r.start),
            "sunlit_fraction": r.sunlit_fraction,
            "cloud": None if r.cloud is None else round(r.cloud),
            "class": r.cls,
        }
        for r in rows
    ]


class SpotServicesMixin:
    """Entity-service handlers; bound via ``async_register_platform_entity_service``."""

    coordinator: SpotCoordinator

    async def async_get_sun_forecast(self, date: date | None = None) -> ServiceResponse:
        day = date or dt_util.now().date()
        result = await self.coordinator.async_day(day)
        start, end = local_day_bounds(day)
        sun_seconds = sum((b - a).total_seconds() for a, b in result.intervals)
        now = dt_util.utcnow()
        is_today = start <= now < end
        response: dict[str, Any] = {
            "date": day.isoformat(),
            "source": "geometry+weather" if result.forecast.forecast_available else "geometry",
            "intervals": [
                {"start": _local_iso(a), "end": _local_iso(b)} for a, b in result.intervals
            ],
            "sun_hours": round(sun_seconds / 3600, 2),
            "windows": windows_attribute(result.forecast.windows, now),
            "hourly": hourly_attribute(result.forecast.hourly),
            "forecast_available": result.forecast.forecast_available,
            "forecast_resolution": self.coordinator.forecast_resolution,
        }
        if is_today:
            change = self.coordinator.data.timeline.next_change(now)
            response["sunny_now"] = self.coordinator.sunny_geometric(now)
            response["next_change"] = _local_iso(change) if change else None
        return response

    async def async_refresh_buildings(self) -> None:
        await self.coordinator.async_refresh_buildings()

    async def async_set_building_height(
        self, latitude: float, longitude: float, height: float
    ) -> None:
        await self.coordinator.async_set_building_height(latitude, longitude, height)

    async def async_calibrate(self, observed: str, at: datetime | None = None) -> ServiceResponse:
        entry_id = await self.coordinator.async_calibrate(observed, at)
        return {"result": "created" if entry_id else "consistent", "entry_id": entry_id}
