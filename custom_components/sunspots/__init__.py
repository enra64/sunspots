"""Sunspots: is this outdoor spot in direct sun now, and when does that change?"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import probatio as vol
from homeassistant.const import CONF_LATITUDE, CONF_LONGITUDE, Platform
from homeassistant.core import HomeAssistant, SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import service
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .buildings_service import BuildingsService
from .const import (
    DOMAIN,
    SERVICE_CALIBRATE,
    SERVICE_GET_SUN_FORECAST,
    SERVICE_REFRESH_BUILDINGS,
    SERVICE_SET_BUILDING_HEIGHT,
    SUBENTRY_SPOT,
)
from .coordinator import SpotCoordinator
from .data import (
    DATA_DOMAIN,
    DomainData,
    HubSettings,
    SunspotsConfigEntry,
    SunspotsRuntime,
    TileCache,
    spot_store,
)
from .issues import async_update_coverage_issue

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.BINARY_SENSOR, Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# Spots refreshed before the platforms load; the rest are computed in the background, staggered.
INLINE_SPOTS = 5


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Create domain-wide singletons and register the entity services."""
    hass.data[DATA_DOMAIN] = DomainData(tiles=TileCache(hass))

    def register(name: str, schema: dict[Any, Any], func: str, response: SupportsResponse) -> None:
        service.async_register_platform_entity_service(
            hass,
            DOMAIN,
            name,
            entity_domain=Platform.BINARY_SENSOR,
            schema=schema,
            func=func,
            supports_response=response,
        )

    register(
        SERVICE_GET_SUN_FORECAST,
        {vol.Optional("date"): cv.date},
        "async_get_sun_forecast",
        SupportsResponse.ONLY,
    )
    register(SERVICE_REFRESH_BUILDINGS, {}, "async_refresh_buildings", SupportsResponse.NONE)
    register(
        SERVICE_SET_BUILDING_HEIGHT,
        {
            vol.Required(CONF_LATITUDE): cv.latitude,
            vol.Required(CONF_LONGITUDE): cv.longitude,
            vol.Required("height"): vol.All(vol.Coerce(float), vol.Range(min=0.5, max=500)),
        },
        "async_set_building_height",
        SupportsResponse.NONE,
    )
    register(
        SERVICE_CALIBRATE,
        {
            vol.Required("observed"): vol.In(["sunny", "shaded"]),
            vol.Optional("at"): cv.datetime,
        },
        "async_calibrate",
        SupportsResponse.OPTIONAL,
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: SunspotsConfigEntry) -> bool:
    """Set up the hub and one coordinator per spot subentry."""
    settings = HubSettings.from_options(entry.options)
    integration = await async_get_integration(hass, DOMAIN)
    service_ = BuildingsService(
        hass, hass.data[DATA_DOMAIN].tiles, settings, str(integration.version)
    )
    runtime = SunspotsRuntime(settings=settings, buildings=service_)
    entry.runtime_data = runtime

    for subentry in entry.subentries.values():
        if subentry.subentry_type != SUBENTRY_SPOT:
            continue
        coordinator = SpotCoordinator(hass, entry, subentry, settings, service_)
        runtime.spots[subentry.subentry_id] = coordinator
        entry.async_on_unload(coordinator.async_shutdown)

    coordinators = list(runtime.spots.values())
    ready = await asyncio.gather(*(c.async_initialize() for c in coordinators))
    loaded = [c for c, ok in zip(coordinators, ready, strict=True) if ok]
    for coordinator in loaded[:INLINE_SPOTS]:
        await coordinator.async_refresh()
    if loaded[INLINE_SPOTS:]:
        entry.async_create_background_task(
            hass, _refresh_staggered(hass, entry, loaded[INLINE_SPOTS:]), "sunspots initial refresh"
        )
    for coordinator in loaded:
        entry.async_on_unload(
            coordinator.async_add_listener(lambda: async_update_coverage_issue(hass, entry))
        )
    async_update_coverage_issue(hass, entry)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def _refresh_staggered(
    hass: HomeAssistant, entry: SunspotsConfigEntry, coordinators: list[SpotCoordinator]
) -> None:
    for coordinator in coordinators:
        await coordinator.async_refresh()
        await asyncio.sleep(0)  # yield to the loop between spots
    async_update_coverage_issue(hass, entry)


async def _async_update_listener(hass: HomeAssistant, entry: SunspotsConfigEntry) -> None:
    """Options or subentries changed: forget removed spots' stores, then reload from cache."""
    current = {s.subentry_id for s in entry.subentries.values() if s.subentry_type == SUBENTRY_SPOT}
    for subentry_id in set(entry.runtime_data.spots) - current:
        await spot_store(hass, subentry_id).async_remove()
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: SunspotsConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: SunspotsConfigEntry) -> None:
    """Wipe all storage when the hub is removed."""
    for subentry in entry.subentries.values():
        await spot_store(hass, subentry.subentry_id).async_remove()
    await hass.data[DATA_DOMAIN].tiles.async_remove_all()


async def async_migrate_entry(hass: HomeAssistant, entry: SunspotsConfigEntry) -> bool:
    """Bring older entries up to the current version; refuse to downgrade."""
    if entry.version > 1:
        return False
    if entry.minor_version < 1:
        hass.config_entries.async_update_entry(entry, minor_version=1)
    return True
