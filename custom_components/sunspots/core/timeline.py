"""Sunlit intervals for a spot from its horizon profile."""

from __future__ import annotations

import math
from bisect import bisect_right
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import numpy as np

from .const import SLOT_MINUTES, SUN_DISC_MARGIN_DEG
from .horizon import FloatArray, horizon_at, horizon_at_many
from .solar import sun_position, sun_positions

_STEP = timedelta(minutes=1)
_BISECT_TARGET = timedelta(seconds=10)


def is_sunny(
    azimuth_deg: float,
    elevation_deg: float,
    horizon: FloatArray,
    margin: float = SUN_DISC_MARGIN_DEG,
) -> bool:
    """Direct sun iff the sun is up and clears the horizon (plus optional disc margin)."""
    return elevation_deg > 0 and elevation_deg > horizon_at(horizon, azimuth_deg) + margin


@dataclass(slots=True)
class Timeline:
    """Sunlit intervals over ``[start, end)`` (UTC-aware datetimes)."""

    start: datetime
    end: datetime
    intervals: list[tuple[datetime, datetime]]
    slot_fractions: list[float]  # sunlit fraction per SLOT_MINUTES slot, from ``start``
    _flips: list[datetime] = field(default_factory=list, repr=False)

    def sunny_at(self, when: datetime) -> bool:
        return any(a <= when < b for a, b in self.intervals)

    def next_change(self, when: datetime) -> datetime | None:
        """Next sunny/shaded flip strictly after ``when``; None if none in the window."""
        i = bisect_right(self._flips, when)
        return self._flips[i] if i < len(self._flips) else None

    def remaining(self, when: datetime) -> timedelta:
        """Continuous sun left from ``when`` (zero when shaded)."""
        for a, b in self.intervals:
            if a <= when < b:
                return b - when
        return timedelta(0)

    def sun_time(self, day_start: datetime, day_end: datetime) -> timedelta:
        """Total sunlit time overlapping ``[day_start, day_end)``."""
        total = timedelta(0)
        for a, b in self.intervals:
            lo, hi = max(a, day_start), min(b, day_end)
            if hi > lo:
                total += hi - lo
        return total


def compute_timeline(
    lat: float,
    lon: float,
    horizon: FloatArray,
    start: datetime,
    end: datetime,
    margin: float = SUN_DISC_MARGIN_DEG,
) -> Timeline:
    """Sample every minute, bisect each flip to +-10 s, merge into intervals."""
    if start.tzinfo is None or end.tzinfo is None:
        raise ValueError("start and end must be timezone-aware")
    total_minutes = math.ceil((end - start) / _STEP)
    times = [start + k * _STEP for k in range(total_minutes + 1)]
    az, el = sun_positions(lat, lon, times)
    state = (el > 0) & (el > horizon_at_many(horizon, az) + margin)

    def sunny(t: datetime) -> bool:
        a, e = sun_position(lat, lon, t)
        return is_sunny(a, e, horizon, margin)

    flips: list[datetime] = []
    for k in np.nonzero(state[1:] != state[:-1])[0]:
        lo, hi = times[int(k)], times[int(k) + 1]
        lo_state = bool(state[int(k)])
        while hi - lo > _BISECT_TARGET:
            mid = lo + (hi - lo) / 2
            if sunny(mid) == lo_state:
                lo = mid
            else:
                hi = mid
        flips.append(lo + (hi - lo) / 2)
    flips = [f for f in flips if start < f < end]

    intervals: list[tuple[datetime, datetime]] = []
    current_start: datetime | None = start if state[0] else None
    for f in flips:
        if current_start is None:
            current_start = f
        else:
            intervals.append((current_start, f))
            current_start = None
    if current_start is not None:
        intervals.append((current_start, end))

    minutes = state[:total_minutes].astype(np.float64)
    slots = math.ceil(total_minutes / SLOT_MINUTES)
    fractions = [
        float(minutes[i * SLOT_MINUTES : (i + 1) * SLOT_MINUTES].mean()) for i in range(slots)
    ]
    return Timeline(start, end, intervals, fractions, flips)
