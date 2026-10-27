import math

import numpy as np
import pytest

from custom_components.sunspots.core.horizon import (
    compute_horizon,
    horizon_at,
    horizon_at_many,
)
from custom_components.sunspots.core.models import Building

from .helpers import box, rect, south_wall


def run(buildings, heights=None, h_obs=1.2, radius=250.0):
    heights = heights or [b.height for b in buildings]
    return compute_horizon(buildings, heights, h_obs, radius)


def test_south_wall_exact_values():
    res = run([south_wall()])
    h = res.angles
    assert horizon_at(h, 180.0) == pytest.approx(math.degrees(math.atan(18.8 / 20)), abs=0.02)
    assert horizon_at(h, 180.0) == pytest.approx(43.2, abs=0.05)
    for off in (10.0, 30.0, 55.0):
        expected = math.degrees(math.atan(18.8 * math.cos(math.radians(off)) / 20))
        assert horizon_at(h, 180 + off) == pytest.approx(expected, abs=0.15)
        assert horizon_at(h, 180 - off) == pytest.approx(expected, abs=0.15)
    assert horizon_at(h, 90.0) == 0.0
    assert horizon_at(h, 0.0) == 0.0
    assert horizon_at(h, 300.0) == 0.0


def test_courtyard_spot_in_hole():
    outer = rect(-22.5, -22.5, 22.5, 22.5)
    hole = rect(-7.5, -7.5, 7.5, 7.5)
    block = Building(id="b", polygons=[[outer, hole]], height=18.0)
    res = run([block])
    expected = math.degrees(math.atan(16.8 / 7.5))
    for az in (0.0, 90.0, 180.0, 270.0):
        assert horizon_at(res.angles, az) == pytest.approx(expected, abs=0.1)
    assert res.angles.min() > 55.0  # never sunny at low sun anywhere around the courtyard


def test_near_low_beats_far_tall():
    low = box("low", -2, 5, 2, 6, 5.0)
    tall = box("tall", -200, 100, 200, 110, 60.0)
    res = run([low, tall])
    assert horizon_at(res.angles, 0.0) == pytest.approx(math.degrees(math.atan(3.8 / 5)), abs=0.1)
    assert res.limiter[0] == 0
    # tall building alone limits where the low one does not reach
    assert horizon_at(res.angles, 40.0) == pytest.approx(
        math.degrees(math.atan(58.8 / (100 / math.cos(math.radians(40))))), abs=0.2
    )
    assert res.limiter[int(40 / 0.5)] == 1


def test_wraparound_north():
    half = 20 * math.tan(math.radians(30))
    wall = box("n", -half, 20, half, 20.5, 20.0)
    res = run([wall])
    a, b = horizon_at(res.angles, 359.9), horizon_at(res.angles, 0.1)
    assert a == pytest.approx(b, abs=0.05)
    assert a == pytest.approx(43.2, abs=0.1)
    assert horizon_at(res.angles, 180.0) == 0.0


def test_ground_offset_lowers_effective_height():
    wall = south_wall()
    base = horizon_at(run([wall]).angles, 180.0)
    raised = horizon_at(run([wall], h_obs=1.2 + 5.0).angles, 180.0)
    assert raised == pytest.approx(math.degrees(math.atan(13.8 / 20)), abs=0.05)
    assert raised < base


def test_buildings_below_observer_are_ignored():
    res = run([box("flat", 5, 5, 8, 8, 1.0)], h_obs=1.2)
    assert res.angles.max() == 0.0


def test_beyond_radius_culled():
    far = box("far", 300, 300, 310, 310, 50.0)
    assert run([far], radius=250).angles.max() == 0.0
    assert run([far], radius=500).angles.max() > 0.0


def test_narrow_feature_registers_in_bin():
    # 0.2 m wide pillar 30 m away spans well under one 0.5 degree bin
    pillar = box("p", -0.1, 30, 0.1, 30.2, 30.0)
    res = run([pillar])
    assert res.angles.max() > 40.0


def test_hits_closer_than_one_metre_are_ignored():
    near = box("n", 0.2, 0.2, 0.6, 0.6, 20.0)
    assert run([near]).angles.max() == 0.0


def test_edge_through_origin_is_skipped():
    # edge from (-5,0) to (5,0) passes through the origin line: no crash, no value from it
    b = Building(id="line", polygons=[[[(-5.0, 0.0), (5.0, 0.0), (5.0, -3.0)]]], height=20.0)
    run([b])


def test_horizon_at_many_matches_scalar():
    res = run([south_wall()])
    az = np.array([0.0, 10.3, 179.9, 180.1, 359.99])
    many = horizon_at_many(res.angles, az)
    for a, v in zip(az, many, strict=True):
        assert horizon_at(res.angles, float(a)) == pytest.approx(v)


def test_large_input_chunking_consistent():
    rng = np.random.default_rng(1)
    blds = []
    for i in range(400):
        x, y = rng.uniform(-200, 200, 2)
        if abs(x) < 15 and abs(y) < 15:
            continue
        blds.append(
            box(str(i), x, y, x + rng.uniform(5, 30), y + rng.uniform(5, 30), rng.uniform(4, 40))
        )
    import custom_components.sunspots.core.horizon as hz

    full = run(blds).angles
    old = hz._CHUNK_PAIRS
    hz._CHUNK_PAIRS = 50
    try:
        chunked = run(blds).angles
    finally:
        hz._CHUNK_PAIRS = old
    assert np.allclose(full, chunked)
