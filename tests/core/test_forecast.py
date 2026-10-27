from datetime import UTC, datetime, timedelta

from custom_components.sunspots.core.forecast import CloudGate, cloud_percent

T0 = datetime(2026, 6, 21, 12, tzinfo=UTC)


def test_cloud_percent_prefers_coverage_then_condition():
    assert cloud_percent(35.0, "cloudy") == 35.0
    assert cloud_percent(150, None) == 100.0
    assert cloud_percent(None, "partlycloudy") == 40.0
    assert cloud_percent(None, "clear-night") == 0.0
    assert cloud_percent(None, "windy") is None
    assert cloud_percent(None, "exceptional") is None
    assert cloud_percent(None, None) is None


def test_gate_hysteresis_and_dwell():
    gate = CloudGate(40.0)
    assert gate.update(T0, None) is None  # unknown at start
    assert gate.update(T0, 40.0) is True  # partlycloudy (40) counts as clear at threshold 40
    assert gate.update(T0 + timedelta(minutes=1), 90.0) is True  # dwell: held
    assert gate.update(T0 + timedelta(minutes=6), 43.0) is True  # inside hysteresis band
    assert gate.update(T0 + timedelta(minutes=7), 90.0) is False
    assert gate.update(T0 + timedelta(minutes=8), 0.0) is False  # dwell again
    assert gate.update(T0 + timedelta(minutes=13), 41.0) is False  # above threshold: stays cloudy
    assert gate.update(T0 + timedelta(minutes=14), 40.0) is True
    assert gate.update(T0 + timedelta(minutes=30), None) is True  # unknown keeps state
