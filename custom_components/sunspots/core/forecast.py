"""Cloud values from weather data and the weather-aware sunny gate."""

from __future__ import annotations

from bisect import bisect_right
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta, tzinfo
from typing import Any, Literal

from .const import SLOT_MINUTES
from .timeline import Timeline

DEFAULT_CLOUD_THRESHOLD_SUNNY = 40.0
HYSTERESIS_POINTS = 5.0
MIN_DWELL = timedelta(minutes=5)

# Approximate cloud cover (%) per Home Assistant weather condition.
CONDITION_CLOUD: dict[str, float] = {
    "sunny": 0.0,
    "clear-night": 0.0,
    "partlycloudy": 40.0,
    "cloudy": 90.0,
    "fog": 100.0,
    "hail": 100.0,
    "lightning": 100.0,
    "lightning-rainy": 100.0,
    "pouring": 100.0,
    "rainy": 100.0,
    "snowy": 100.0,
    "snowy-rainy": 100.0,
}


def cloud_percent(coverage: float | None, condition: str | None) -> float | None:
    """Cloud cover in percent: explicit coverage if present, else the condition table."""
    if coverage is not None:
        return max(0.0, min(100.0, float(coverage)))
    if condition is None:
        return None
    return CONDITION_CLOUD.get(condition)


class CloudGate:
    """Weather part of the weather-aware sensor.

    Turns clear when cloud <= threshold, turns cloudy when cloud > threshold + 5 points,
    and holds each state for at least five minutes. Unknown cloud keeps the current state.
    """

    def __init__(self, threshold: float = DEFAULT_CLOUD_THRESHOLD_SUNNY) -> None:
        self.threshold = threshold
        self.clear: bool | None = None
        self._changed: datetime | None = None

    def update(self, now: datetime, cloud: float | None) -> bool | None:
        """Feed a new cloud reading; returns whether the sky counts as clear (None = unknown)."""
        if cloud is None:
            return self.clear
        if self.clear is None:
            self.clear = cloud <= self.threshold
            self._changed = now
            return self.clear
        if self._changed is not None and now - self._changed < MIN_DWELL:
            return self.clear
        wanted = self.clear
        if self.clear and cloud > self.threshold + HYSTERESIS_POINTS:
            wanted = False
        elif not self.clear and cloud <= self.threshold:
            wanted = True
        if wanted != self.clear:
            self.clear, self._changed = wanted, now
        return self.clear


# --------------------------------------------------------------------------- forecast
DEFAULT_CLOUD_THRESHOLD_PARTLY = 75.0
MAX_ENTRY_SPAN = timedelta(hours=6)
HOURLY_SPAN = timedelta(hours=1)
SUNNY_FRACTION = 0.5

SlotClass = Literal["sunny", "partly", "unlikely"]


@dataclass(frozen=True, slots=True)
class ForecastEntry:
    """Cloud cover from ``start`` (a period start) until the next entry."""

    start: datetime
    cloud: float | None


@dataclass(frozen=True, slots=True)
class Forecast:
    """Parsed weather forecast; ``resolution`` is how entries are spaced."""

    entries: tuple[ForecastEntry, ...]
    resolution: Literal["hourly", "daily"]


@dataclass(frozen=True, slots=True)
class Window:
    start: datetime
    end: datetime
    cls: SlotClass


@dataclass(frozen=True, slots=True)
class HourRow:
    start: datetime
    sunlit_fraction: float
    cloud: float | None
    cls: SlotClass


@dataclass(frozen=True, slots=True)
class DayForecast:
    windows: tuple[Window, ...]
    hourly: tuple[HourRow, ...]
    forecast_available: bool


def parse_forecast(
    raw: Sequence[Mapping[str, Any]], resolution: Literal["hourly", "daily"]
) -> Forecast:
    """Convert ``weather.get_forecasts`` entries; unusable entries are skipped."""
    entries: list[ForecastEntry] = []
    for item in raw:
        stamp = item.get("datetime")
        if not isinstance(stamp, str):
            continue
        try:
            start = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        except ValueError:
            continue
        if start.tzinfo is None:
            start = start.replace(tzinfo=UTC)
        coverage = item.get("cloud_coverage")
        cloud = cloud_percent(
            float(coverage) if isinstance(coverage, (int, float)) else None,
            item.get("condition") if isinstance(item.get("condition"), str) else None,
        )
        entries.append(ForecastEntry(start.astimezone(UTC), cloud))
    entries.sort(key=lambda e: e.start)
    return Forecast(tuple(entries), resolution)


def _daily_date(entry: ForecastEntry, tz: tzinfo) -> date:
    """Calendar day a daily entry stands for.

    Providers often stamp daily entries at 00:00 UTC meaning that date; others use local
    midnight. Midnight UTC is read as the UTC date, anything else as the local date.
    """
    utc = entry.start
    if utc.hour == 0 and utc.minute == 0:
        return utc.date()
    return utc.astimezone(tz).date()


def cloud_at(forecast: Forecast | None, when: datetime, tz: tzinfo) -> float | None:
    """Cloud cover (percent) the forecast gives for an instant; None if not covered/unknown."""
    if forecast is None or not forecast.entries:
        return None
    if forecast.resolution == "daily":
        day = when.astimezone(tz).date()
        for entry in forecast.entries:
            if _daily_date(entry, tz) == day:
                return entry.cloud
        return None
    entries = forecast.entries
    index = bisect_right([e.start for e in entries], when) - 1
    if index < 0:
        return None
    entry = entries[index]
    nxt = entries[index + 1].start if index + 1 < len(entries) else entry.start + HOURLY_SPAN
    if when >= min(nxt, entry.start + MAX_ENTRY_SPAN):
        return None
    return entry.cloud


def classify_slot(
    fraction: float, cloud: float | None, sunny_limit: float, partly_limit: float
) -> SlotClass:
    """Spec 4.4 slot class; unknown cloud classifies by geometry alone."""
    if fraction < SUNNY_FRACTION:
        return "unlikely"
    if cloud is None or cloud <= sunny_limit:
        return "sunny"
    if cloud <= partly_limit:
        return "partly"
    return "unlikely"


def _overlap(
    a0: datetime, a1: datetime, b0: datetime, b1: datetime
) -> tuple[datetime, datetime] | None:
    lo, hi = max(a0, b0), min(a1, b1)
    return (lo, hi) if hi > lo else None


def build_day_forecast(
    timeline: Timeline,
    day_start: datetime,
    day_end: datetime,
    forecast: Forecast | None,
    tz: tzinfo,
    sunny_limit: float,
    partly_limit: float,
) -> DayForecast:
    """Combine geometric sun and cloud forecast into class windows for one local day.

    Slot runs of equal class are clipped to the minute-accurate geometric intervals, so
    geometric shade is never bridged. The spec's 10-minute flicker bridging cannot apply:
    classes change only on 15-minute slot boundaries, so any gap between same-class
    pieces that is not geometric shade lasts at least one slot (see decisions D19).
    """
    slot = timedelta(minutes=SLOT_MINUTES)
    slots: list[tuple[datetime, float, float | None, SlotClass]] = []
    for i, fraction in enumerate(timeline.slot_fractions):
        start = timeline.start + i * slot
        if not day_start <= start < day_end:
            continue
        cloud = cloud_at(forecast, start, tz)
        slots.append(
            (start, fraction, cloud, classify_slot(fraction, cloud, sunny_limit, partly_limit))
        )

    available = any(c is not None for _, f, c, _ in slots if f > 0)
    intervals = [iv for iv in timeline.intervals if iv[1] > day_start and iv[0] < day_end]

    # Only slots that are at least half sunlit form windows; slivers of sun at the edges of
    # shade (under 7.5 minutes per slot) are left out instead of producing "unlikely" noise.
    keys: list[SlotClass | None] = [
        cls if fraction >= SUNNY_FRACTION else None for _, fraction, _, cls in slots
    ]
    pieces: list[Window] = []
    run_start = 0
    for idx in range(1, len(slots) + 1):
        if idx < len(slots) and keys[idx] == keys[run_start]:
            continue
        cls = keys[run_start]
        if cls is not None:
            run0, run1 = slots[run_start][0], slots[idx - 1][0] + slot
            for a, b in intervals:
                piece = _overlap(run0, run1, a, b)
                if piece:
                    pieces.append(Window(piece[0], piece[1], cls))
        run_start = idx

    hourly: list[HourRow] = []
    by_hour: dict[datetime, list[tuple[float, float | None]]] = {}
    for start, fraction, cloud, _ in slots:
        hour = start.astimezone(tz).replace(minute=0, second=0, microsecond=0).astimezone(UTC)
        by_hour.setdefault(hour, []).append((fraction, cloud))
    for hour, items in sorted(by_hour.items()):
        mean = sum(f for f, _ in items) / len(items)
        if mean <= 0:
            continue
        clouds = [c for _, c in items if c is not None]
        cloud_value = sum(clouds) / len(clouds) if clouds else None
        hourly.append(
            HourRow(
                hour,
                round(mean, 2),
                cloud_value,
                classify_slot(mean, cloud_value, sunny_limit, partly_limit),
            )
        )
    return DayForecast(tuple(pieces), tuple(hourly), available)


def forecast_state(windows: Sequence[Window], now: datetime) -> str:
    """Spec precedence: sunny_now > partly > sunny_later > partly_later > no_sun_today."""
    for cls, now_state in (("sunny", "sunny_now"), ("partly", "partly")):
        if any(w.cls == cls and w.start <= now < w.end for w in windows):
            return now_state
    for cls, later_state in (("sunny", "sunny_later"), ("partly", "partly_later")):
        if any(w.cls == cls and w.start > now for w in windows):
            return later_state
    return "no_sun_today"


def best_window(windows: Sequence[Window], now: datetime) -> Window | None:
    """Longest not-yet-finished sunny window, else the longest partly one (earliest wins ties)."""
    for cls in ("sunny", "partly"):
        candidates = [w for w in windows if w.cls == cls and w.end > now]
        if candidates:
            return max(candidates, key=lambda w: (w.end - w.start, -w.start.timestamp()))
    return None
