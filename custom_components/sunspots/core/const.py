"""Constants shared by the pure-Python core."""

from __future__ import annotations

from typing import Final

AZIMUTH_BINS: Final = 720  # 0.5 degree bins
SUN_DISC_MARGIN_DEG: Final = 0.27
LOW_COVERAGE_THRESHOLD: Final = 0.30
COVERAGE_MIN_ELEVATION_DEG: Final = 2.0
MIN_HIT_DISTANCE_M: Final = 1.0
ALGO_VERSION: Final = 1  # bump when horizon/timeline maths change; stores recompute on mismatch

DEFAULT_RADIUS_M: Final = 250
MIN_RADIUS_M: Final = 100
MAX_RADIUS_M: Final = 500
DEFAULT_OBSERVER_HEIGHT_M: Final = 1.2
DEFAULT_FLOOR_HEIGHT_M: Final = 3.2
DEFAULT_BUILDING_HEIGHT_M: Final = 12.0

SLOT_MINUTES: Final = 15
