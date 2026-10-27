import json
from datetime import UTC, datetime, timedelta

from homeassistant.config_entries import ConfigEntryState
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.sunspots.const import DOMAIN

from .conftest import make_entry, spot_data
from .test_setup import SHADED_NOON, setup


async def test_deleting_a_spot_removes_store_device_and_entities(hass, fake_fetcher, hass_storage):
    entry = make_entry(
        subentries=[spot_data(), spot_data(lat=52.5525, lon=13.4195, title="Second")]
    )
    await setup(hass, entry)
    first, second = list(entry.subentries)
    assert f"{DOMAIN}.spot.{first}" in hass_storage and f"{DOMAIN}.spot.{second}" in hass_storage

    hass.config_entries.async_remove_subentry(entry, first)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert f"{DOMAIN}.spot.{first}" not in hass_storage
    assert f"{DOMAIN}.spot.{second}" in hass_storage
    devices = dr.async_entries_for_config_entry(dr.async_get(hass), entry.entry_id)
    assert {d.name for d in devices if d.name != "Sunspots"} == {"Second"}
    assert hass.states.get("binary_sensor.schneiderei_sunny") is None
    assert hass.states.get("binary_sensor.second_sunny") is not None
    assert entry.state is ConfigEntryState.LOADED


async def test_removing_the_hub_wipes_all_storage(hass, fake_fetcher, hass_storage):
    entry = make_entry()
    await setup(hass, entry)
    assert any(k.startswith(f"{DOMAIN}.tile.") for k in hass_storage)
    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert not [k for k in hass_storage if k.startswith(DOMAIN)]


async def test_store_content_has_no_surprises(hass, fake_fetcher, hass_storage):
    entry = make_entry()
    await setup(hass, entry)
    sid = next(iter(entry.subentries))
    data = hass_storage[f"{DOMAIN}.spot.{sid}"]
    assert data["version"] == 1
    body = data["data"]
    assert body["meta"]["algo_version"] == 1 and len(body["horizon"]) == 720
    assert body["source"]["provider"] == "overture" and body["source"]["release"] == "2026-10-21.0"
    json.dumps(body)  # serialisable


async def test_algo_version_mismatch_recomputes_without_network(hass, fake_fetcher, hass_storage):
    entry = make_entry()
    await setup(hass, entry)
    sid = next(iter(entry.subentries))
    hass_storage[f"{DOMAIN}.spot.{sid}"]["data"]["meta"]["algo_version"] = 0
    hass_storage[f"{DOMAIN}.spot.{sid}"]["data"]["horizon"] = [0.0] * 720  # stale values
    await hass.config_entries.async_unload(entry.entry_id)
    fake_fetcher.requests.clear()
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert coordinator.data.model.geometric.max() > 20
    assert fake_fetcher.requests == []
    assert hass_storage[f"{DOMAIN}.spot.{sid}"]["data"]["meta"]["algo_version"] == 1


async def test_legacy_storage_minor_version_triggers_recompute(hass, fake_fetcher, hass_storage):
    entry = make_entry()
    await setup(hass, entry)
    sid = next(iter(entry.subentries))
    hass_storage[f"{DOMAIN}.spot.{sid}"]["minor_version"] = 0
    hass_storage[f"{DOMAIN}.spot.{sid}"]["data"]["horizon"] = [0.0] * 720
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert next(iter(entry.runtime_data.spots.values())).data.model.geometric.max() > 20


async def test_config_entry_migration(hass, fake_fetcher):
    entry = make_entry(minor_version=0)
    await setup(hass, entry)
    assert entry.minor_version == 1 and entry.state is ConfigEntryState.LOADED

    future = make_entry(subentries=[], version=2)
    future.add_to_hass(hass)
    await hass.config_entries.async_setup(future.entry_id)
    assert future.state is ConfigEntryState.MIGRATION_ERROR


async def test_changed_hub_settings_recompute_from_stored_buildings(hass, fake_fetcher):
    entry = make_entry(options={"default_building_height": 12})
    await setup(hass, entry)
    before = next(iter(entry.runtime_data.spots.values())).data.model.geometric.copy()
    fake_fetcher.requests.clear()
    hass.config_entries.async_update_entry(entry, options={"default_building_height": 40})
    await hass.async_block_till_done(wait_background_tasks=True)
    after = next(iter(entry.runtime_data.spots.values())).data.model.geometric
    assert fake_fetcher.requests == []
    assert after.sum() > before.sum()


async def test_ninety_day_refresh_runs_only_when_stale(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    entry = make_entry()
    await setup(hass, entry)
    fake_fetcher.requests.clear()
    freezer.move_to(SHADED_NOON + timedelta(days=30, hours=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert fake_fetcher.requests == []  # fresh enough
    freezer.move_to(datetime.now(UTC) + timedelta(days=95))
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert any(r[0].endswith("catalog.json") for r in fake_fetcher.requests)


async def test_entities_created_with_subentry_linkage(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    sid = next(iter(entry.subentries))
    registry = er.async_get(hass)
    ent = registry.async_get("binary_sensor.schneiderei_sunny")
    assert ent.config_subentry_id == sid
    assert ent.unique_id == f"{sid}_sunny"
