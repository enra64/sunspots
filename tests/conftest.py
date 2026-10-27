"""Shared fixtures."""

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Allow loading custom_components/sunspots in every test."""


from datetime import UTC, datetime  # noqa: E402
from unittest.mock import patch  # noqa: E402

from homeassistant.config_entries import ConfigSubentryData  # noqa: E402
from homeassistant.core import HomeAssistant  # noqa: E402
from pytest_homeassistant_custom_component.common import MockConfigEntry  # noqa: E402

from custom_components.sunspots.const import DOMAIN, SUBENTRY_SPOT  # noqa: E402

from .core.fakes import FIXTURE, FakeFetcher, build_archive  # noqa: E402

LAT, LON = 52.5520183, 13.4191958
NOON = datetime(2026, 6, 21, 10, 0, tzinfo=UTC)  # 12:00 CEST on midsummer


@pytest.fixture
def fake_fetcher():
    """An in-memory Overture archive containing the Berlin fixture tile."""
    fetcher = FakeFetcher(build_archive({(8802, 5370): FIXTURE.read_bytes()}))
    with patch(
        "custom_components.sunspots.buildings_service.RateLimitedFetcher", return_value=fetcher
    ):
        yield fetcher


@pytest.fixture(autouse=True)
async def berlin_time_zone(hass: HomeAssistant):
    await hass.config.async_set_time_zone("Europe/Berlin")
    hass.config.latitude, hass.config.longitude = LAT, LON


def spot_data(
    lat: float = LAT, lon: float = LON, title: str = "Schneiderei", **extra
) -> ConfigSubentryData:
    return ConfigSubentryData(
        data={"latitude": lat, "longitude": lon, **extra},
        subentry_type=SUBENTRY_SPOT,
        title=title,
        unique_id=f"{lat:.5f},{lon:.5f}",
    )


def make_entry(
    options: dict | None = None,
    subentries: list[ConfigSubentryData] | None = None,
    minor_version: int = 1,
    version: int = 1,
) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        title="Sunspots",
        data={},
        options=options or {},
        version=version,
        minor_version=minor_version,
        subentries_data=subentries if subentries is not None else [spot_data()],
    )
