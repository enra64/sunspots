from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pytest

from custom_components.sunspots.core.solar import sun_position
from custom_components.sunspots.core.timeline import compute_timeline, is_sunny

BERLIN = (52.552, 13.419)
TZ = ZoneInfo("Europe/Berlin")
FLAT = np.zeros(720)


def window(day: datetime, days: int = 2):
    start = day.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=TZ).astimezone(UTC)
    end = (
        (day.replace(tzinfo=None) + timedelta(days=days))
        .replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=TZ)
        .astimezone(UTC)
    )
    return start, end


def test_open_sky_one_interval_per_day_with_accurate_edges():
    start, end = window(datetime(2026, 6, 21))
    tl = compute_timeline(*BERLIN, FLAT, start, end, margin=0.0)
    assert len(tl.intervals) == 2
    a, b = tl.intervals[0]
    # edges are where apparent elevation crosses 0 (within bisect tolerance + 1 s of astral)
    for edge in (a, b):
        e_before = sun_position(*BERLIN, edge - timedelta(seconds=11))[1]
        e_after = sun_position(*BERLIN, edge + timedelta(seconds=11))[1]
        assert (e_before > 0) != (e_after > 0)
    assert 15.5 < (b - a).total_seconds() / 3600 < 17.0  # Berlin midsummer ~16.8 h
    assert tl.next_change(start) == a
    assert tl.sunny_at(a + timedelta(hours=1))
    assert not tl.sunny_at(b + timedelta(minutes=1))


def test_window_length_and_slots_including_dst_day():
    # 2026-10-25: DST ends in Europe/Berlin, local day has 25 hours
    start, end = window(datetime(2026, 10, 25), days=1)
    assert end - start == timedelta(hours=25)
    tl = compute_timeline(*BERLIN, FLAT, start, end)
    assert len(tl.slot_fractions) == 25 * 4
    spring_start, spring_end = window(datetime(2026, 3, 29), days=1)
    assert spring_end - spring_start == timedelta(hours=23)
    assert len(compute_timeline(*BERLIN, FLAT, spring_start, spring_end).slot_fractions) == 92


def test_short_gap_found_with_minute_steps():
    start, end = window(datetime(2026, 6, 21), days=1)
    base = compute_timeline(*BERLIN, FLAT, start, end, margin=0.0)
    noon = base.intervals[0][0] + (base.intervals[0][1] - base.intervals[0][0]) / 2
    az, el = sun_position(*BERLIN, noon)
    h = np.zeros(720)
    # thin post: a 1-degree wide spike just above the sun's elevation
    b = int(az / 0.5)
    h[b - 1 : b + 2] = el + 1
    tl = compute_timeline(*BERLIN, h, start, end, margin=0.0)
    assert len(tl.intervals) == 2
    gap = tl.intervals[1][0] - tl.intervals[0][1]
    assert timedelta(seconds=30) < gap < timedelta(minutes=10)


def test_polar_day_single_interval_and_no_change():
    start, end = window(datetime(2026, 6, 21))
    tl = compute_timeline(78.2, 15.6, FLAT, start, end)
    assert tl.intervals == [(start, end)]
    assert tl.next_change(start) is None
    assert tl.remaining(start) == end - start
    assert all(f == 1.0 for f in tl.slot_fractions)


def test_polar_night_no_sun():
    start, end = window(datetime(2026, 12, 21))
    tl = compute_timeline(78.2, 15.6, FLAT, start, end)
    assert tl.intervals == []
    assert tl.next_change(start) is None
    assert tl.remaining(start) == timedelta(0)


def test_sun_time_and_slot_fractions_sum():
    start, end = window(datetime(2026, 6, 21), days=1)
    tl = compute_timeline(*BERLIN, FLAT, start, end, margin=0.0)
    total = tl.sun_time(start, end)
    slots = sum(tl.slot_fractions) * 15
    assert slots == pytest.approx(total.total_seconds() / 60, abs=1.5)


def test_margin_delays_sunrise_slightly():
    start, end = window(datetime(2026, 6, 21), days=1)
    zero = compute_timeline(*BERLIN, FLAT, start, end, margin=0.0).intervals[0][0]
    with_margin = compute_timeline(*BERLIN, FLAT, start, end, margin=0.27).intervals[0][0]
    assert timedelta(0) < with_margin - zero < timedelta(minutes=5)


def test_is_sunny_requires_positive_elevation():
    assert not is_sunny(90.0, -1.0, FLAT, 0.0)
    assert is_sunny(90.0, 10.0, FLAT, 0.0)
    h = np.full(720, 20.0)
    assert not is_sunny(90.0, 10.0, h, 0.0)
