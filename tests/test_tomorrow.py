from datetime import UTC, datetime

import pytest
from homeassistant.core import HomeAssistant

from custom_components.sunspots.const import DOMAIN
from custom_components.sunspots.coordinator import DayResult
from custom_components.sunspots.core.forecast import DayForecast

from .conftest import make_entry
from .test_forecast_integration import WeatherService, fixture, set_weather
from .test_setup import setup

EARLY = datetime(2026, 6, 21, 7, 0, tzinfo=UTC)
SENSOR = "sensor.schneiderei_sun_tomorrow"
ENTITY = "binary_sensor.schneiderei_sunny"


async def test_sun_tomorrow_geometry_only(hass: HomeAssistant, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    await setup(hass, make_entry())
    state = hass.states.get(SENSOR)
    assert state.state.startswith("2026-06-22T0") and state.state.endswith(
        "+00:00"
    )  # UTC, morning of the 22nd
    attrs = state.attributes
    assert attrs["intervals"] and attrs["intervals"][0]["start"].startswith("2026-06-22T")
    assert attrs["intervals"][0]["start"].endswith("+02:00")
    assert 3 < attrs["sun_hours"] < 12
    assert attrs["forecast_available"] is False and attrs["forecast_resolution"] is None
    assert {w["class"] for w in attrs["windows"]} == {"sunny"} and attrs["best_window"][
        "class"
    ] == "sunny"


async def test_sun_tomorrow_is_consistent_with_the_action_and_binary_sensor(
    hass, fake_fetcher, freezer
):
    freezer.move_to(EARLY)
    await setup(hass, make_entry())
    attrs = hass.states.get(SENSOR).attributes
    binary = hass.states.get(ENTITY).attributes["intervals_tomorrow"]
    assert binary == [[i["start"], i["end"]] for i in attrs["intervals"]]
    response = await hass.services.async_call(
        DOMAIN,
        "get_sun_forecast",
        {"entity_id": ENTITY, "date": "2026-06-22"},
        blocking=True,
        return_response=True,
    )
    data = response[ENTITY]
    assert [(i["start"], i["end"]) for i in data["intervals"]] == [
        (i["start"], i["end"]) for i in attrs["intervals"]
    ]
    assert data["sun_hours"] == attrs["sun_hours"]


async def test_sun_tomorrow_uses_the_cloud_forecast(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    set_weather(hass, 2)
    WeatherService(hass, {"hourly": fixture("openmeteo_hourly.json")})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    attrs = hass.states.get(SENSOR).attributes
    assert attrs["forecast_available"] is True and attrs["forecast_resolution"] == "hourly"
    assert "unlikely" in {
        w["class"] for w in attrs["windows"]
    }  # the 95 % cloud block at 13-15 local
    assert all(not w["past"] for w in attrs["windows"])


async def test_sun_tomorrow_rolls_over_at_midnight(hass, fake_fetcher, freezer):
    from pytest_homeassistant_custom_component.common import async_fire_time_changed

    freezer.move_to(EARLY)
    await setup(hass, make_entry())
    freezer.move_to(datetime(2026, 6, 21, 22, 5, tzinfo=UTC))  # 00:05 local on the 22nd
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get(SENSOR).attributes["intervals"][0]["start"].startswith("2026-06-23T")


async def test_sun_tomorrow_unknown_without_any_window(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    coordinator.tomorrow = DayResult([], DayForecast((), (), False))
    coordinator.async_update_listeners()
    await hass.async_block_till_done()
    state = hass.states.get(SENSOR)
    assert (
        state.state == "unknown"
        and state.attributes["sun_hours"] == 0
        and state.attributes["best_window"] is None
    )


@pytest.mark.parametrize("theme", ["light", "dark"])
async def test_render_service_theme(hass, fake_fetcher, freezer, theme):
    freezer.move_to(EARLY)
    await setup(hass, make_entry())
    response = await hass.services.async_call(
        DOMAIN,
        "render_shadow_map",
        {"entity_id": ENTITY, "theme": theme},
        blocking=True,
        return_response=True,
    )
    svg = response[ENTITY]["svg"]
    assert ('fill="#171d24"' in svg) == (theme == "dark")
    assert ('fill="#ece9e2"' in svg) == (theme == "light")


async def test_render_service_rejects_unknown_theme(hass, fake_fetcher):
    await setup(hass, make_entry())
    with pytest.raises(Exception, match=r"theme|dark|light"):
        await hass.services.async_call(
            DOMAIN,
            "render_shadow_map",
            {"entity_id": ENTITY, "theme": "neon"},
            blocking=True,
            return_response=True,
        )
