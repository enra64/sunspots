"""Per-spot coordinator: loads buildings, keeps the horizon and the sunlit timeline current."""

from __future__ import annotations

import asyncio
import logging
import time as time_module
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import TYPE_CHECKING, Any, NoReturn
from uuid import uuid4

import numpy as np
from homeassistant.config_entries import ConfigSubentry
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import (
    async_call_later,
    async_track_point_in_utc_time,
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .buildings_service import BuildingsService, ChunkSet
from .const import DOMAIN, MAP_PAYLOAD_BUDGET, REFRESH_INTERVAL_DAYS
from .core.buildings import derive_buildings
from .core.const import ALGO_VERSION, SUN_DISC_MARGIN_DEG
from .core.corrections import (
    Corrections,
    HeightOverride,
    HorizonEntry,
    calibration_entry,
    match_building,
    override_heights,
    validate_entry,
)
from .core.forecast import (
    CloudGate,
    DayForecast,
    build_day_forecast,
    cloud_percent,
)
from .core.heights import resolve_all
from .core.horizon import FloatArray, horizon_at
from .core.models import Building
from .core.providers.base import ProviderError
from .core.render import shadow_polygons, to_svg
from .core.solar import sun_position
from .core.spot import SpotModel, build_spot_model, final_horizon
from .core.timeline import Timeline, compute_timeline, is_sunny
from .data import HubSettings, SpotSettings, spot_store
from .issues import async_create_buildings_issue, async_delete_buildings_issue

if TYPE_CHECKING:
    from .data import SunspotsConfigEntry

_LOGGER = logging.getLogger(__name__)

TICK = timedelta(minutes=1)
RETRY_DELAY = timedelta(minutes=15)
REFRESH_CHECK = timedelta(days=1)
RECOMPUTE_EVERY_TICKS = 5


@dataclass(slots=True)
class SpotMeta:
    """Where the spot's building data came from."""

    provider: str
    release: str | None
    fetched_at: str
    attribution: str
    chunk_keys: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "release": self.release,
            "fetched_at": self.fetched_at,
            "attribution": self.attribution,
            "chunk_keys": self.chunk_keys,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> SpotMeta:
        return cls(d["provider"], d["release"], d["fetched_at"], d["attribution"], d["chunk_keys"])


@dataclass(slots=True)
class SpotData:
    """Everything entities need; replaced wholesale on every update."""

    meta: SpotMeta
    model: SpotModel
    corrections: Corrections
    horizon: FloatArray
    timeline: Timeline
    window_date: date
    building_count: int


MAP_TEXT = {
    "en": {
        "below": "sun below horizon",
        "title": "Shadow map of {name}",
        "sun": "sun {az}° / {el}°",
    },
    "de": {
        "below": "Sonne unter dem Horizont",
        "title": "Schattenkarte von {name}",
        "sun": "Sonne {az}° / {el}°",
    },
}
MAP_ZOOM_STEPS = (1.0, 0.6, 0.4)


@dataclass(slots=True)
class MapResult:
    """A rendered shadow map."""

    svg: str
    time: datetime
    sun_azimuth: float
    sun_elevation: float


@dataclass(slots=True)
class DayResult:
    """Sunlit intervals and forecast windows for one local day."""

    intervals: list[tuple[datetime, datetime]]
    forecast: DayForecast


def local_window(now: datetime) -> tuple[datetime, datetime]:
    """UTC bounds of [local midnight today, local midnight in two days)."""
    tz = dt_util.get_default_time_zone()
    day = now.astimezone(tz).date()
    start = datetime.combine(day, time.min, tzinfo=tz)
    end = datetime.combine(day + timedelta(days=2), time.min, tzinfo=tz)
    return start.astimezone(UTC), end.astimezone(UTC)


def local_day_bounds(day: date) -> tuple[datetime, datetime]:
    tz = dt_util.get_default_time_zone()
    return (
        datetime.combine(day, time.min, tzinfo=tz).astimezone(UTC),
        datetime.combine(day + timedelta(days=1), time.min, tzinfo=tz).astimezone(UTC),
    )


def _horizon_signature(
    settings: SpotSettings, hub: HubSettings, corrections: Corrections
) -> dict[str, Any]:
    return {
        "h_obs": round(settings.observer_height + settings.ground_offset, 3),
        "floor": hub.floor_height,
        "default": hub.default_height,
        "overrides": [[o.lat, o.lon, o.height_m] for o in corrections.overrides],
    }


class SpotCoordinator(DataUpdateCoordinator[SpotData]):
    """Owns one spot's data; entities read from it and are notified on change."""

    config_entry: SunspotsConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: SunspotsConfigEntry,
        subentry: ConfigSubentry,
        hub: HubSettings,
        service: BuildingsService,
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN}_{subentry.subentry_id}",
            update_interval=None,
        )
        self.subentry_id = subentry.subentry_id
        self.settings = SpotSettings.from_subentry(subentry, hub)
        self._hub = hub
        self._service = service
        self._store = spot_store(hass, subentry.subentry_id)
        self._buildings: list[Building] = []
        self._parts_min = 0
        self._corrections = Corrections()
        self._dirty = True
        self._unsub_point: CALLBACK_TYPE | None = None
        self._unsub_tick: CALLBACK_TYPE | None = None
        self._unsub_check: CALLBACK_TYPE | None = None
        self._unsub_retry: CALLBACK_TYPE | None = None
        self._unsub_weather: CALLBACK_TYPE | None = None
        self._ticks = 0
        self.gate = CloudGate(hub.cloud_threshold_sunny)
        self.cloud: float | None = None
        self.forecast_day: DayForecast | None = None
        self.tomorrow: DayResult | None = None
        self._unsub_forecast: CALLBACK_TYPE | None = None
        self._model: SpotModel
        self._meta: SpotMeta
        self.timings: dict[str, float] = {}
        self._inflight: dict[tuple[str, ...], asyncio.Task[Any]] = {}
        self._unavailable_logged = False

    # ------------------------------------------------------------------ loading
    async def async_initialize(self) -> bool:
        """Load data and start timers; on failure schedule a retry (never raises)."""
        try:
            await self._load()
        except UpdateFailed as err:
            if self._shutdown_requested:
                return False
            # warn once; the 15-minute retries log at debug level until the spot recovers
            log = _LOGGER.debug if self._unavailable_logged else _LOGGER.warning
            log("Spot %s could not be loaded: %s", self.settings.name, err)
            self._unavailable_logged = True
            self.async_start_retry()
            return False
        if self._shutdown_requested:  # unloaded while loading (a retry that outlived the entry)
            return False
        self._start_timers()
        return True

    @callback
    def _start_timers(self) -> None:
        self._unsub_tick = async_track_time_interval(self.hass, self._async_tick, TICK)
        self._unsub_check = async_track_time_interval(
            self.hass, self._async_check_refresh, REFRESH_CHECK
        )
        if self.settings.weather_entity:
            self._unsub_weather = async_track_state_change_event(
                self.hass, [self.settings.weather_entity], self._async_weather_changed
            )
            self._read_weather()
            self._unsub_forecast = self.config_entry.runtime_data.forecasts.async_subscribe(
                self.settings.weather_entity, self._async_forecast_updated
            )

    async def _load(self) -> None:
        stored = await self._store.async_load()
        params = self.settings.parameters(self._hub)
        meta: SpotMeta | None = None
        model: SpotModel | None = None
        if stored:
            self._corrections = Corrections.from_dict(stored.get("corrections", {}))
            sig = stored.get("meta", {})
            if (
                sig.get("location") == [params.lat, params.lon, params.radius]
                and "buildings" in stored
            ):
                self._buildings = [Building.from_dict(b) for b in stored["buildings"]]
                self._parts_min = int(sig.get("parts_with_min_height", 0))
                meta = SpotMeta.from_dict(stored["source"])
                if sig.get("algo_version") == ALGO_VERSION and sig.get(
                    "horizon"
                ) == _horizon_signature(self.settings, self._hub, self._corrections):
                    q = stored["quality"]
                    model = SpotModel(
                        np.array(stored["horizon"], dtype=np.float64),
                        q["coverage"],
                        q["source_pct"],
                        q["building_count"],
                        self._parts_min,
                    )
        if meta is None:
            provider = (stored or {}).get("source", {}).get("provider")
            chunkset = await self._service.async_from_cache(
                params.lat, params.lon, params.radius, provider
            )
            if chunkset is None:
                try:
                    chunkset = await self._service.async_fetch(
                        params.lat, params.lon, params.radius
                    )
                except ProviderError as err:
                    self._raise_unavailable(err)
            await self._rebuild(chunkset)
            return
        if model is None:
            model = await self.hass.async_add_executor_job(self._compute_model)
            self._model = model
            await self._save(meta)
        self._model = model
        self._meta = meta

    def _raise_unavailable(self, err: ProviderError) -> NoReturn:
        async_create_buildings_issue(
            self.hass, self.subentry_id, self.settings.name, str(err), ir.IssueSeverity.ERROR
        )
        raise UpdateFailed(f"building data unavailable: {err}") from err

    def _compute_model(self) -> SpotModel:
        return build_spot_model(
            self._buildings, self.settings.parameters(self._hub), self._corrections, self._parts_min
        )

    async def _rebuild(self, chunkset: ChunkSet) -> None:
        """Derive buildings from chunks, compute the model and persist."""
        params = self.settings.parameters(self._hub)
        features = [f for c in chunkset.chunks for f in c.features]

        def work() -> tuple[list[Building], int, SpotModel]:
            t0 = time_module.perf_counter()
            derived = derive_buildings(features, params.lat, params.lon, params.radius)
            model = build_spot_model(
                derived.buildings, params, self._corrections, derived.parts_with_min_height
            )
            self.timings["rebuild_s"] = round(time_module.perf_counter() - t0, 3)
            return derived.buildings, derived.parts_with_min_height, model

        self._buildings, self._parts_min, self._model = await self.hass.async_add_executor_job(work)
        self._meta = SpotMeta(
            chunkset.provider,
            chunkset.release,
            chunkset.fetched_at,
            chunkset.chunks[0].attribution if chunkset.chunks else "",
            chunkset.keys,
        )
        await self._save(self._meta)

    async def _save(self, meta: SpotMeta) -> None:
        params = self.settings.parameters(self._hub)
        model = self._model
        await self._store.async_save(
            {
                "meta": {
                    "algo_version": ALGO_VERSION,
                    "location": [params.lat, params.lon, params.radius],
                    "horizon": _horizon_signature(self.settings, self._hub, self._corrections),
                    "parts_with_min_height": self._parts_min,
                },
                "source": meta.to_dict(),
                "buildings": [b.to_dict() for b in self._buildings],
                "horizon": [round(float(v), 2) for v in model.geometric],
                "quality": {
                    "coverage": model.coverage,
                    "source_pct": model.source_pct,
                    "building_count": model.building_count,
                },
                "corrections": self._corrections.to_dict(),
            }
        )

    # --------------------------------------------------------------- timeline
    async def _async_update_data(self) -> SpotData:
        now = dt_util.utcnow()
        today = now.astimezone(dt_util.get_default_time_zone()).date()
        previous = self.data
        if previous is not None and not self._dirty and previous.window_date == today:
            data = previous
        else:
            data = await self._compute_data(now, today)
            self._dirty = False
        self.forecast_day = self._compute_forecast(data, today)
        self.tomorrow = self._day_in_window(data, today + timedelta(days=1))
        self._schedule(data, now)
        return data

    async def _compute_data(self, now: datetime, today: date) -> SpotData:
        horizon = final_horizon(self._model, self._corrections)
        start, end = local_window(now)
        lat, lon = self.settings.latitude, self.settings.longitude
        t0 = time_module.perf_counter()
        timeline = await self.hass.async_add_executor_job(
            compute_timeline, lat, lon, horizon, start, end
        )
        self.timings["timeline_s"] = round(time_module.perf_counter() - t0, 3)
        return SpotData(
            self._meta,
            self._model,
            self._corrections,
            horizon,
            timeline,
            today,
            self._model.building_count,
        )

    def _compute_forecast(
        self, data: SpotData, day: date, timeline: Timeline | None = None
    ) -> DayForecast:
        entity = self.settings.weather_entity
        snapshot = self.config_entry.runtime_data.forecasts.snapshot(entity) if entity else None
        start, end = local_day_bounds(day)
        return build_day_forecast(
            timeline or data.timeline,
            start,
            end,
            snapshot.forecast if snapshot else None,
            dt_util.get_default_time_zone(),
            self._hub.cloud_threshold_sunny,
            self._hub.cloud_threshold_partly,
        )

    @property
    def forecast_resolution(self) -> str | None:
        entity = self.settings.weather_entity
        snapshot = self.config_entry.runtime_data.forecasts.snapshot(entity) if entity else None
        return snapshot.forecast.resolution if snapshot and snapshot.forecast else None

    @callback
    def _async_forecast_updated(self) -> None:
        if self.data is not None:
            self.forecast_day = self._compute_forecast(self.data, self.data.window_date)
            self.tomorrow = self._day_in_window(
                self.data, self.data.window_date + timedelta(days=1)
            )
            self.async_update_listeners()

    @callback
    def _schedule(self, data: SpotData, now: datetime) -> None:
        if self._unsub_point:
            self._unsub_point()
        # next local midnight (computed in local time: a UTC "minus one day" is off on DST days)
        _, when = local_day_bounds(now.astimezone(dt_util.get_default_time_zone()).date())
        change = data.timeline.next_change(now)
        if change is not None and change < when:
            when = change
        self._unsub_point = async_track_point_in_utc_time(
            self.hass, self._async_boundary, when + timedelta(seconds=1)
        )

    async def _async_boundary(self, _now: datetime) -> None:
        self._unsub_point = None
        await self.async_refresh()

    async def _async_tick(self, _now: datetime) -> None:
        """Every minute: refresh weather and notify entities; every 5 min a safety recompute."""
        self._ticks += 1
        self._read_weather()
        if self._ticks % RECOMPUTE_EVERY_TICKS == 0:
            self._dirty = True
            await self.async_refresh()
        else:
            self.async_update_listeners()

    # ------------------------------------------------------------------ weather
    @callback
    def _read_weather(self) -> None:
        entity_id = self.settings.weather_entity
        if not entity_id:
            return
        state = self.hass.states.get(entity_id)
        cloud: float | None = None
        if state is not None and state.state not in ("unavailable", "unknown"):
            coverage = state.attributes.get("cloud_coverage")
            cloud = cloud_percent(
                float(coverage) if isinstance(coverage, (int, float)) else None, state.state
            )
        self.cloud = cloud
        self.gate.update(dt_util.utcnow(), cloud)

    @callback
    def _async_weather_changed(self, _event: Event[EventStateChangedData]) -> None:
        self._read_weather()
        self.async_update_listeners()

    # --------------------------------------------------------------- derived state
    def sun_position_now(self, now: datetime) -> tuple[float, float]:
        return sun_position(self.settings.latitude, self.settings.longitude, now)

    def horizon_at_sun(self, now: datetime) -> float:
        az, _ = self.sun_position_now(now)
        return horizon_at(self.data.horizon, az)

    def sunny_geometric(self, now: datetime) -> bool:
        return self.data.timeline.sunny_at(now)

    def sunny_weather_aware(self, now: datetime) -> bool:
        """Geometry AND clear sky; unknown cloud falls back to geometry only."""
        return self.sunny_geometric(now) and self.gate.clear is not False

    # --------------------------------------------------------------- corrections
    async def _apply_corrections(self, *, model_changed: bool) -> None:
        if model_changed:
            self._model = await self.hass.async_add_executor_job(self._compute_model)
        await self._save(self._meta)
        self._dirty = True
        await self.async_refresh()

    async def async_set_building_height(self, lat: float, lon: float, height: float) -> str:
        building = match_building(
            self._buildings, self.settings.latitude, self.settings.longitude, lat, lon
        )
        if building is None:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key="no_building_at_location"
            )
        self._corrections.overrides.append(
            HeightOverride(uuid4().hex[:8], lat, lon, height, dt_util.utcnow().isoformat())
        )
        await self._apply_corrections(model_changed=True)
        return building.id

    async def async_add_obstacle(
        self, az_from: float, az_to: float, elevation: float, note: str | None
    ) -> None:
        try:
            validate_entry(az_from, az_to, elevation)
        except ValueError as err:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="invalid_obstacle",
                translation_placeholders={"error": str(err)},
            ) from err
        self._corrections.entries.append(
            HorizonEntry(
                uuid4().hex[:8],
                "obstacle",
                az_from,
                az_to,
                elevation,
                dt_util.utcnow().isoformat(),
                "manual",
                note or None,
            )
        )
        await self._apply_corrections(model_changed=False)

    async def async_remove_corrections(self, ids: list[str]) -> None:
        removed_override = any(o.id in ids for o in self._corrections.overrides)
        changed = False
        for correction_id in ids:
            changed |= self._corrections.remove(correction_id)
        if changed:
            await self._apply_corrections(model_changed=removed_override)

    async def async_calibrate(self, observed: str, at: datetime | None) -> str | None:
        """Reconcile the model with an observation; returns the new entry id (None: consistent)."""
        when = (at or dt_util.utcnow()).astimezone(UTC)
        az, el = sun_position(self.settings.latitude, self.settings.longitude, when)
        if el <= 0:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key="sun_below_horizon"
            )
        model_sunny = is_sunny(az, el, self.data.horizon, SUN_DISC_MARGIN_DEG)
        entry = calibration_entry(observed == "sunny", model_sunny, az, el, when, uuid4().hex[:8])
        if entry is None:
            return None
        self._corrections.entries.append(entry)
        await self._apply_corrections(model_changed=False)
        return entry.id

    async def async_run_once[T](
        self, key: tuple[str, ...], job: Callable[[], Coroutine[Any, Any, T]]
    ) -> T:
        """Run ``job`` once for concurrent calls with the same key.

        Both binary sensors of a spot carry the entity actions, so an action aimed at the
        spot's device or area reaches this coordinator twice within one service call.
        Callers key by the call's context id and arguments; the second caller shares the
        first one's result instead of applying the change again.
        """
        task = self._inflight.get(key)
        if task is None:

            async def run() -> T:
                try:
                    return await job()
                finally:
                    self._inflight.pop(key, None)

            task = self.hass.async_create_task(run(), eager_start=False)
            self._inflight[key] = task
        result: T = await task
        return result

    # ------------------------------------------------------------------ refresh
    async def async_refresh_buildings(self) -> None:
        """Refetch from the provider (explicit user action or the 90-day refresh)."""
        params = self.settings.parameters(self._hub)
        try:
            chunkset = await self._service.async_fetch(
                params.lat, params.lon, params.radius, refresh=True
            )
        except ProviderError as err:
            async_create_buildings_issue(
                self.hass, self.subentry_id, self.settings.name, str(err), ir.IssueSeverity.WARNING
            )
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="refresh_failed",
                translation_placeholders={"error": str(err)},
            ) from err
        async_delete_buildings_issue(self.hass, self.subentry_id)
        await self._rebuild(chunkset)
        self._dirty = True
        await self.async_refresh()

    async def _async_check_refresh(self, _now: datetime) -> None:
        fetched = dt_util.parse_datetime(self._meta.fetched_at)
        if fetched is None or dt_util.utcnow() - fetched < timedelta(days=REFRESH_INTERVAL_DAYS):
            return
        try:
            await self.async_refresh_buildings()
        except ServiceValidationError:
            _LOGGER.debug("Scheduled building refresh failed; keeping cached data", exc_info=True)

    # ----------------------------------------------------------------- forecast
    def _day_in_window(
        self, data: SpotData, day: date, timeline: Timeline | None = None
    ) -> DayResult:
        """Intervals and forecast windows for a day the timeline already covers."""
        start, end = local_day_bounds(day)
        timeline = timeline or data.timeline
        intervals = [
            (max(a, start), min(b, end)) for a, b in timeline.intervals if b > start and a < end
        ]
        return DayResult(intervals, self._compute_forecast(data, day, timeline))

    async def async_day(self, day: date) -> DayResult:
        """Intervals and forecast windows for a local calendar day (computed on demand
        when the day lies outside the two-day timeline window)."""
        start, end = local_day_bounds(day)
        data = self.data
        timeline = data.timeline
        if not (timeline.start <= start and end <= timeline.end):
            timeline = await self.hass.async_add_executor_job(
                compute_timeline,
                self.settings.latitude,
                self.settings.longitude,
                data.horizon,
                start,
                end,
            )
        return self._day_in_window(data, day, timeline)

    # ------------------------------------------------------------------ shadow map
    async def async_render_map(self, when: datetime, theme: str = "light") -> MapResult:
        """Render the shadow view for an instant (CPU work in the executor)."""
        when = when.astimezone(UTC)
        az, el = sun_position(self.settings.latitude, self.settings.longitude, when)
        texts = MAP_TEXT.get(self.hass.config.language.split("-")[0], MAP_TEXT["en"])
        local = dt_util.as_local(when)
        caption = f"{local:%Y-%m-%d %H:%M}"
        caption += (
            f" · {texts['below']}"
            if el <= 0
            else f" · {texts['sun'].format(az=round(az), el=round(el))}"
        )
        buildings = self._buildings
        overrides = override_heights(
            buildings, self.settings.latitude, self.settings.longitude, self._corrections.overrides
        )
        params = self.settings.parameters(self._hub)
        title = texts["title"].format(name=self.settings.name)
        attribution = self._meta.attribution

        def work() -> str:
            heights, sources = resolve_all(buildings, params.heights, overrides)
            shadows = shadow_polygons(buildings, heights, az, el, params.h_obs, params.radius)
            svg = ""
            for zoom in MAP_ZOOM_STEPS:
                svg = to_svg(
                    buildings,
                    sources,
                    shadows,
                    radius=params.radius * zoom,
                    sun_azimuth=az,
                    sun_elevation=el,
                    caption=caption,
                    attribution=attribution,
                    title=title,
                    theme=theme,
                )
                if len(svg.encode()) <= MAP_PAYLOAD_BUDGET:
                    return svg
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="map_too_large")

        return MapResult(await self.hass.async_add_executor_job(work), when, az, el)

    # ---------------------------------------------------------------- lifecycle
    @callback
    def async_start_retry(self) -> None:
        """Retry a failed first load later (so one bad spot never blocks the others)."""
        if self._unsub_retry is None:
            self._unsub_retry = async_call_later(self.hass, RETRY_DELAY, self._async_retry)

    async def _async_retry(self, _now: datetime) -> None:
        self._unsub_retry = None
        if await self.async_initialize():
            _LOGGER.info("Spot %s recovered and is available again", self.settings.name)
            async_delete_buildings_issue(self.hass, self.subentry_id)
            await self.async_refresh()

    async def async_shutdown(self) -> None:
        await super().async_shutdown()
        for unsub in (
            self._unsub_point,
            self._unsub_tick,
            self._unsub_check,
            self._unsub_retry,
            self._unsub_weather,
            self._unsub_forecast,
        ):
            if unsub:
                unsub()
        self._unsub_point = self._unsub_tick = self._unsub_check = None
        self._unsub_retry = self._unsub_weather = self._unsub_forecast = None
