"""Constants for the Sunspots integration."""

from __future__ import annotations

from typing import Final

from .core.const import (
    DEFAULT_BUILDING_HEIGHT_M,
    DEFAULT_FLOOR_HEIGHT_M,
    DEFAULT_OBSERVER_HEIGHT_M,
    DEFAULT_RADIUS_M,
)
from .core.forecast import DEFAULT_CLOUD_THRESHOLD_PARTLY, DEFAULT_CLOUD_THRESHOLD_SUNNY

DOMAIN: Final = "sunspots"
SUBENTRY_SPOT: Final = "spot"
USER_AGENT_TEMPLATE: Final = "Sunspots/{version} (+https://github.com/enra64/sunspots)"

# Hub options
CONF_DATA_SOURCE: Final = "data_source"
CONF_ALLOW_OVERPASS: Final = "allow_overpass"
CONF_RADIUS: Final = "radius"
CONF_OBSERVER_HEIGHT: Final = "observer_height"
CONF_FLOOR_HEIGHT: Final = "floor_height"
CONF_DEFAULT_HEIGHT: Final = "default_building_height"
CONF_WEATHER_ENTITY: Final = "weather_entity"
CONF_CLOUD_THRESHOLD_SUNNY: Final = "cloud_threshold_sunny"
CONF_CLOUD_THRESHOLD_PARTLY: Final = "cloud_threshold_partly"

# Spot data (in addition to the standard latitude/longitude/name keys)
CONF_GROUND_OFFSET: Final = "ground_offset"

SOURCE_OVERTURE: Final = "overture"
SOURCE_OVERPASS: Final = "overpass"

HUB_DEFAULTS: Final[dict[str, object]] = {
    CONF_DATA_SOURCE: SOURCE_OVERTURE,
    CONF_ALLOW_OVERPASS: False,
    CONF_RADIUS: DEFAULT_RADIUS_M,
    CONF_OBSERVER_HEIGHT: DEFAULT_OBSERVER_HEIGHT_M,
    CONF_FLOOR_HEIGHT: DEFAULT_FLOOR_HEIGHT_M,
    CONF_DEFAULT_HEIGHT: DEFAULT_BUILDING_HEIGHT_M,
    CONF_CLOUD_THRESHOLD_SUNNY: DEFAULT_CLOUD_THRESHOLD_SUNNY,
    CONF_CLOUD_THRESHOLD_PARTLY: DEFAULT_CLOUD_THRESHOLD_PARTLY,
}

# Services
SERVICE_GET_SUN_FORECAST: Final = "get_sun_forecast"
SERVICE_REFRESH_BUILDINGS: Final = "refresh_buildings"
SERVICE_SET_BUILDING_HEIGHT: Final = "set_building_height"
SERVICE_CALIBRATE: Final = "calibrate"
SERVICE_RENDER_SHADOW_MAP: Final = "render_shadow_map"
STATIC_URL: Final = "/sunspots_static"
CARD_FILE: Final = "sunspots-card.js"
MAP_PAYLOAD_BUDGET: Final = 300_000
MAP_CACHE_SECONDS: Final = 300

# Repairs
ISSUE_LOW_COVERAGE: Final = "low_coverage"
ISSUE_BUILDINGS_UNAVAILABLE: Final = "buildings_unavailable"

REFRESH_INTERVAL_DAYS: Final = 90
