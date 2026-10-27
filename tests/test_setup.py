from datetime import UTC, datetime, timedelta

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.sunspots.const import DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE

from .conftest import make_entry, spot_data

SUNNY_MORNING = datetime(2026, 6, 21, 8, 0, tzinfo=UTC)  # 10:00 CEST, sunny per fixture
SHADED_NOON = datetime(2026, 6, 21, 10, 0, tzinfo=UTC)  # 12:00 CEST, behind the buildings


async def setup(hass: HomeAssistant, entry) -> None:
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)


async def test_setup_entities_unique_ids_and_states(hass, fake_fetcher, freezer):
    freezer.move_to(SUNNY_MORNING)
    entry = make_entry()
    await setup(hass, entry)
    assert entry.state is ConfigEntryState.LOADED
    subentry_id = next(iter(entry.subentries))

    registry = er.async_get(hass)
    unique_ids = {e.unique_id for e in er.async_entries_for_config_entry(registry, entry.entry_id)}
    assert unique_ids == {
        f"{subentry_id}_{key}"
        for key in (
            "sunny",
            "next_change",
            "sun_remaining",
            "sun_hours_today",
            "sun_forecast",
            "shadow_map",
            "sun_tomorrow",
            "data_quality",
        )
    } | {f"{entry.entry_id}_sunny_now"}

    sunny = hass.states.get("binary_sensor.schneiderei_sunny")
    assert sunny.state == "on"
    assert sunny.attributes["sun_elevation"] > 40
    assert (
        sunny.attributes["attribution"] == "© OpenStreetMap contributors, Overture Maps Foundation"
    )
    assert len(sunny.attributes["intervals_today"]) == 3
    assert 1 <= int(hass.states.get("sensor.schneiderei_sun_remaining").state) <= 5
    assert hass.states.get("sensor.sunspots_sunny_spots").state == "1"
    assert hass.states.get("sensor.sunspots_sunny_spots").attributes["entity_ids"] == [
        "binary_sensor.schneiderei_sunny"
    ]
    assert float(hass.states.get("sensor.schneiderei_sun_hours_today").state) > 3
    # data quality is a disabled-by-default diagnostic entity
    quality = registry.async_get("sensor.schneiderei_data_quality")
    assert quality.disabled_by is er.RegistryEntryDisabler.INTEGRATION


async def test_state_flips_at_the_boundary(hass, fake_fetcher, freezer):
    freezer.move_to(SUNNY_MORNING)
    await setup(hass, make_entry())
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "on"
    freezer.move_to(SUNNY_MORNING + timedelta(minutes=10))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "off"
    assert hass.states.get("sensor.schneiderei_sun_remaining").state == "0"
    assert hass.states.get("sensor.sunspots_sunny_spots").state == "0"


async def test_midnight_recomputes_today(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    await setup(hass, make_entry())
    first = hass.states.get("sensor.schneiderei_sun_hours_today").state
    freezer.move_to(datetime(2026, 6, 21, 22, 5, tzinfo=UTC))  # just after local midnight
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    coordinator = next(
        iter(hass.config_entries.async_entries(DOMAIN)[0].runtime_data.spots.values())
    )
    assert coordinator.data.window_date.isoformat() == "2026-06-22"
    assert hass.states.get("sensor.schneiderei_sun_hours_today").state != "unknown"
    assert first != "unknown"


async def test_startup_offline_from_cache_makes_no_requests(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    entry = make_entry()
    await setup(hass, entry)
    assert len(fake_fetcher.requests) > 0
    await hass.config_entries.async_unload(entry.entry_id)
    fake_fetcher.requests.clear()
    fake_fetcher.fail_with = 500
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "off"
    assert fake_fetcher.requests == []


async def test_failed_first_load_leaves_spot_unavailable_and_creates_issue(hass, fake_fetcher):
    fake_fetcher.fail_with = 503
    entry = make_entry(
        subentries=[spot_data(), spot_data(lat=52.5525, lon=13.4195, title="Second")]
    )
    await setup(hass, entry)
    assert entry.state is ConfigEntryState.LOADED  # one bad spot never blocks the hub
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "unavailable"
    issue = ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE)
    assert issue is not None and not issue.is_fixable


async def test_many_spots_load_staggered_in_background(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    spots = [spot_data(lat=52.552 + i * 0.0002, lon=13.4192, title=f"Spot {i}") for i in range(8)]
    entry = make_entry(subentries=spots)
    await setup(hass, entry)
    states = [s for s in hass.states.async_all("binary_sensor")]
    assert len(states) == 8 and all(s.state in ("on", "off") for s in states)
    tile_fetches = [r for r in fake_fetcher.requests if "pmtiles" in r[0] and (r[2] or 0) > 10_000]
    assert len(tile_fetches) == 1  # the tile is downloaded once and shared by all eight spots
