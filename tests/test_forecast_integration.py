import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.sunspots.const import DOMAIN
from custom_components.sunspots.sensor import FORECAST_STATES, SunForecastSensor

from .conftest import make_entry, spot_data
from .test_setup import setup

FIX = Path(__file__).parent / "fixtures" / "forecasts"
EARLY = datetime(2026, 6, 21, 7, 0, tzinfo=UTC)  # 09:00 CEST
SENSOR = "sensor.schneiderei_sun_forecast"
ENTITY = "binary_sensor.schneiderei_sunny"


class WeatherService:
    """Stands in for weather.get_forecasts."""

    def __init__(self, hass: HomeAssistant, data: dict[str, list]):
        self.data = data
        self.calls: list[tuple[str, str]] = []
        self.fail = False
        hass.services.async_register(
            "weather", "get_forecasts", self.handle, supports_response=SupportsResponse.ONLY
        )

    async def handle(self, call: ServiceCall):
        entity, kind = call.data["entity_id"], call.data["type"]
        if isinstance(entity, list):
            entity = entity[0]
        self.calls.append((entity, kind))
        if self.fail:
            raise HomeAssistantError("provider down")
        return {entity: {"forecast": self.data.get(kind, [])}}


def fixture(name):
    return json.loads((FIX / name).read_text())


def set_weather(hass, features, state="sunny", entity="weather.home"):
    hass.states.async_set(entity, state, {"supported_features": features})


async def test_forecast_sensor_with_metno_hourly(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 3)
    service = WeatherService(
        hass, {"hourly": fixture("metno_hourly.json"), "daily": fixture("metno_daily.json")}
    )
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    state = hass.states.get(SENSOR)
    assert state.state in FORECAST_STATES and state.state != "unavailable"
    attrs = state.attributes
    assert attrs["forecast_available"] is True and attrs["forecast_resolution"] == "hourly"
    assert attrs["source_entity"] == "weather.home"
    classes = {w["class"] for w in attrs["windows"]}
    assert "sunny" in classes and "unlikely" in classes  # cloudy 13-15 is flagged
    assert all(w["start"].endswith("+02:00") for w in attrs["windows"])
    assert attrs["best_window"]["class"] == "sunny"
    assert all(set(r) == {"start", "sunlit_fraction", "cloud", "class"} for r in attrs["hourly"])
    assert service.calls == [("weather.home", "hourly")]  # hourly preferred, daily never asked


async def test_forecast_state_follows_time_and_marks_past_windows(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 3)
    WeatherService(hass, {"hourly": fixture("metno_hourly.json")})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    assert hass.states.get(SENSOR).state == "sunny_now"
    freezer.move_to(datetime(2026, 6, 21, 21, 30, tzinfo=UTC))  # 23:30 local
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    state = hass.states.get(SENSOR)
    assert state.state == "no_sun_today"
    assert state.attributes["windows"] and all(w["past"] for w in state.attributes["windows"])
    assert state.attributes["best_window"] is None


async def test_daily_only_provider(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 1)
    service = WeatherService(hass, {"daily": fixture("metno_daily.json")})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    attrs = hass.states.get(SENSOR).attributes
    assert attrs["forecast_resolution"] == "daily" and attrs["forecast_available"] is True
    assert {w["class"] for w in attrs["windows"]} == {"sunny"}  # 21 June is "sunny" in the fixture
    assert service.calls == [("weather.home", "daily")]


async def test_provider_without_cloud_field_is_geometry_only(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 2)
    WeatherService(hass, {"hourly": fixture("no_cloud_field.json")})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    attrs = hass.states.get(SENSOR).attributes
    assert attrs["forecast_available"] is False and attrs["forecast_resolution"] == "hourly"
    assert {w["class"] for w in attrs["windows"]} == {"sunny"}


async def test_no_weather_entity_still_gives_geometry_forecast(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    await setup(hass, make_entry())
    state = hass.states.get(SENSOR)
    assert state.state == "sunny_now"
    assert state.attributes["forecast_available"] is False
    assert (
        state.attributes["forecast_resolution"] is None
        and state.attributes["source_entity"] is None
    )


async def test_weather_entity_without_forecast_support(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 0)
    service = WeatherService(hass, {})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    assert service.calls == []
    assert hass.states.get(SENSOR).attributes["forecast_available"] is False


async def test_failed_refresh_keeps_last_good_forecast(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 2)
    service = WeatherService(hass, {"hourly": fixture("metno_hourly.json")})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    before = hass.states.get(SENSOR).attributes["windows"]
    service.fail = True
    freezer.move_to(EARLY + timedelta(minutes=31))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(service.calls) == 2
    after = hass.states.get(SENSOR).attributes
    assert after["forecast_available"] is True
    assert [w["class"] for w in after["windows"]] == [w["class"] for w in before]


async def test_state_changes_are_debounced_and_fetch_is_shared(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 2)
    service = WeatherService(hass, {"hourly": fixture("metno_hourly.json")})
    subs = [spot_data(), spot_data(lat=52.5525, lon=13.4195, title="Second")]
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}, subentries=subs))
    assert len(service.calls) == 1  # two spots, one weather entity, one fetch
    for state in ("cloudy", "sunny", "partlycloudy"):
        set_weather(hass, 2, state)
        await hass.async_block_till_done()
    assert len(service.calls) == 1
    freezer.move_to(EARLY + timedelta(minutes=6))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(service.calls) == 2  # one fetch after the debounce window


async def test_get_sun_forecast_includes_windows(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 3)
    WeatherService(
        hass, {"hourly": fixture("metno_hourly.json"), "daily": fixture("metno_daily.json")}
    )
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    resp = await hass.services.async_call(
        DOMAIN, "get_sun_forecast", {"entity_id": ENTITY}, blocking=True, return_response=True
    )
    data = resp[ENTITY]
    assert data["source"] == "geometry+weather" and data["forecast_resolution"] == "hourly"
    assert data["windows"] and data["hourly"] and data["sunny_now"] is True
    tomorrow = await hass.services.async_call(
        DOMAIN,
        "get_sun_forecast",
        {"entity_id": ENTITY, "date": "2026-06-22"},
        blocking=True,
        return_response=True,
    )
    assert tomorrow[ENTITY]["windows"]  # inside the two-day window, hourly fixture covers 48 h
    far = await hass.services.async_call(
        DOMAIN,
        "get_sun_forecast",
        {"entity_id": ENTITY, "date": "2026-07-30"},
        blocking=True,
        return_response=True,
    )
    assert far[ENTITY]["source"] == "geometry" and far[ENTITY]["windows"]  # computed on demand


async def test_hub_sensor_exposes_next_window(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    await setup(hass, make_entry())
    nxt = hass.states.get("sensor.sunspots_sunny_spots").attributes["next_window"]
    assert nxt["spot"] == "Schneiderei" and nxt["class"] == "sunny"


def test_large_attributes_are_unrecorded():
    assert {"windows", "best_window", "hourly"} <= SunForecastSensor._unrecorded_attributes


async def test_partly_limit_below_sunny_limit_is_rejected(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "data_source": "overture",
            "allow_overpass": False,
            "radius": 250,
            "observer_height": 1.2,
            "floor_height": 3.2,
            "default_building_height": 12,
            "cloud_threshold_sunny": 60,
            "cloud_threshold_partly": 40,
        },
    )
    assert result["errors"] == {"cloud_threshold_partly": "partly_below_sunny"}


async def test_unknown_forecast_service_error_is_not_fatal(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 2)  # weather.get_forecasts is not registered at all
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    assert hass.states.get(SENSOR).attributes["forecast_available"] is False
    assert hass.states.get(SENSOR).state == "sunny_now"  # geometry still works
