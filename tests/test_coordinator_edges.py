"""Coordinator timers and error paths."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.sunspots.const import DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE
from custom_components.sunspots.coordinator import RETRY_DELAY

from .conftest import make_entry
from .test_setup import setup

NOON = datetime(2026, 6, 21, 10, 0, tzinfo=UTC)


async def _spot(hass, fake_fetcher, freezer):
    freezer.move_to(NOON)
    entry = make_entry()
    await setup(hass, entry)
    return entry, next(iter(entry.runtime_data.spots.values()))


async def advance(hass, freezer, delta):
    freezer.move_to(datetime.now(UTC) + delta)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def test_every_fifth_tick_forces_a_recompute(hass, fake_fetcher, freezer):
    _, coordinator = await _spot(hass, fake_fetcher, freezer)
    calls = []
    original = coordinator.async_refresh

    async def counting():
        calls.append(coordinator._dirty)
        await original()

    coordinator.async_refresh = counting
    for _ in range(4):
        await advance(hass, freezer, timedelta(minutes=1))
    assert calls == []  # plain ticks only notify listeners
    await advance(hass, freezer, timedelta(minutes=1))
    assert calls == [True]  # the fifth tick marks the data dirty and recomputes


async def test_invalid_obstacle_is_a_service_validation_error(hass, fake_fetcher, freezer):
    _, coordinator = await _spot(hass, fake_fetcher, freezer)
    for args in ((-1, 10, 20, None), (10, 400, 20, None), (10, 20, 0, None), (10, 20, 95, "x")):
        with pytest.raises(ServiceValidationError) as err:
            await coordinator.async_add_obstacle(*args)
        assert err.value.translation_key == "invalid_obstacle"
    assert coordinator.data.corrections.entries == []


async def test_scheduled_refresh_failure_keeps_cached_data(hass, fake_fetcher, freezer):
    _, coordinator = await _spot(hass, fake_fetcher, freezer)
    before = coordinator.data.meta.fetched_at
    fake_fetcher.fail_with = 503
    with patch("custom_components.sunspots.coordinator._LOGGER") as logger:
        await advance(hass, freezer, timedelta(days=91))
    assert fake_fetcher.requests  # the refresh really tried
    assert any(
        "Scheduled building refresh failed" in c.args[0] for c in logger.debug.call_args_list
    )
    assert coordinator.data is not None and coordinator.data.meta.fetched_at == before


async def test_failed_first_load_is_retried_and_recovers(hass, fake_fetcher, freezer):
    freezer.move_to(NOON)
    fake_fetcher.fail_with = 503
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert coordinator.data is None
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "unavailable"

    fake_fetcher.fail_with = None
    await advance(hass, freezer, RETRY_DELAY + timedelta(seconds=1))
    assert coordinator.data is not None
    assert hass.states.get("binary_sensor.schneiderei_sunny").state in ("on", "off")


async def test_recovered_spot_clears_buildings_unavailable_issue(hass, fake_fetcher, freezer):
    freezer.move_to(NOON)
    fake_fetcher.fail_with = 503
    await setup(hass, make_entry())
    assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE) is not None
    fake_fetcher.fail_with = None
    await advance(hass, freezer, RETRY_DELAY + timedelta(seconds=1))
    assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE) is None


async def test_retry_that_still_fails_stays_unavailable(hass, fake_fetcher, freezer):
    freezer.move_to(NOON)
    fake_fetcher.fail_with = 503
    entry = make_entry()
    await setup(hass, entry)
    coordinator = next(iter(entry.runtime_data.spots.values()))
    await advance(hass, freezer, RETRY_DELAY + timedelta(seconds=1))
    assert coordinator.data is None
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "unavailable"
