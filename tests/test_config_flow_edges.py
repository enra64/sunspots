"""Less common config / options / reconfigure flow paths."""

import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType

from custom_components.sunspots.const import DOMAIN

from .conftest import LAT, LON, make_entry, spot_data
from .test_config_flow import finish_progress
from .test_setup import setup

HUB_INPUT = {
    "data_source": "overture",
    "allow_overpass": False,
    "radius": 250,
    "observer_height": 1.2,
    "floor_height": 3.2,
    "default_building_height": 12,
    "cloud_threshold_sunny": 40,
    "cloud_threshold_partly": 75,
}


async def menu(hass, entry, sub, choice):
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, "spot"),
        context={"source": "reconfigure", "subentry_id": sub.subentry_id},
    )
    assert result["type"] is FlowResultType.MENU
    return await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": choice}
    )


async def test_partly_threshold_below_sunny_is_rejected(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {**HUB_INPUT, "cloud_threshold_sunny": 60, "cloud_threshold_partly": 30}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"cloud_threshold_partly": "partly_below_sunny"}


async def test_options_form_prefills_configured_weather_entity(hass, fake_fetcher):
    entry = make_entry(options={"weather_entity": "weather.home"})
    await setup(hass, entry)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    defaults = {str(k): k.default() for k in result["data_schema"].schema if hasattr(k, "default")}
    assert defaults["weather_entity"] == "weather.home"
    # submitting the pre-filled form keeps the entity
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {**HUB_INPUT, "weather_entity": "weather.home"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert entry.options["weather_entity"] == "weather.home"
    await hass.async_block_till_done(wait_background_tasks=True)


async def test_reconfigure_aborts_when_hub_not_loaded(hass, fake_fetcher):
    entry = make_entry()
    entry.add_to_hass(hass)  # never set up: no runtime data
    sub = next(iter(entry.subentries.values()))
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, "spot"),
        context={"source": "reconfigure", "subentry_id": sub.subentry_id},
    )
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "entry_not_loaded"


async def test_reconfigure_settings_with_spot_weather_entity(hass, fake_fetcher):
    sub_data = spot_data(weather_entity="weather.garden")
    entry = make_entry(subentries=[sub_data])
    await setup(hass, entry)
    sub = next(iter(entry.subentries.values()))
    form = await menu(hass, entry, sub, "settings")
    assert form["step_id"] == "settings"
    defaults = {str(k): k.default() for k in form["data_schema"].schema if hasattr(k, "default")}
    assert defaults["weather_entity"] == "weather.garden"
    result = await hass.config_entries.subentries.async_configure(
        form["flow_id"],
        {
            "name": "Garden",
            "location": {"latitude": LAT, "longitude": LON},
            "radius": 250,
            "observer_height": 1.2,
            "ground_offset": 0.0,
            "weather_entity": "weather.terrace",
        },
    )
    result = await finish_progress(hass, result)
    assert result["reason"] == "reconfigure_successful"
    await hass.async_block_till_done(wait_background_tasks=True)
    assert next(iter(entry.subentries.values())).data["weather_entity"] == "weather.terrace"


async def test_reconfigure_to_another_spots_location_is_rejected(hass, fake_fetcher):
    other = spot_data(lat=LAT + 0.0004, lon=LON, title="Other")
    entry = make_entry(subentries=[spot_data(), other])
    await setup(hass, entry)
    second = next(s for s in entry.subentries.values() if s.title == "Other")
    form = await menu(hass, entry, second, "settings")
    result = await hass.config_entries.subentries.async_configure(
        form["flow_id"],
        {
            "name": "Other",
            "location": {"latitude": LAT, "longitude": LON},  # the first spot's position
            "radius": 250,
            "observer_height": 1.2,
            "ground_offset": 0.0,
        },
    )
    result = await finish_progress(hass, result)
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "already_configured"
    assert second.data["latitude"] == pytest.approx(LAT + 0.0004)


async def test_delete_corrections_without_any_aborts(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    sub = next(iter(entry.subentries.values()))
    form = await menu(hass, entry, sub, "corrections")
    result = await hass.config_entries.subentries.async_configure(
        form["flow_id"], {"next_step_id": "delete_corrections"}
    )
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "no_corrections"


async def test_refresh_failure_aborts_with_error(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    fake_fetcher.fail_with = 503
    sub = next(iter(entry.subentries.values()))
    result = await menu(hass, entry, sub, "refresh")
    result = await finish_progress(hass, result)
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "fetch_failed"
    assert result["description_placeholders"]["error"]
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert coordinator.data is not None  # cached data stays in use
