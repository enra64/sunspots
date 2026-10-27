"""Typed runtime data, hub settings, and the persistent stores."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import CONF_LATITUDE, CONF_LONGITUDE
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util.hass_dict import HassKey

from .const import (
    CONF_ALLOW_OVERPASS,
    CONF_CLOUD_THRESHOLD_PARTLY,
    CONF_CLOUD_THRESHOLD_SUNNY,
    CONF_DATA_SOURCE,
    CONF_DEFAULT_HEIGHT,
    CONF_FLOOR_HEIGHT,
    CONF_GROUND_OFFSET,
    CONF_OBSERVER_HEIGHT,
    CONF_RADIUS,
    CONF_WEATHER_ENTITY,
    DOMAIN,
    HUB_DEFAULTS,
)
from .core.heights import HeightSettings
from .core.providers.base import Chunk
from .core.spot import SpotParameters

if TYPE_CHECKING:
    from .buildings_service import BuildingsService
    from .coordinator import SpotCoordinator
    from .forecast_manager import ForecastManager

STORAGE_VERSION = 1
STORAGE_MINOR_VERSION = 1

type SunspotsConfigEntry = ConfigEntry[SunspotsRuntime]


@dataclass(frozen=True, slots=True)
class HubSettings:
    """Hub-level settings (config entry options merged over defaults)."""

    data_source: str
    allow_overpass: bool
    radius: float
    observer_height: float
    floor_height: float
    default_height: float
    weather_entity: str | None
    cloud_threshold_sunny: float
    cloud_threshold_partly: float

    @classmethod
    def from_options(cls, options: Mapping[str, Any]) -> HubSettings:
        merged = {**HUB_DEFAULTS, **options}
        return cls(
            data_source=str(merged[CONF_DATA_SOURCE]),
            allow_overpass=bool(merged[CONF_ALLOW_OVERPASS]),
            radius=float(merged[CONF_RADIUS]),
            observer_height=float(merged[CONF_OBSERVER_HEIGHT]),
            floor_height=float(merged[CONF_FLOOR_HEIGHT]),
            default_height=float(merged[CONF_DEFAULT_HEIGHT]),
            weather_entity=merged.get(CONF_WEATHER_ENTITY) or None,
            cloud_threshold_sunny=float(merged[CONF_CLOUD_THRESHOLD_SUNNY]),
            cloud_threshold_partly=float(merged[CONF_CLOUD_THRESHOLD_PARTLY]),
        )

    @property
    def heights(self) -> HeightSettings:
        return HeightSettings(self.floor_height, self.default_height)


@dataclass(frozen=True, slots=True)
class SpotSettings:
    """Effective settings of one spot: hub defaults overridden by the subentry data."""

    name: str
    latitude: float
    longitude: float
    radius: float
    observer_height: float
    ground_offset: float
    weather_entity: str | None

    @classmethod
    def from_subentry(cls, subentry: ConfigSubentry, hub: HubSettings) -> SpotSettings:
        d = subentry.data
        return cls(
            name=subentry.title,
            latitude=float(d[CONF_LATITUDE]),
            longitude=float(d[CONF_LONGITUDE]),
            radius=float(d.get(CONF_RADIUS, hub.radius)),
            observer_height=float(d.get(CONF_OBSERVER_HEIGHT, hub.observer_height)),
            ground_offset=float(d.get(CONF_GROUND_OFFSET, 0.0)),
            weather_entity=d.get(CONF_WEATHER_ENTITY) or hub.weather_entity,
        )

    def parameters(self, hub: HubSettings) -> SpotParameters:
        return SpotParameters(
            lat=self.latitude,
            lon=self.longitude,
            radius=self.radius,
            observer_height=self.observer_height,
            ground_offset=self.ground_offset,
            heights=hub.heights,
        )


@dataclass(slots=True)
class SunspotsRuntime:
    """Runtime data of the hub entry."""

    settings: HubSettings
    buildings: BuildingsService
    forecasts: ForecastManager
    spots: dict[str, SpotCoordinator] = field(default_factory=dict)


class _SunspotsStore(Store[dict[str, Any]]):
    """Store with a migration hook (legacy minor version 0 forces a recompute)."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        if old_major_version == STORAGE_VERSION:
            data = dict(old_data)
            meta = dict(data.get("meta", {}))
            meta["algo_version"] = 0  # recompute the horizon from cached buildings
            data["meta"] = meta
            return data
        raise NotImplementedError(f"cannot migrate storage version {old_major_version}")


def spot_store(hass: HomeAssistant, subentry_id: str) -> Store[dict[str, Any]]:
    return _SunspotsStore(
        hass, STORAGE_VERSION, f"{DOMAIN}.spot.{subentry_id}", minor_version=STORAGE_MINOR_VERSION
    )


class TileCache:
    """Domain-level cache of provider chunks, shared by all spots."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._index = _SunspotsStore(
            hass, STORAGE_VERSION, f"{DOMAIN}.tile_index", minor_version=STORAGE_MINOR_VERSION
        )

    def _store(self, key: str) -> Store[dict[str, Any]]:
        return _SunspotsStore(
            self._hass, STORAGE_VERSION, f"{DOMAIN}.tile.{key}", minor_version=STORAGE_MINOR_VERSION
        )

    async def async_get(self, key: str) -> Chunk | None:
        data = await self._store(key).async_load()
        return Chunk.from_dict(data) if data else None

    async def async_put(self, chunk: Chunk) -> None:
        await self._store(chunk.key).async_save(chunk.to_dict())
        index = await self._index.async_load() or {"keys": []}
        if chunk.key not in index["keys"]:
            index["keys"].append(chunk.key)
            await self._index.async_save(index)

    async def async_remove_all(self) -> None:
        index = await self._index.async_load() or {"keys": []}
        for key in index["keys"]:
            await self._store(key).async_remove()
        await self._index.async_remove()


@dataclass(slots=True)
class DomainData:
    """Domain-wide singletons created in async_setup."""

    tiles: TileCache


DATA_DOMAIN: HassKey[DomainData] = HassKey(DOMAIN)
