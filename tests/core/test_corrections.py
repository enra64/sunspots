from datetime import UTC, datetime

import numpy as np
import pytest

from custom_components.sunspots.core.corrections import (
    Corrections,
    HeightOverride,
    HorizonEntry,
    apply_entries,
    calibration_entry,
    match_building,
    override_heights,
    validate_entry,
)
from tests.core.helpers import unproject

from .helpers import box

LAT, LON = 52.55, 13.42
NOW = datetime(2026, 6, 21, 12, tzinfo=UTC)


def at(x, y):
    return unproject(LAT, LON, x, y)


def test_override_targets_containing_then_nearest():
    a = box("a", 10, 10, 20, 20)
    b = box("b", 40, 10, 50, 20)
    assert match_building([a, b], LAT, LON, *at(15, 15)).id == "a"
    assert match_building([a, b], LAT, LON, *at(38, 15)).id == "b"  # 2 m off b, nearest
    assert match_building([a, b], LAT, LON, *at(-200, -200)) is None
    ov = HeightOverride("o1", *at(15, 15), 33.0, NOW.isoformat())
    assert override_heights([a, b], LAT, LON, [ov]) == {"a": 33.0}


def test_obstacle_raises_clearance_limited_to_three_degrees():
    geo = np.full(720, 10.0)
    ob = HorizonEntry("1", "obstacle", 90, 100, 35.0, NOW.isoformat())
    out = apply_entries(geo, [ob])
    assert out[int(95 / 0.5)] == 35.0 and out[int(200 / 0.5)] == 10.0
    clear = HorizonEntry("2", "clearance", 90, 100, 2.0, NOW.isoformat())
    out = apply_entries(geo, [clear])
    assert out[int(95 / 0.5)] == pytest.approx(7.0)  # never below geometric - 3
    assert out[int(200 / 0.5)] == 10.0


def test_entry_window_wraps_around_north():
    geo = np.zeros(720)
    out = apply_entries(geo, [HorizonEntry("1", "obstacle", 358, 2, 20.0, NOW.isoformat())])
    assert out[0] == 20.0 and out[719] == 20.0 and out[360] == 0.0


def test_applying_entries_does_not_mutate_input_and_is_idempotent():
    geo = np.full(720, 5.0)
    entries = [HorizonEntry("1", "obstacle", 10, 20, 30.0, NOW.isoformat())]
    once = apply_entries(geo, entries)
    assert geo.max() == 5.0
    assert np.array_equal(apply_entries(geo, entries), once)


def test_calibration_creates_matching_entries_without_oscillation():
    assert calibration_entry(True, True, 150.0, 40.0, NOW, "x") is None
    shaded = calibration_entry(False, True, 150.0, 40.0, NOW, "x")
    assert shaded and shaded.kind == "obstacle" and shaded.elevation_deg == 40.5
    assert shaded.azimuth_from == 147.0 and shaded.azimuth_to == 153.0
    geo = np.full(720, 20.0)
    fixed = apply_entries(geo, [shaded])
    assert fixed[int(150 / 0.5)] > 40.0  # now shaded at that sun position
    sunny = calibration_entry(True, False, 150.0, 40.0, NOW, "y")
    assert sunny and sunny.kind == "clearance"
    high = np.full(720, 41.0)
    # model said shaded (horizon 41 > sun 40); clearance lowers by at most 3 -> 38 < 40: sunny
    assert apply_entries(high, [sunny])[int(150 / 0.5)] < 40.0
    # a 60-degree building is not erased by one observation
    wall = np.full(720, 60.0)
    assert apply_entries(wall, [sunny])[int(150 / 0.5)] >= 57.0


def test_corrections_serialise_and_remove():
    c = Corrections(
        overrides=[HeightOverride("o", 1.0, 2.0, 9.0, NOW.isoformat())],
        entries=[HorizonEntry("e", "obstacle", 0, 10, 5.0, NOW.isoformat(), note="tree")],
    )
    again = Corrections.from_dict(c.to_dict())
    assert again == c
    assert again.remove("e") and not again.remove("e")
    assert again.entries == [] and len(again.overrides) == 1


@pytest.mark.parametrize(("a", "b", "e"), [(-1, 10, 5), (0, 400, 5), (0, 10, 0), (0, 10, 91)])
def test_validate_entry_rejects_bad_values(a, b, e):
    with pytest.raises(ValueError):
        validate_entry(a, b, e)
    validate_entry(0, 360, 90)
