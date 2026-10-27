"""Hub-level weather forecast fetching: one fetch per weather entity, shared by all spots."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Literal, cast

from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import (
    async_call_later,
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.util import dt as dt_util

from .core.forecast import Forecast, parse_forecast

_LOGGER = logging.getLogger(__name__)

REFRESH_INTERVAL = timedelta(minutes=30)
DEBOUNCE = timedelta(minutes=5)
FEATURE_DAILY = 1
FEATURE_HOURLY = 2


@dataclass(frozen=True, slots=True)
class ForecastSnapshot:
    """Last good forecast of a weather entity (``forecast`` None if it offers none)."""

    forecast: Forecast | None
    fetched_at: datetime | None


class _Tracker:
    """Fetch loop for one weather entity."""

    def __init__(self, hass: HomeAssistant, entity_id: str) -> None:
        self.hass = hass
        self.entity_id = entity_id
        self.snapshot = ForecastSnapshot(None, None)
        self.listeners: list[Callable[[], None]] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._debounce: CALLBACK_TYPE | None = None
        self._unsubs.append(async_track_time_interval(hass, self._async_interval, REFRESH_INTERVAL))
        self._unsubs.append(
            async_track_state_change_event(hass, [entity_id], self._async_state_changed)
        )
        hass.async_create_background_task(self.async_fetch(), f"sunspots forecast {entity_id}")

    async def _async_interval(self, _now: datetime) -> None:
        await self.async_fetch()

    @callback
    def _async_state_changed(self, _event: Event[EventStateChangedData]) -> None:
        if self._debounce is None:
            self._debounce = async_call_later(self.hass, DEBOUNCE, self._async_debounced)

    async def _async_debounced(self, _now: datetime) -> None:
        self._debounce = None
        await self.async_fetch()

    async def async_fetch(self) -> None:
        state = self.hass.states.get(self.entity_id)
        features = int(state.attributes.get("supported_features", 0)) if state else 0
        kinds: list[Literal["hourly", "daily"]] = []
        if features & FEATURE_HOURLY:
            kinds.append("hourly")
        if features & FEATURE_DAILY:
            kinds.append("daily")
        forecast: Forecast | None = None
        for kind in kinds:
            raw = await self._call(kind)
            if raw:
                forecast = parse_forecast(raw, kind)
                if forecast.entries:
                    break
                forecast = None
        if forecast is not None:
            self.snapshot = ForecastSnapshot(forecast, dt_util.utcnow())
        elif kinds:
            _LOGGER.debug("No usable forecast from %s; keeping the last good one", self.entity_id)
        for listener in list(self.listeners):
            listener()

    async def _call(self, kind: str) -> list[dict[str, Any]] | None:
        try:
            response = await self.hass.services.async_call(
                "weather",
                "get_forecasts",
                {"entity_id": self.entity_id, "type": kind},
                blocking=True,
                return_response=True,
            )
        except HomeAssistantError as err:
            _LOGGER.debug("get_forecasts(%s) failed for %s: %s", kind, self.entity_id, err)
            return None
        entry: Any = (response or {}).get(self.entity_id)
        forecast = entry.get("forecast") if isinstance(entry, dict) else None
        return cast("list[dict[str, Any]]", forecast) if isinstance(forecast, list) else None

    def shutdown(self) -> None:
        for unsub in self._unsubs:
            unsub()
        if self._debounce:
            self._debounce()
        self._unsubs.clear()


class ForecastManager:
    """Reference-counted trackers: spots sharing a weather entity share one fetch loop."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._trackers: dict[str, _Tracker] = {}

    @callback
    def async_subscribe(self, entity_id: str, listener: Callable[[], None]) -> CALLBACK_TYPE:
        tracker = self._trackers.get(entity_id)
        if tracker is None:
            tracker = self._trackers[entity_id] = _Tracker(self._hass, entity_id)
        tracker.listeners.append(listener)

        @callback
        def unsubscribe() -> None:
            if listener in tracker.listeners:
                tracker.listeners.remove(listener)
            if not tracker.listeners and self._trackers.get(entity_id) is tracker:
                tracker.shutdown()
                del self._trackers[entity_id]

        return unsubscribe

    def snapshot(self, entity_id: str) -> ForecastSnapshot:
        tracker = self._trackers.get(entity_id)
        return tracker.snapshot if tracker else ForecastSnapshot(None, None)

    @callback
    def async_shutdown(self) -> None:
        for tracker in self._trackers.values():
            tracker.shutdown()
        self._trackers.clear()
