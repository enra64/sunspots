"""Regression tests for bugs found in the pre-release review."""

from datetime import UTC, datetime
from unittest.mock import patch

from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import issue_registry as ir

from custom_components.sunspots.const import DOMAIN
from custom_components.sunspots.issues import buildings_issue_id

from .conftest import LAT, LON, make_entry, spot_data
from .test_config_flow import finish_progress, start_reconfigure
from .test_services import ENTITY
from .test_setup import SHADED_NOON, setup


async def test_calibrate_on_the_device_adds_one_entry(hass, fake_fetcher, freezer):
    """Both binary sensors carry the actions; targeting the spot's device must not run them twice."""
    freezer.move_to(SHADED_NOON)
    hass.states.async_set("weather.home", "sunny")
    entry = make_entry(options={"weather_entity": "weather.home"})
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, coordinator.subentry_id), entry.entry_id
    )
    response = await hass.services.async_call(
        DOMAIN,
        "calibrate",
        {"device_id": device.id, "observed": "sunny"},
        blocking=True,
        return_response=True,
    )
    assert len(response) == 2
    assert len({r["entry_id"] for r in response.values()}) == 1
    assert len(coordinator.data.corrections.entries) == 1
    assert ENTITY in response


HUB_INPUT = {
    "data_source": "overture",
    "allow_overpass": False,
    "radius": 250,
    "observer_height": 1.2,
    "floor_height": 3.0,
    "default_building_height": 12,
    "cloud_threshold_sunny": 40,
    "cloud_threshold_partly": 75,
}


async def test_options_flow_can_clear_the_weather_entity(hass, fake_fetcher):
    hass.states.async_set("weather.home", "sunny")
    entry = make_entry(options={"weather_entity": "weather.home"})
    await setup(hass, entry)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], HUB_INPUT)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert entry.options["weather_entity"] is None
    assert hass.states.get("binary_sensor.schneiderei_sunny_weather_aware") is None or (
        hass.states.get("binary_sensor.schneiderei_sunny_weather_aware").state == "unavailable"
    )


async def test_spot_settings_can_clear_the_weather_override(hass, fake_fetcher):
    hass.states.async_set("weather.terrace", "sunny")
    entry = make_entry(subentries=[spot_data(weather_entity="weather.terrace")])
    await setup(hass, entry)
    result = await start_reconfigure(hass, entry)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "settings"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Schneiderei",
            "location": {"latitude": LAT, "longitude": LON},
            "radius": 250,
            "observer_height": 1.2,
            "ground_offset": 0.0,
        },
    )
    result = await finish_progress(hass, result)
    assert result["reason"] == "reconfigure_successful"
    assert "weather_entity" not in next(iter(entry.subentries.values())).data


async def test_corrections_menu_aborts_for_a_spot_that_is_not_loaded(hass, fake_fetcher):
    fake_fetcher.fail_with = 503
    entry = make_entry()
    await setup(hass, entry)
    result = await start_reconfigure(hass, entry)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "corrections"}
    )
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "spot_not_loaded"


async def test_buildings_issue_is_per_spot(hass, fake_fetcher, freezer):
    """One spot recovering must not clear the issue of another spot that is still broken."""
    freezer.move_to(SHADED_NOON)
    fake_fetcher.fail_with = 503
    entry = make_entry(
        subentries=[spot_data(), spot_data(lat=52.5525, lon=13.4195, title="Second")]
    )
    await setup(hass, entry)
    first, second = (entry.runtime_data.spots[s] for s in entry.subentries)
    registry = ir.async_get(hass)
    assert registry.async_get_issue(DOMAIN, buildings_issue_id(first.subentry_id))
    assert registry.async_get_issue(DOMAIN, buildings_issue_id(second.subentry_id))

    fake_fetcher.fail_with = None
    first._unsub_retry()  # fire only the first spot's retry, as its timer would
    await first._async_retry(SHADED_NOON)
    assert registry.async_get_issue(DOMAIN, buildings_issue_id(first.subentry_id)) is None
    assert registry.async_get_issue(DOMAIN, buildings_issue_id(second.subentry_id))

    hass.config_entries.async_remove_subentry(entry, second.subentry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert registry.async_get_issue(DOMAIN, buildings_issue_id(second.subentry_id)) is None


async def test_retry_finishing_after_unload_starts_no_timers(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    fake_fetcher.fail_with = 503
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    fake_fetcher.fail_with = None
    await coordinator.async_shutdown()  # the entry unloads while a retry is running
    assert await coordinator.async_initialize() is False
    assert coordinator._unsub_tick is None and coordinator._unsub_check is None


async def test_midnight_boundary_on_dst_day_is_local_midnight(hass, fake_fetcher, freezer):
    """Saturday before the October DST change: the next refresh is at 00:00 local, not 01:00."""
    freezer.move_to(datetime(2026, 10, 24, 20, 0, tzinfo=UTC))  # 22:00 CEST
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    with patch("custom_components.sunspots.coordinator.async_track_point_in_utc_time") as track:
        coordinator._schedule(coordinator.data, datetime(2026, 10, 24, 20, 0, tzinfo=UTC))
    when = track.call_args.args[2]
    assert when == datetime(2026, 10, 24, 22, 0, 1, tzinfo=UTC)  # 00:00:01 CEST on Oct 25


async def test_failed_load_warns_once_across_retries(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    fake_fetcher.fail_with = 503
    entry = make_entry()
    with patch("custom_components.sunspots.coordinator._LOGGER") as logger:
        await setup(hass, entry)
        coordinator = next(iter(entry.runtime_data.spots.values()))
        for _ in range(2):
            coordinator._unsub_retry()
            coordinator._unsub_retry = None
            await coordinator._async_retry(SHADED_NOON)

    def calls(method):
        return [c for c in method.call_args_list if "could not be loaded" in c.args[0]]

    assert len(calls(logger.warning)) == 1 and len(calls(logger.debug)) == 2
