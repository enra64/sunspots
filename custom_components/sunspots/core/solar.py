"""Sun position via astral 2.2 (provided by Home Assistant's pins, not listed in the manifest).

Elevation is the *apparent* elevation (atmospheric refraction included, astral's
default), which is what decides whether the sun is visible over a skyline.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

import numpy as np
import numpy.typing as npt
from astral import Observer
from astral.sun import azimuth, elevation


def sun_position(lat: float, lon: float, when: datetime) -> tuple[float, float]:
    """Return (azimuth, elevation) in degrees for a timezone-aware datetime."""
    if when.tzinfo is None:
        raise ValueError("datetime must be timezone-aware")
    observer = Observer(latitude=lat, longitude=lon)
    return float(azimuth(observer, when)), float(elevation(observer, when))


def sun_positions(
    lat: float, lon: float, times: Sequence[datetime]
) -> tuple[npt.NDArray[np.float64], npt.NDArray[np.float64]]:
    """Vector form of :func:`sun_position`."""
    observer = Observer(latitude=lat, longitude=lon)
    az = np.fromiter((azimuth(observer, t) for t in times), dtype=np.float64, count=len(times))
    el = np.fromiter((elevation(observer, t) for t in times), dtype=np.float64, count=len(times))
    return az, el
