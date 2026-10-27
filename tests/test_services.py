from datetime import UTC, datetime

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.sunspots.const import DOMAIN
from tests.core.helpers import unproject

from .conftest import LAT, LON, make_entry
from .test_setup import SHADED_NOON, SUNNY_MORNING, setup

ENTITY = "binary_sensor.schneiderei_sunny"


async def test_get_sun_forecast_geometry(hass, fake_fetcher, freezer):
    freezer.move_to(SUNNY_MORNING)
    await setup(hass, make_entry())
    response = await hass.services.async_call(
        DOMAIN, "get_sun_forecast", {"entity_id": ENTITY}, blocking=True, return_response=True
    )
    data = response[ENTITY]
    assert data["date"] == "2026-06-21" and data["source"] == "geometry"
    assert len(data["intervals"]) == 3
    assert data["intervals"][0]["start"].startswith("2026-06-21T07:34")
    assert data["intervals"][0]["start"].endswith("+02:00")
    assert 5 < data["sun_hours"] < 9 and data["sunny_now"] is True
    assert data["next_change"].startswith("2026-06-21T10:03")


async def test_get_sun_forecast_other_day_is_computed_on_demand(hass, fake_fetcher, freezer):
    freezer.move_to(SUNNY_MORNING)
    await setup(hass, make_entry())
    response = await hass.services.async_call(
        DOMAIN,
        "get_sun_forecast",
        {"entity_id": ENTITY, "date": "2026-12-21"},
        blocking=True,
        return_response=True,
    )
    data = response[ENTITY]
    assert data["date"] == "2026-12-21" and "sunny_now" not in data
    assert data["sun_hours"] < 4


async def test_set_building_height_changes_the_model(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))

    def centroid_distance(b):
        ring = b.polygons[0][0]
        cx, cy = sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)
        return (cx**2 + cy**2) ** 0.5

    target = min(coordinator._buildings, key=lambda b: abs(centroid_distance(b) - 60))
    x, y = (
        sum(p[0] for p in target.polygons[0][0]) / len(target.polygons[0][0]),
        sum(p[1] for p in target.polygons[0][0]) / len(target.polygons[0][0]),
    )
    lat, lon = unproject(LAT, LON, x, y)
    before = coordinator.data.model.geometric.copy()
    await hass.services.async_call(
        DOMAIN,
        "set_building_height",
        {"entity_id": ENTITY, "latitude": lat, "longitude": lon, "height": 400},
        blocking=True,
    )
    assert len(coordinator.data.corrections.overrides) == 1
    assert (coordinator.data.model.geometric >= before - 1e-9).all()
    assert coordinator.data.model.geometric.sum() > before.sum()


async def test_set_building_height_validation(hass, fake_fetcher):
    await setup(hass, make_entry())
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "set_building_height",
            {"entity_id": ENTITY, "latitude": 1.0, "longitude": 1.0, "height": 20},
            blocking=True,
        )
    with pytest.raises(Exception, match=r"height|range|0\.5"):
        await hass.services.async_call(
            DOMAIN,
            "set_building_height",
            {"entity_id": ENTITY, "latitude": LAT, "longitude": LON, "height": 9000},
            blocking=True,
        )


async def test_calibrate_shaded_when_model_says_sunny_adds_obstacle(hass, fake_fetcher, freezer):
    freezer.move_to(SUNNY_MORNING)
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert hass.states.get(ENTITY).state == "on"
    response = await hass.services.async_call(
        DOMAIN,
        "calibrate",
        {"entity_id": ENTITY, "observed": "shaded"},
        blocking=True,
        return_response=True,
    )
    assert response[ENTITY]["result"] == "created"
    entry_ = coordinator.data.corrections.entries[0]
    assert entry_.kind == "obstacle" and entry_.source == "calibration"
    await hass.async_block_till_done()
    assert hass.states.get(ENTITY).state == "off"
    # observing shaded again is now consistent and adds nothing
    again = await hass.services.async_call(
        DOMAIN,
        "calibrate",
        {"entity_id": ENTITY, "observed": "shaded"},
        blocking=True,
        return_response=True,
    )
    assert (
        again[ENTITY]["result"] == "consistent" and len(coordinator.data.corrections.entries) == 1
    )


async def test_calibrate_sunny_when_model_says_shaded_adds_bounded_clearance(
    hass, fake_fetcher, freezer
):
    freezer.move_to(SHADED_NOON)
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    response = await hass.services.async_call(
        DOMAIN,
        "calibrate",
        {"entity_id": ENTITY, "observed": "sunny"},
        blocking=True,
        return_response=True,
    )
    assert response[ENTITY]["result"] == "created"
    assert coordinator.data.corrections.entries[0].kind == "clearance"
    # tall wall (84 deg) cannot be erased by a 3-degree clearance
    assert hass.states.get(ENTITY).state == "off"


async def test_calibrate_rejected_at_night(hass, fake_fetcher, freezer):
    freezer.move_to(datetime(2026, 6, 21, 23, 0, tzinfo=UTC))
    await setup(hass, make_entry())
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, "calibrate", {"entity_id": ENTITY, "observed": "sunny"}, blocking=True
        )
    assert err.value.translation_key == "sun_below_horizon"


async def test_refresh_buildings_service_and_failure(hass, fake_fetcher):
    entry = make_entry()
    await setup(hass, entry)
    fake_fetcher.requests.clear()
    await hass.services.async_call(
        DOMAIN, "refresh_buildings", {"entity_id": ENTITY}, blocking=True
    )
    assert any(r[0].endswith("catalog.json") for r in fake_fetcher.requests)
    fake_fetcher.fail_with = 500
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, "refresh_buildings", {"entity_id": ENTITY}, blocking=True
        )
    assert err.value.translation_key == "refresh_failed"
    # cached data keeps the spot working
    assert hass.states.get(ENTITY).state in ("on", "off")
