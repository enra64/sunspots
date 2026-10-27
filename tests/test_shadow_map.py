import xml.etree.ElementTree as ET
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

import pytest
from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
from homeassistant.components.image import async_get_image
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.sunspots.const import DOMAIN

from .conftest import make_entry
from .test_setup import SHADED_NOON, SUNNY_MORNING, setup

IMAGE = "image.schneiderei_shadow_map"
ENTITY = "binary_sensor.schneiderei_sunny"
NIGHT = datetime(2026, 6, 21, 23, 30, tzinfo=UTC)  # 01:30 local
CARD = (
    Path(__file__).parents[1] / "custom_components" / "sunspots" / "frontend" / "sunspots-card.js"
)


async def test_image_entity_serves_svg_and_caches(hass, fake_fetcher, freezer):
    freezer.move_to(SUNNY_MORNING)
    await setup(hass, make_entry())
    state = hass.states.get(IMAGE)
    assert state is not None and state.attributes["attribution"].startswith("© OpenStreetMap")
    image = await async_get_image(hass, IMAGE)
    assert image.content_type == "image/svg+xml"
    root = ET.fromstring(image.content)
    assert root.tag.endswith("svg")
    assert b"2026-06-21 10:00" in image.content and b"stroke-dasharray" in image.content  # sun up

    with patch(
        "custom_components.sunspots.coordinator.SpotCoordinator.async_render_map",
        side_effect=AssertionError("must come from cache"),
    ):
        assert (await async_get_image(hass, IMAGE)).content == image.content
        freezer.move_to(SUNNY_MORNING + timedelta(minutes=4))
        assert (await async_get_image(hass, IMAGE)).content == image.content
    freezer.move_to(SUNNY_MORNING + timedelta(minutes=6))
    refreshed = await async_get_image(hass, IMAGE)
    assert refreshed.content != image.content and b"10:06" in refreshed.content


async def test_image_at_night_is_buildings_only_and_kept_until_sunrise(hass, fake_fetcher, freezer):
    freezer.move_to(NIGHT)
    await setup(hass, make_entry())
    night = await async_get_image(hass, IMAGE)
    assert b"sun below horizon" in night.content and b"stroke-dasharray" not in night.content
    freezer.move_to(NIGHT + timedelta(hours=1))
    with patch(
        "custom_components.sunspots.coordinator.SpotCoordinator.async_render_map",
        side_effect=AssertionError("night image is kept"),
    ):
        assert (await async_get_image(hass, IMAGE)).content == night.content
    freezer.move_to(datetime(2026, 6, 22, 3, 30, tzinfo=UTC))  # sun is up again
    assert b"stroke-dasharray" in (await async_get_image(hass, IMAGE)).content


async def test_image_is_invalidated_by_corrections(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    entry = make_entry()
    await setup(hass, entry)
    before = (await async_get_image(hass, IMAGE)).content
    coordinator = next(iter(entry.runtime_data.spots.values()))
    await coordinator.async_add_obstacle(100, 140, 30, "tree")
    assert (await async_get_image(hass, IMAGE)).content == before  # obstacles are not drawn...
    await coordinator.async_calibrate("shaded", None)  # ...but the cache key moved on
    # a re-render happened (no error) and the picture is still valid SVG
    ET.fromstring((await async_get_image(hass, IMAGE)).content)


async def test_render_service_with_local_time_and_response_shape(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    await setup(hass, make_entry())
    resp = await hass.services.async_call(
        DOMAIN,
        "render_shadow_map",
        {"entity_id": ENTITY, "time": "2026-06-21T15:00:00"},
        blocking=True,
        return_response=True,
    )
    data = resp[ENTITY]
    assert set(data) == {"svg", "time", "sun_azimuth", "sun_elevation", "sun_below_horizon"}
    assert data["time"] == "2026-06-21T15:00:00+02:00"  # naive input read as local time
    assert data["sun_below_horizon"] is False and 220 < data["sun_azimuth"] < 260
    ET.fromstring(data["svg"])
    night = await hass.services.async_call(
        DOMAIN,
        "render_shadow_map",
        {"entity_id": ENTITY, "time": "2026-06-21T01:00:00+02:00"},
        blocking=True,
        return_response=True,
    )
    assert (
        night[ENTITY]["sun_below_horizon"] is True and "sun below horizon" in night[ENTITY]["svg"]
    )
    default = await hass.services.async_call(
        DOMAIN, "render_shadow_map", {"entity_id": ENTITY}, blocking=True, return_response=True
    )
    assert default[ENTITY]["time"].startswith("2026-06-21T12:00")


async def test_payload_budget_zooms_in_then_fails(hass, fake_fetcher, freezer):
    freezer.move_to(SHADED_NOON)
    await setup(hass, make_entry())
    call = lambda: hass.services.async_call(  # noqa: E731
        DOMAIN, "render_shadow_map", {"entity_id": ENTITY}, blocking=True, return_response=True
    )
    full = (await call())[ENTITY]["svg"]
    size = len(full.encode())
    with patch("custom_components.sunspots.coordinator.MAP_PAYLOAD_BUDGET", int(size * 0.8)):
        smaller = (await call())[ENTITY]["svg"]
    assert len(smaller.encode()) <= int(size * 0.8) and len(smaller) < len(full)
    with (
        patch("custom_components.sunspots.coordinator.MAP_PAYLOAD_BUDGET", 1000),
        pytest.raises(ServiceValidationError) as err,
    ):
        await call()
    assert err.value.translation_key == "map_too_large"


async def test_card_is_registered_and_served(hass, hass_client, fake_fetcher):
    await setup(hass, make_entry())
    urls = hass.data[DATA_EXTRA_MODULE_URL].urls
    assert any(u.startswith("/sunspots_static/sunspots-card.js?v=") for u in urls)
    client = await hass_client()
    resp = await client.get("/sunspots_static/sunspots-card.js")
    assert resp.status == 200
    assert (await resp.read()) == CARD.read_bytes()


async def test_shadow_map_service_also_updates_after_midnight_boundary(hass, fake_fetcher, freezer):
    """A render after the day rolls over still works (no stale-day state)."""
    freezer.move_to(SHADED_NOON)
    await setup(hass, make_entry())
    freezer.move_to(datetime(2026, 6, 22, 10, 0, tzinfo=UTC))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    resp = await hass.services.async_call(
        DOMAIN, "render_shadow_map", {"entity_id": ENTITY}, blocking=True, return_response=True
    )
    assert resp[ENTITY]["time"].startswith("2026-06-22T12:00")
