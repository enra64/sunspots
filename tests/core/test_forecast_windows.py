import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pytest

from custom_components.sunspots.core.forecast import (
    Forecast,
    ForecastEntry,
    Window,
    best_window,
    build_day_forecast,
    classify_slot,
    cloud_at,
    forecast_state,
    parse_forecast,
)
from custom_components.sunspots.core.timeline import compute_timeline

FIX = Path(__file__).parents[1] / "fixtures" / "forecasts"
TZ = ZoneInfo("Europe/Berlin")
DAY0 = datetime(2026, 6, 21, tzinfo=TZ).astimezone(UTC)
DAY1 = DAY0 + timedelta(days=1)
FLAT = np.zeros(720)


def load(name, resolution="hourly"):
    return parse_forecast(json.loads((FIX / name).read_text()), resolution)


def open_sky_timeline():
    return compute_timeline(52.55, 13.42, FLAT, DAY0, DAY0 + timedelta(days=2))


def local(win):
    return (
        win.start.astimezone(TZ).strftime("%H:%M"),
        win.end.astimezone(TZ).strftime("%H:%M"),
        win.cls,
    )


@pytest.mark.parametrize(
    ("fraction", "cloud", "expected"),
    [
        (1.0, 0, "sunny"),
        (1.0, 40, "sunny"),
        (1.0, 40.1, "partly"),
        (1.0, 75, "partly"),
        (1.0, 75.1, "unlikely"),
        (0.5, 0, "sunny"),
        (0.49, 0, "unlikely"),
        (0.0, 0, "unlikely"),
        (1.0, None, "sunny"),
        (0.3, None, "unlikely"),
    ],
)
def test_classify_slot_table(fraction, cloud, expected):
    assert classify_slot(fraction, cloud, 40, 75) == expected


def test_parse_forecast_variants():
    raw = [
        {"datetime": "2026-06-21T10:00:00Z", "cloud_coverage": 30, "condition": "cloudy"},
        {"datetime": "2026-06-21T11:00:00", "condition": "partlycloudy"},  # naive = UTC
        {"datetime": "garbage"},
        {"condition": "sunny"},
        {"datetime": "2026-06-21T12:00:00+02:00", "condition": "windy"},
    ]
    f = parse_forecast(raw, "hourly")
    assert [e.cloud for e in f.entries] == [30.0, None, 40.0]  # stable sort by start
    assert f.entries[1].start == datetime(2026, 6, 21, 10, tzinfo=UTC)  # +02:00 converted


def test_cloud_at_hourly_with_variable_steps_and_gaps():
    f = Forecast(
        (
            ForecastEntry(datetime(2026, 6, 21, 10, tzinfo=UTC), 10.0),
            ForecastEntry(datetime(2026, 6, 21, 11, tzinfo=UTC), 50.0),
            ForecastEntry(datetime(2026, 6, 21, 17, tzinfo=UTC), 90.0),  # 6-hourly step
        ),
        "hourly",
    )
    at = lambda h, m=0: cloud_at(f, datetime(2026, 6, 21, h, m, tzinfo=UTC), TZ)  # noqa: E731
    assert at(9, 59) is None and at(10) == 10.0 and at(10, 59) == 10.0
    assert at(11) == 50.0 and at(16, 59) == 50.0  # covered until the next entry (capped at 6 h)
    assert at(17, 30) == 90.0 and at(18) is None  # last entry covers one hour
    assert cloud_at(None, DAY0, TZ) is None and cloud_at(Forecast((), "hourly"), DAY0, TZ) is None


def test_cloud_at_daily_uses_calendar_day():
    f = load("metno_daily.json", "daily")
    assert cloud_at(f, DAY0 + timedelta(hours=12), TZ) == 0.0  # sunny on 21 June
    assert cloud_at(f, DAY1 + timedelta(hours=12), TZ) == 90.0  # cloudy on 22 June
    assert cloud_at(f, DAY0 + timedelta(days=9), TZ) is None
    # a local-midnight stamp (not 00:00 UTC) means the local date
    local_midnight = Forecast((ForecastEntry(DAY0, 70.0),), "daily")
    assert cloud_at(local_midnight, DAY0 + timedelta(hours=5), TZ) == 70.0


def test_metno_condition_only_hourly_windows():
    tl = open_sky_timeline()
    day = build_day_forecast(tl, DAY0, DAY1, load("metno_hourly.json"), TZ, 40, 75)
    assert day.forecast_available
    wins = [local(w) for w in day.windows]
    # sunrise ~04:45 local; cloudy 13-15 (90 % -> unlikely), partly 15-17 (40 % -> sunny), clear after
    assert wins[0][0].startswith("04:") and wins[0][1:] == ("13:00", "sunny")
    assert wins[1] == ("13:00", "15:00", "unlikely")
    assert wins[2][0] == "15:00" and wins[2][2] == "sunny" and wins[2][1].startswith("21:")
    assert len(wins) == 3


def test_openmeteo_numeric_cloud_gives_partly_window():
    tl = open_sky_timeline()
    day = build_day_forecast(tl, DAY0, DAY1, load("openmeteo_hourly.json"), TZ, 40, 75)
    assert [(w.cls, local(w)[0], local(w)[1]) for w in day.windows][1:3] == [
        ("unlikely", "13:00", "15:00"),
        ("partly", "15:00", "17:00"),
    ]
    assert day.windows[3].cls == "sunny" and day.windows[3].start.astimezone(TZ).hour == 17


def test_daily_only_applies_same_class_to_whole_day():
    tl = open_sky_timeline()
    sunny = build_day_forecast(tl, DAY0, DAY1, load("metno_daily.json", "daily"), TZ, 40, 75)
    cloudy = build_day_forecast(
        tl, DAY1, DAY1 + timedelta(days=1), load("metno_daily.json", "daily"), TZ, 40, 75
    )
    assert [w.cls for w in sunny.windows] == ["sunny"]
    assert [w.cls for w in cloudy.windows] == ["unlikely"]


def test_no_cloud_field_and_no_forecast_fall_back_to_geometry():
    tl = open_sky_timeline()
    for forecast in (load("no_cloud_field.json"), None):
        day = build_day_forecast(tl, DAY0, DAY1, forecast, TZ, 40, 75)
        assert not day.forecast_available
        assert [w.cls for w in day.windows] == ["sunny"]
        assert all(r.cloud is None for r in day.hourly)


def test_windows_never_span_geometric_shade():
    h = np.zeros(720)
    h[int(180 / 0.5) - 40 : int(180 / 0.5) + 40] = 80.0  # wall due south: shade around solar noon
    tl = compute_timeline(52.55, 13.42, h, DAY0, DAY0 + timedelta(days=2))
    day = build_day_forecast(tl, DAY0, DAY1, None, TZ, 40, 75)
    assert len(day.windows) == 2 and day.windows[0].end < day.windows[1].start
    assert all(any(a <= w.start and w.end <= b for a, b in tl.intervals) for w in day.windows)


def test_hourly_rows_only_for_hours_with_sun_and_mean_fraction():
    tl = open_sky_timeline()
    day = build_day_forecast(tl, DAY0, DAY1, load("openmeteo_hourly.json"), TZ, 40, 75)
    hours = [r.start.astimezone(TZ).hour for r in day.hourly]
    assert hours[0] in (4, 5) and hours[-1] in (21, 22) and 12 in hours and 2 not in hours
    noon = next(r for r in day.hourly if r.start.astimezone(TZ).hour == 12)
    assert noon.sunlit_fraction == 1.0 and noon.cloud == 10 and noon.cls == "sunny"


def test_state_precedence_and_best_window():
    t = lambda h, m=0: datetime(2026, 6, 21, h, m, tzinfo=UTC)  # noqa: E731
    wins = [
        Window(t(8), t(10), "sunny"),
        Window(t(10), t(12), "partly"),
        Window(t(14), t(18), "sunny"),
    ]
    assert forecast_state(wins, t(9)) == "sunny_now"
    assert forecast_state(wins, t(11)) == "partly"
    assert forecast_state(wins, t(13)) == "sunny_later"
    assert forecast_state([Window(t(14), t(15), "partly")], t(13)) == "partly_later"
    assert (
        forecast_state([Window(t(8), t(9), "unlikely"), Window(t(14), t(15), "unlikely")], t(13))
        == "no_sun_today"
    )
    assert forecast_state(wins, t(19)) == "no_sun_today"
    assert forecast_state([], t(12)) == "no_sun_today"
    assert best_window(wins, t(9)) == wins[2]  # longest sunny not yet finished
    assert best_window(wins, t(19)) is None
    assert best_window([wins[1]], t(9)) == wins[1]  # only partly left
