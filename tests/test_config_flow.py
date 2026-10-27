from homeassistant.config_entries import SOURCE_USER, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.sunspots.const import DOMAIN

from .conftest import LAT, LON, make_entry
from .test_setup import setup


async def test_hub_flow_creates_entry_with_defaults(hass: HomeAssistant):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "data_source": "overture",
            "allow_overpass": False,
            "radius": 250,
            "observer_height": 1.2,
            "floor_height": 3.2,
            "default_building_height": 12,
            "cloud_threshold_sunny": 40,
            "cloud_threshold_partly": 75,
            "weather_entity": "weather.home",
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"]["weather_entity"] == "weather.home"
    assert result["options"]["allow_overpass"] is False


async def test_hub_flow_is_single_instance(hass: HomeAssistant):
    make_entry(subentries=[]).add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_overpass_source_requires_permission(hass: HomeAssistant):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "data_source": "overpass",
            "allow_overpass": False,
            "radius": 250,
            "observer_height": 1.2,
            "floor_height": 3.2,
            "default_building_height": 12,
            "cloud_threshold_sunny": 40,
            "cloud_threshold_partly": 75,
        },
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"allow_overpass": "overpass_not_allowed"}


async def test_options_flow_updates_and_reloads(hass: HomeAssistant, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "data_source": "overture",
            "allow_overpass": False,
            "radius": 300,
            "observer_height": 1.2,
            "floor_height": 3.0,
            "default_building_height": 12,
            "cloud_threshold_sunny": 40,
            "cloud_threshold_partly": 75,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done(wait_background_tasks=True)
    assert entry.state is ConfigEntryState.LOADED
    assert entry.options["radius"] == 300
    assert entry.runtime_data.settings.floor_height == 3.0


async def start_add_spot(hass, entry, lat=LAT + 0.0003, lon=LON, name="Terrace"):
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, "spot"), context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM and result["step_id"] == "user"
    return await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"name": name, "location": {"latitude": lat, "longitude": lon}}
    )


async def finish_progress(hass, result):
    while result["type"] in (FlowResultType.SHOW_PROGRESS, FlowResultType.SHOW_PROGRESS_DONE):
        await hass.async_block_till_done()
        result = await hass.config_entries.subentries.async_configure(result["flow_id"])
    return result


async def test_add_spot_happy_path(hass: HomeAssistant, fake_fetcher):
    entry = make_entry(subentries=[])
    await setup(hass, entry)
    result = await start_add_spot(hass, entry)
    assert result["type"] is FlowResultType.SHOW_PROGRESS
    result = await finish_progress(hass, result)
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] in ("summary", "summary_low")
    assert int(result["description_placeholders"]["buildings"]) > 20
    if result["step_id"] == "summary_low":
        result = await hass.config_entries.subentries.async_configure(
            result["flow_id"], {"continue_low_coverage": True}
        )
    else:
        result = await hass.config_entries.subentries.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(entry.subentries) == 1
    sub = next(iter(entry.subentries.values()))
    assert sub.title == "Terrace" and sub.data["latitude"] == round(LAT + 0.0003, 6)
    assert hass.states.get("binary_sensor.terrace_sunny") is not None


async def test_add_spot_low_coverage_needs_confirmation(hass: HomeAssistant, fake_fetcher):
    entry = make_entry(subentries=[], options={"default_building_height": 12})
    await setup(hass, entry)
    # a spot far from any measured heights: choose a point in the tile's less-mapped corner
    from unittest.mock import patch

    from custom_components.sunspots.config_flow import FetchSummary
    from custom_components.sunspots.core.const import LOW_COVERAGE_THRESHOLD  # noqa: F401

    async def low(self, *a, **k):
        return FetchSummary(120, 0.1, "overture")

    with patch("custom_components.sunspots.config_flow.SpotSubentryFlow._async_summarise", low):
        result = await finish_progress(hass, await start_add_spot(hass, entry))
        assert result["step_id"] == "summary_low"
        again = await hass.config_entries.subentries.async_configure(
            result["flow_id"], {"continue_low_coverage": False}
        )
        assert again["type"] is FlowResultType.FORM and again["errors"] == {
            "continue_low_coverage": "low_coverage_confirm"
        }
        done = await hass.config_entries.subentries.async_configure(
            result["flow_id"], {"continue_low_coverage": True}
        )
        assert done["type"] is FlowResultType.CREATE_ENTRY


async def test_add_spot_provider_failure_aborts_with_reason(hass: HomeAssistant, fake_fetcher):
    entry = make_entry(subentries=[])
    await setup(hass, entry)
    fake_fetcher.fail_with = 503
    result = await finish_progress(hass, await start_add_spot(hass, entry))
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "fetch_failed"
    assert "503" in result["description_placeholders"]["error"]


async def test_add_spot_duplicate_location(hass: HomeAssistant, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    result = await start_add_spot(hass, entry, lat=LAT, lon=LON)
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"location": "already_configured"}


async def test_second_spot_at_covered_location_makes_no_http_request(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    fake_fetcher.requests.clear()
    result = await finish_progress(hass, await start_add_spot(hass, entry, lat=LAT + 0.0004))
    assert result["type"] is FlowResultType.FORM, result
    if result["step_id"] == "summary_low":
        result = await hass.config_entries.subentries.async_configure(
            result["flow_id"], {"continue_low_coverage": True}
        )
    else:
        result = await hass.config_entries.subentries.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done(wait_background_tasks=True)
    assert fake_fetcher.requests == []
    assert len(entry.subentries) == 2


async def test_add_spot_aborts_when_hub_not_loaded(hass: HomeAssistant, fake_fetcher):
    entry = make_entry()
    entry.add_to_hass(hass)
    result = await hass.config_entries.subentries.async_init(
        (entry.entry_id, "spot"), context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "entry_not_loaded"


async def start_reconfigure(hass, entry):
    sub = next(iter(entry.subentries.values()))
    return await hass.config_entries.subentries.async_init(
        (entry.entry_id, "spot"),
        context={"source": "reconfigure", "subentry_id": sub.subentry_id},
    )


async def test_reconfigure_settings_changes_ground_offset_and_reloads(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    before = next(iter(entry.runtime_data.spots.values())).data.model.geometric.copy()
    result = await start_reconfigure(hass, entry)
    assert result["type"] is FlowResultType.MENU
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "settings"}
    )
    assert result["step_id"] == "settings"
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {
            "name": "Schneiderei Terrace",
            "location": {"latitude": LAT, "longitude": LON},
            "radius": 250,
            "observer_height": 1.2,
            "ground_offset": 4.0,
        },
    )
    result = await finish_progress(hass, result)
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "reconfigure_successful"
    await hass.async_block_till_done(wait_background_tasks=True)
    sub = next(iter(entry.subentries.values()))
    assert sub.title == "Schneiderei Terrace" and sub.data["ground_offset"] == 4.0
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert coordinator.data.model.geometric.mean() < before.mean()  # raised observer sees more sky


async def test_reconfigure_corrections_add_and_delete(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))

    result = await start_reconfigure(hass, entry)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "corrections"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "add_obstacle"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"],
        {"azimuth_from": 200, "azimuth_to": 230, "elevation": 35, "note": "tree"},
    )
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "correction_added"
    assert len(coordinator.data.corrections.entries) == 1

    result = await start_reconfigure(hass, entry)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "corrections"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "delete_corrections"}
    )
    entry_id = coordinator.data.corrections.entries[0].id
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"delete": [entry_id]}
    )
    assert result["reason"] == "correction_deleted"
    assert coordinator.data.corrections.entries == []


async def test_reconfigure_height_override_error_and_success(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    building = coordinator._buildings[0]
    from tests.core.helpers import unproject

    x, y = building.polygons[0][0][0]
    lat, lon = unproject(LAT, LON, x, y)

    result = await start_reconfigure(hass, entry)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "corrections"}
    )
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "add_height"}
    )
    bad = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"location": {"latitude": 10.0, "longitude": 10.0}, "height": 20}
    )
    assert bad["errors"] == {"location": "no_building_at_location"}
    good = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"location": {"latitude": lat, "longitude": lon}, "height": 45}
    )
    assert good["reason"] == "correction_added"
    assert len(coordinator.data.corrections.overrides) == 1
    assert coordinator.data.model.source_pct["override"] > 0


async def test_reconfigure_refresh_refetches(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    fake_fetcher.requests.clear()
    result = await start_reconfigure(hass, entry)
    result = await hass.config_entries.subentries.async_configure(
        result["flow_id"], {"next_step_id": "refresh"}
    )
    result = await finish_progress(hass, result)
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "refresh_done"
    assert any(r[0].endswith("catalog.json") for r in fake_fetcher.requests)


async def test_hub_reconfigure_updates_options_and_reloads(hass: HomeAssistant, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    result = await entry.start_reconfigure_flow(hass)
    assert result["type"] is FlowResultType.FORM and result["step_id"] == "reconfigure"
    bad = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "data_source": "overpass",
            "allow_overpass": False,
            "radius": 250,
            "observer_height": 1.2,
            "floor_height": 3.2,
            "default_building_height": 12,
            "cloud_threshold_sunny": 40,
            "cloud_threshold_partly": 75,
        },
    )
    assert bad["errors"] == {"allow_overpass": "overpass_not_allowed"}
    done = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {
            "data_source": "overture",
            "allow_overpass": False,
            "radius": 200,
            "observer_height": 1.5,
            "floor_height": 3.2,
            "default_building_height": 12,
            "cloud_threshold_sunny": 40,
            "cloud_threshold_partly": 75,
        },
    )
    assert done["type"] is FlowResultType.ABORT and done["reason"] == "reconfigure_successful"
    await hass.async_block_till_done(wait_background_tasks=True)
    assert entry.options["radius"] == 200 and entry.runtime_data.settings.observer_height == 1.5
