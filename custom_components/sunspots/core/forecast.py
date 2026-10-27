"""Cloud values from weather data and the weather-aware sunny gate."""

from __future__ import annotations

from datetime import datetime, timedelta

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
