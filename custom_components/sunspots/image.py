"""Shadow-map image entity: a top-down SVG for 'now', rendered lazily and cached."""

from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.components.image import ImageEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN, MAP_CACHE_SECONDS
from .coordinator import SpotCoordinator
from .data import SunspotsConfigEntry

PARALLEL_UPDATES = 1


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SunspotsConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    for subentry_id, coordinator in entry.runtime_data.spots.items():
        async_add_entities([ShadowMapImage(hass, coordinator)], config_subentry_id=subentry_id)


class ShadowMapImage(ImageEntity):
    """SVG of the buildings and their shadows at the current time.

    Re-rendered at most every five minutes; while the sun is below the horizon the
    buildings-only image is served until it rises (or the data changes).
    """

    _attr_has_entity_name = True
    _attr_translation_key = "shadow_map"
    _attr_content_type = "image/svg+xml"

    def __init__(self, hass: HomeAssistant, coordinator: SpotCoordinator) -> None:
        super().__init__(hass)
        self._coordinator = coordinator
        self._attr_unique_id = f"{coordinator.subentry_id}_shadow_map"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.subentry_id)},
            name=coordinator.settings.name,
            entry_type=DeviceEntryType.SERVICE,
            manufacturer="Sunspots",
        )
        self._cached: bytes | None = None
        self._rendered_at: datetime | None = None
        self._cache_key: object = None
        self._night = False

    @property
    def available(self) -> bool:
        return self._coordinator.data is not None

    @property
    def attribution(self) -> str | None:
        data = self._coordinator.data
        return data.meta.attribution if data else None

    def _cache_valid(self, now: datetime) -> bool:
        data = self._coordinator.data
        if self._cached is None or self._rendered_at is None or data is None:
            return False
        if self._cache_key != (id(data.model), len(data.corrections.entries)):
            return False
        if self._night:
            _, elevation = self._coordinator.sun_position_now(now)
            return elevation <= 0
        return now - self._rendered_at < timedelta(seconds=MAP_CACHE_SECONDS)

    async def async_image(self) -> bytes | None:
        now = dt_util.utcnow()
        data = self._coordinator.data
        if data is None:
            return None
        if not self._cache_valid(now):
            result = await self._coordinator.async_render_map(now)
            self._cached = result.svg.encode()
            self._rendered_at = now
            self._night = result.sun_elevation <= 0
            self._cache_key = (id(data.model), len(data.corrections.entries))
            self._attr_image_last_updated = now
        return self._cached
