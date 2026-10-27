"""Entities of a spot whose first load failed (coordinator.data is None) and sparse data."""

from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from custom_components.sunspots.binary_sensor import (
    SunnyBinarySensor,
    SunnyWeatherAwareBinarySensor,
)
from custom_components.sunspots.sensor import (
    DataQualitySensor,
    NextChangeSensor,
    SunForecastSensor,
    SunHoursTodaySensor,
    SunRemainingSensor,
)

from .conftest import make_entry
from .test_setup import setup

NOON = datetime(2026, 6, 21, 10, 0, tzinfo=UTC)


@pytest.fixture
async def broken_coordinator(hass, fake_fetcher, freezer):
    freezer.move_to(NOON)
    fake_fetcher.fail_with = 503
    entry = make_entry(options={"weather_entity": "weather.home"})
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert coordinator.data is None and coordinator.forecast_day is None
    return coordinator


@pytest.mark.parametrize(
    "cls", [NextChangeSensor, SunRemainingSensor, SunHoursTodaySensor, DataQualitySensor]
)
async def test_value_sensors_without_data_are_none(broken_coordinator, cls):
    sensor = cls(broken_coordinator)
    assert sensor.native_value is None
    assert sensor.available is False


async def test_data_quality_attributes_without_data(broken_coordinator):
    assert DataQualitySensor(broken_coordinator).extra_state_attributes is None


async def test_forecast_sensor_without_forecast_day(broken_coordinator):
    sensor = SunForecastSensor(broken_coordinator)
    assert sensor.native_value is None
    assert sensor.extra_state_attributes is None
    assert sensor.available is False


async def test_binary_sensors_without_data(broken_coordinator):
    sunny = SunnyBinarySensor(broken_coordinator)
    assert sunny.is_on is None and sunny.extra_state_attributes is None
    aware = SunnyWeatherAwareBinarySensor(broken_coordinator)
    assert aware.is_on is None
    assert aware.extra_state_attributes["weather_entity"] == "weather.home"
    assert aware.extra_state_attributes["cloud_known"] is False


async def test_unavailable_states_for_failed_spot(hass, broken_coordinator):
    for entity_id in (
        "binary_sensor.schneiderei_sunny",
        "binary_sensor.schneiderei_sunny_weather_aware",
        "sensor.schneiderei_next_change",
        "sensor.schneiderei_sun_remaining",
        "sensor.schneiderei_sun_hours_today",
        "sensor.schneiderei_sun_forecast",
    ):
        assert hass.states.get(entity_id).state == "unavailable", entity_id
    assert hass.states.get("sensor.sunspots_sunny_spots").state == "0"


async def test_data_quality_without_coverage_is_none(hass, fake_fetcher, freezer):
    freezer.move_to(NOON)
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    real = coordinator.data
    sensor = DataQualitySensor(coordinator)
    assert 0 <= sensor.native_value <= 100
    coordinator.data = SimpleNamespace(model=SimpleNamespace(coverage=None))
    assert sensor.native_value is None
    coordinator.data = real
    assert sensor.extra_state_attributes["building_count"] == real.building_count
