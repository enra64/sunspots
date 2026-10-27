"""Config flow: hub setup + options, and the spot subentry flows (add and reconfigure)."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, override

import probatio as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    OptionsFlow,
    SubentryFlowResult,
)
from homeassistant.const import CONF_LATITUDE, CONF_LONGITUDE, CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    LocationSelector,
    LocationSelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

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
    SOURCE_OVERPASS,
    SOURCE_OVERTURE,
    SUBENTRY_SPOT,
)
from .core.buildings import derive_buildings
from .core.const import LOW_COVERAGE_THRESHOLD, MAX_RADIUS_M, MIN_RADIUS_M
from .core.corrections import Corrections
from .core.providers.base import ProviderError
from .core.spot import build_spot_model
from .data import HubSettings, SpotSettings

CONF_CONTINUE_LOW = "continue_low_coverage"
CONF_LOCATION = "location"
CONF_HEIGHT = "height"
CONF_AZ_FROM = "azimuth_from"
CONF_AZ_TO = "azimuth_to"
CONF_ELEVATION = "elevation"
CONF_NOTE = "note"
CONF_DELETE = "delete"


def _number(minimum: float, maximum: float, step: float, unit: str | None = None) -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(
            min=minimum,
            max=maximum,
            step=step,
            mode=NumberSelectorMode.BOX,
            unit_of_measurement=unit,
        )
    )


def _hub_schema(defaults: dict[str, Any]) -> vol.Schema:
    schema: dict[Any, Any] = {
        vol.Required(CONF_DATA_SOURCE, default=defaults[CONF_DATA_SOURCE]): SelectSelector(
            SelectSelectorConfig(
                options=[SOURCE_OVERTURE, SOURCE_OVERPASS],
                translation_key=CONF_DATA_SOURCE,
                mode=SelectSelectorMode.DROPDOWN,
            )
        ),
        vol.Required(CONF_ALLOW_OVERPASS, default=defaults[CONF_ALLOW_OVERPASS]): BooleanSelector(),
        vol.Required(CONF_RADIUS, default=defaults[CONF_RADIUS]): _number(
            MIN_RADIUS_M, MAX_RADIUS_M, 10, "m"
        ),
        vol.Required(CONF_OBSERVER_HEIGHT, default=defaults[CONF_OBSERVER_HEIGHT]): _number(
            0, 5, 0.1, "m"
        ),
        vol.Required(CONF_FLOOR_HEIGHT, default=defaults[CONF_FLOOR_HEIGHT]): _number(
            2, 6, 0.1, "m"
        ),
        vol.Required(CONF_DEFAULT_HEIGHT, default=defaults[CONF_DEFAULT_HEIGHT]): _number(
            3, 60, 1, "m"
        ),
        vol.Required(
            CONF_CLOUD_THRESHOLD_SUNNY, default=defaults[CONF_CLOUD_THRESHOLD_SUNNY]
        ): _number(0, 100, 5, "%"),
        vol.Required(
            CONF_CLOUD_THRESHOLD_PARTLY, default=defaults[CONF_CLOUD_THRESHOLD_PARTLY]
        ): _number(0, 100, 5, "%"),
    }
    weather = vol.Optional(CONF_WEATHER_ENTITY)
    if defaults.get(CONF_WEATHER_ENTITY):
        weather = vol.Optional(CONF_WEATHER_ENTITY, default=defaults[CONF_WEATHER_ENTITY])
    schema[weather] = EntitySelector(EntitySelectorConfig(domain="weather"))
    return vol.Schema(schema)


def _validate_hub(user_input: dict[str, Any]) -> dict[str, str]:
    if user_input[CONF_DATA_SOURCE] == SOURCE_OVERPASS and not user_input[CONF_ALLOW_OVERPASS]:
        return {CONF_ALLOW_OVERPASS: "overpass_not_allowed"}
    if user_input[CONF_CLOUD_THRESHOLD_PARTLY] < user_input[CONF_CLOUD_THRESHOLD_SUNNY]:
        return {CONF_CLOUD_THRESHOLD_PARTLY: "partly_below_sunny"}
    return {}


def _normalise_hub(user_input: dict[str, Any]) -> dict[str, Any]:
    options = dict(user_input)
    options.setdefault(CONF_WEATHER_ENTITY, None)
    return options


class SunspotsConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up the (single) hub."""

    VERSION = 1
    MINOR_VERSION = 1

    @override
    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate_hub(user_input)
            if not errors:
                return self.async_create_entry(
                    title="Sunspots", data={}, options=_normalise_hub(user_input)
                )
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(
                _hub_schema(dict(HUB_DEFAULTS)), user_input
            ),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return SunspotsOptionsFlow()

    @classmethod
    @callback
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        return {SUBENTRY_SPOT: SpotSubentryFlow}


class SunspotsOptionsFlow(OptionsFlow):
    """Edit the shared settings."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _validate_hub(user_input)
            if not errors:
                return self.async_create_entry(data=_normalise_hub(user_input))
        current = {**HUB_DEFAULTS, **self.config_entry.options}
        return self.async_show_form(step_id="init", data_schema=_hub_schema(current), errors=errors)


@dataclass(slots=True)
class FetchSummary:
    building_count: int
    coverage: float | None
    provider: str


class SpotSubentryFlow(ConfigSubentryFlow):
    """Add a spot (fetch buildings, show quality) or reconfigure one."""

    def __init__(self) -> None:
        self._task: asyncio.Task[FetchSummary] | None = None
        self._pending: dict[str, Any] = {}
        self._summary: FetchSummary | None = None
        self._error: str = ""

    # ------------------------------------------------------------- helpers
    def _runtime(self) -> Any:
        entry = self._get_entry()
        return entry.runtime_data if entry.state is ConfigEntryState.LOADED else None

    def _location_schema(self, name: str | None, lat: float, lon: float) -> dict[Any, Any]:
        return {
            vol.Required(CONF_NAME, default=name or ""): TextSelector(),
            vol.Required(CONF_LOCATION, default={CONF_LATITUDE: lat, CONF_LONGITUDE: lon}): (
                LocationSelector(LocationSelectorConfig(radius=False))
            ),
        }

    async def _async_summarise(
        self,
        hass: HomeAssistant,
        lat: float,
        lon: float,
        radius: float,
        observer: float,
        ground: float,
    ) -> FetchSummary:
        runtime = self._runtime()
        chunkset = await runtime.buildings.async_fetch(lat, lon, radius)
        settings: HubSettings = runtime.settings
        spot = SpotSettings("", lat, lon, radius, observer, ground, None)
        params = spot.parameters(settings)
        features = [f for c in chunkset.chunks for f in c.features]

        def work() -> FetchSummary:
            derived = derive_buildings(features, lat, lon, radius)
            model = build_spot_model(
                derived.buildings, params, Corrections(), derived.parts_with_min_height
            )
            return FetchSummary(len(derived.buildings), model.coverage, chunkset.provider)

        return await hass.async_add_executor_job(work)

    def _progress(self, step_id: str, next_step: str) -> Any:
        """Shared progress handling for tasks that fetch data."""
        assert self._task is not None
        if not self._task.done():
            return self.async_show_progress(
                step_id=step_id, progress_action="fetch_buildings", progress_task=self._task
            )
        try:
            self._summary = self._task.result()
        except ProviderError as err:
            self._error = str(err)
            return self.async_show_progress_done(next_step_id="fetch_failed")
        finally:
            self._task = None
        return self.async_show_progress_done(next_step_id=next_step)

    async def async_step_fetch_failed(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        return self.async_abort(
            reason="fetch_failed", description_placeholders={"error": self._error}
        )

    # ------------------------------------------------------------- add spot
    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if self._runtime() is None:
            return self.async_abort(reason="entry_not_loaded")
        errors: dict[str, str] = {}
        if user_input is not None:
            loc = user_input[CONF_LOCATION]
            lat, lon = round(loc[CONF_LATITUDE], 6), round(loc[CONF_LONGITUDE], 6)
            unique_id = f"{lat:.5f},{lon:.5f}"
            entry = self._get_entry()
            if any(s.unique_id == unique_id for s in entry.subentries.values()):
                errors[CONF_LOCATION] = "already_configured"
            else:
                self._pending = {
                    CONF_NAME: user_input[CONF_NAME].strip(),
                    CONF_LATITUDE: lat,
                    CONF_LONGITUDE: lon,
                    "unique_id": unique_id,
                }
                return await self.async_step_fetch()
        hass = self.hass
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                self._location_schema(None, hass.config.latitude, hass.config.longitude)
            ),
            errors=errors,
        )

    async def async_step_fetch(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        if self._task is None:
            hub: HubSettings = self._runtime().settings
            self._task = self.hass.async_create_task(
                self._async_summarise(
                    self.hass,
                    self._pending[CONF_LATITUDE],
                    self._pending[CONF_LONGITUDE],
                    hub.radius,
                    hub.observer_height,
                    0.0,
                )
            )
        return self._progress("fetch", "summary")

    async def async_step_summary(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        assert self._summary is not None
        summary = self._summary
        low = summary.coverage is None or summary.coverage < LOW_COVERAGE_THRESHOLD
        errors: dict[str, str] = {}
        if user_input is not None:
            if not low or user_input.get(CONF_CONTINUE_LOW):
                return self.async_create_entry(
                    title=self._pending[CONF_NAME],
                    data={
                        CONF_LATITUDE: self._pending[CONF_LATITUDE],
                        CONF_LONGITUDE: self._pending[CONF_LONGITUDE],
                    },
                    unique_id=self._pending["unique_id"],
                )
            errors[CONF_CONTINUE_LOW] = "low_coverage_confirm"
        schema = vol.Schema(
            {vol.Required(CONF_CONTINUE_LOW, default=False): BooleanSelector()} if low else {}
        )
        return self.async_show_form(
            step_id="summary_low" if low else "summary",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "buildings": str(summary.building_count),
                "coverage": "n/a"
                if summary.coverage is None
                else f"{round(100 * summary.coverage)}%",
                "provider": summary.provider,
                "threshold": str(round(100 * LOW_COVERAGE_THRESHOLD)),
            },
        )

    async def async_step_summary_low(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        return await self.async_step_summary(user_input)

    # ------------------------------------------------------------ reconfigure
    def _coordinator(self) -> Any:
        return self._runtime().spots[self._get_reconfigure_subentry().subentry_id]

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        if (
            self._runtime() is None
            or self._get_reconfigure_subentry().subentry_id not in self._runtime().spots
        ):
            return self.async_abort(reason="entry_not_loaded")
        return self.async_show_menu(
            step_id="reconfigure", menu_options=["settings", "corrections", "refresh"]
        )

    async def async_step_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        subentry = self._get_reconfigure_subentry()
        hub: HubSettings = self._runtime().settings
        current = SpotSettings.from_subentry(subentry, hub)
        if user_input is not None:
            loc = user_input[CONF_LOCATION]
            data: dict[str, Any] = {
                CONF_LATITUDE: round(loc[CONF_LATITUDE], 6),
                CONF_LONGITUDE: round(loc[CONF_LONGITUDE], 6),
                CONF_RADIUS: user_input[CONF_RADIUS],
                CONF_OBSERVER_HEIGHT: user_input[CONF_OBSERVER_HEIGHT],
                CONF_GROUND_OFFSET: user_input[CONF_GROUND_OFFSET],
            }
            if user_input.get(CONF_WEATHER_ENTITY):
                data[CONF_WEATHER_ENTITY] = user_input[CONF_WEATHER_ENTITY]
            self._pending = {"data": data, "title": user_input[CONF_NAME].strip()}
            return await self.async_step_refetch()
        weather = vol.Optional(CONF_WEATHER_ENTITY)
        if current.weather_entity and subentry.data.get(CONF_WEATHER_ENTITY):
            weather = vol.Optional(CONF_WEATHER_ENTITY, default=current.weather_entity)
        schema = {
            **self._location_schema(current.name, current.latitude, current.longitude),
            vol.Required(CONF_RADIUS, default=current.radius): _number(
                MIN_RADIUS_M, MAX_RADIUS_M, 10, "m"
            ),
            vol.Required(CONF_OBSERVER_HEIGHT, default=current.observer_height): _number(
                0, 5, 0.1, "m"
            ),
            vol.Required(CONF_GROUND_OFFSET, default=current.ground_offset): _number(
                -20, 50, 0.1, "m"
            ),
            weather: EntitySelector(EntitySelectorConfig(domain="weather")),
        }
        return self.async_show_form(step_id="settings", data_schema=vol.Schema(schema))

    async def async_step_refetch(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        """Make sure tiles for the new location/radius are cached before saving."""
        if self._task is None:
            data = self._pending["data"]
            hub: HubSettings = self._runtime().settings
            self._task = self.hass.async_create_task(
                self._async_summarise(
                    self.hass,
                    data[CONF_LATITUDE],
                    data[CONF_LONGITUDE],
                    data.get(CONF_RADIUS, hub.radius),
                    data[CONF_OBSERVER_HEIGHT],
                    data[CONF_GROUND_OFFSET],
                )
            )
        return self._progress("refetch", "save_settings")

    async def async_step_save_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        entry = self._get_entry()
        subentry = self._get_reconfigure_subentry()
        pending = self._pending["data"]
        new_unique = f"{pending[CONF_LATITUDE]:.5f},{pending[CONF_LONGITUDE]:.5f}"
        if any(
            s.unique_id == new_unique and s.subentry_id != subentry.subentry_id
            for s in entry.subentries.values()
        ):
            return self.async_abort(reason="already_configured")
        return self.async_update_and_abort(
            entry,
            subentry,
            data=self._pending["data"],
            title=self._pending["title"],
            unique_id=new_unique,
        )

    async def async_step_corrections(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        return self.async_show_menu(
            step_id="corrections",
            menu_options=["add_height", "add_obstacle", "delete_corrections"],
        )

    async def async_step_add_height(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            loc = user_input[CONF_LOCATION]
            try:
                await self._coordinator().async_set_building_height(
                    loc[CONF_LATITUDE], loc[CONF_LONGITUDE], user_input[CONF_HEIGHT]
                )
            except ServiceValidationError:
                errors[CONF_LOCATION] = "no_building_at_location"
            else:
                return self.async_abort(reason="correction_added")
        coordinator = self._coordinator()
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_LOCATION,
                    default={
                        CONF_LATITUDE: coordinator.settings.latitude,
                        CONF_LONGITUDE: coordinator.settings.longitude,
                    },
                ): LocationSelector(LocationSelectorConfig(radius=False)),
                vol.Required(CONF_HEIGHT, default=15): _number(0.5, 500, 0.5, "m"),
            }
        )
        return self.async_show_form(step_id="add_height", data_schema=schema, errors=errors)

    async def async_step_add_obstacle(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await self._coordinator().async_add_obstacle(
                    user_input[CONF_AZ_FROM],
                    user_input[CONF_AZ_TO],
                    user_input[CONF_ELEVATION],
                    user_input.get(CONF_NOTE),
                )
            except ServiceValidationError:
                errors["base"] = "invalid_obstacle"
            else:
                return self.async_abort(reason="correction_added")
        schema = vol.Schema(
            {
                vol.Required(CONF_AZ_FROM, default=90): _number(0, 360, 1, "°"),
                vol.Required(CONF_AZ_TO, default=120): _number(0, 360, 1, "°"),
                vol.Required(CONF_ELEVATION, default=20): _number(1, 90, 1, "°"),
                vol.Optional(CONF_NOTE): TextSelector(),
            }
        )
        return self.async_show_form(step_id="add_obstacle", data_schema=schema, errors=errors)

    async def async_step_delete_corrections(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        coordinator = self._coordinator()
        corrections: Corrections = coordinator.data.corrections
        options = [
            SelectOptionDict(
                value=o.id, label=f"{o.height_m:g} m @ {o.lat:.5f}, {o.lon:.5f} ({o.created[:10]})"
            )
            for o in corrections.overrides
        ] + [
            SelectOptionDict(
                value=e.id,
                label=(
                    f"{e.kind} {e.azimuth_from:g}°–{e.azimuth_to:g}° @ {e.elevation_deg:g}° "
                    f"[{e.source}] {e.note or ''}"
                ).strip(),
            )
            for e in corrections.entries
        ]
        if not options:
            return self.async_abort(reason="no_corrections")
        if user_input is not None:
            await coordinator.async_remove_corrections(list(user_input[CONF_DELETE]))
            return self.async_abort(reason="correction_deleted")
        schema = vol.Schema(
            {
                vol.Required(CONF_DELETE): SelectSelector(
                    SelectSelectorConfig(
                        options=options, multiple=True, mode=SelectSelectorMode.LIST
                    )
                )
            }
        )
        return self.async_show_form(step_id="delete_corrections", data_schema=schema)

    async def async_step_refresh(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        if self._task is None:
            self._task = self.hass.async_create_task(self._async_refresh())
        if not self._task.done():
            return self.async_show_progress(
                step_id="refresh", progress_action="fetch_buildings", progress_task=self._task
            )
        try:
            self._task.result()
        except ServiceValidationError as err:
            self._error = str(err)
            self._task = None
            return self.async_show_progress_done(next_step_id="fetch_failed")
        self._task = None
        return self.async_show_progress_done(next_step_id="refresh_done")

    async def _async_refresh(self) -> Any:
        await self._coordinator().async_refresh_buildings()

    async def async_step_refresh_done(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        return self.async_abort(reason="refresh_done")
