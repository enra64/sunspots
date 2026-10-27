import json
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from homeassistant.helpers import issue_registry as ir
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.sunspots.const import DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE, ISSUE_LOW_COVERAGE
from custom_components.sunspots.diagnostics import async_get_config_entry_diagnostics
from custom_components.sunspots.issues import async_update_coverage_issue
from tests.core.helpers import unproject

from .conftest import LAT, LON, make_entry, spot_data
from .test_setup import setup

EARLY = datetime(2026, 6, 21, 7, 0, tzinfo=UTC)  # 09:00 CEST: long sunny stretch
AWARE = "binary_sensor.schneiderei_sunny_weather_aware"


async def advance(hass, freezer, minutes):
    freezer.move_to(datetime.now(UTC) + timedelta(minutes=minutes))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


async def test_weather_aware_sensor_with_met_style_condition_only(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    hass.states.async_set("weather.home", "sunny", {"attribution": "Weather forecast from met.no"})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "on"
    assert hass.states.get(AWARE).state == "on"
    assert hass.states.get(AWARE).attributes["cloud_coverage"] == 0.0

    freezer.move_to(EARLY + timedelta(minutes=1))
    hass.states.async_set("weather.home", "cloudy")
    await hass.async_block_till_done()
    assert hass.states.get(AWARE).state == "on"  # minimum dwell of five minutes
    assert hass.states.get("sensor.sunspots_sunny_spots").state == "1"

    await advance(hass, freezer, 6)
    hass.states.async_set("weather.home", "cloudy", {"x": 1})
    await hass.async_block_till_done()
    assert hass.states.get(AWARE).state == "off"
    assert hass.states.get("binary_sensor.schneiderei_sunny").state == "on"  # geometry unchanged
    assert hass.states.get("sensor.sunspots_sunny_spots").state == "0"

    await advance(hass, freezer, 6)
    hass.states.async_set("weather.home", "partlycloudy")
    await hass.async_block_till_done()
    assert hass.states.get(AWARE).state == "on"  # 40 % is within the default limit of 40 %


async def test_explicit_cloud_coverage_attribute_wins(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    hass.states.async_set("weather.home", "sunny", {"cloud_coverage": 80})
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    assert hass.states.get(AWARE).state == "off"
    assert hass.states.get(AWARE).attributes["cloud_coverage"] == 80.0


async def test_unknown_weather_falls_back_to_geometry(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    hass.states.async_set("weather.home", "unavailable")
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}))
    state = hass.states.get(AWARE)
    assert state.state == "on" and state.attributes["cloud_known"] is False


async def test_no_weather_entity_means_no_weather_aware_sensor(hass, fake_fetcher):
    await setup(hass, make_entry())
    assert hass.states.get(AWARE) is None


async def test_spot_weather_entity_overrides_hub_default(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    hass.states.async_set("weather.home", "cloudy")
    hass.states.async_set("weather.other", "sunny")
    sub = spot_data(weather_entity="weather.other")
    await setup(hass, make_entry(options={"weather_entity": "weather.home"}, subentries=[sub]))
    assert hass.states.get(AWARE).state == "on"


async def test_diagnostics_have_no_coordinates_or_geometry(hass, fake_fetcher):
    entry = make_entry(options={"weather_entity": "weather.home"})
    await setup(hass, entry)
    diag = await async_get_config_entry_diagnostics(hass, entry)
    dump = json.dumps(diag)
    for needle in (str(LAT)[:6], str(LON)[:6], "Schneiderei", "polygon", "geometry", 'buildings":'):
        assert needle not in dump
    spot = diag["spots"][0]
    assert spot["building_count"] > 20 and spot["release"] == "2026-10-21.0"
    assert spot["coverage_metric"] is not None and spot["loaded"] is True
    assert spot["timings"]["timeline_s"] >= 0


async def test_single_low_coverage_issue_for_all_spots(hass, fake_fetcher):
    spots = [spot_data(), spot_data(lat=LAT + 0.0003, title="Second")]
    entry = make_entry(subentries=spots)
    with patch("custom_components.sunspots.issues.LOW_COVERAGE_THRESHOLD", 1.1):
        await setup(hass, entry)
    registry = ir.async_get(hass)
    issues = [
        i
        for i in registry.issues.values()
        if i.domain == DOMAIN and i.issue_id == ISSUE_LOW_COVERAGE
    ]
    assert len(issues) == 1 and not issues[0].is_fixable
    assert issues[0].translation_placeholders["spots"] == "Schneiderei, Second"
    async_update_coverage_issue(hass, entry)  # threshold back to 0.30: spots are fine
    assert registry.async_get_issue(DOMAIN, ISSUE_LOW_COVERAGE) is None


def overpass_payload(entry_lat=LAT, entry_lon=LON):
    corners = [(30, 10), (50, 10), (50, 30), (30, 30)]
    geometry = [
        {
            "lat": unproject(entry_lat, entry_lon, x, y)[0],
            "lon": unproject(entry_lat, entry_lon, x, y)[1],
        }
        for x, y in corners
    ]
    return {
        "elements": [
            {
                "type": "way",
                "id": 7,
                "tags": {"building": "house", "height": "30"},
                "geometry": geometry,
            }
        ]
    }


async def test_overture_failure_without_permission_never_calls_overpass(hass, fake_fetcher):
    fake_fetcher.fail_with = 503
    await setup(hass, make_entry())
    assert fake_fetcher.posted == []
    issue = ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_BUILDINGS_UNAVAILABLE)
    assert issue is not None


async def test_overpass_fallback_when_permitted(hass, fake_fetcher, freezer):
    freezer.move_to(EARLY)
    fake_fetcher.fail_with = 503
    fake_fetcher.post_response = json.dumps(overpass_payload()).encode()
    # POST goes through post(), which the fake does not fail
    await setup(hass, make_entry(options={"allow_overpass": True}))
    state = hass.states.get("binary_sensor.schneiderei_sunny")
    assert len(fake_fetcher.posted) == 1 and fake_fetcher.posted[0][0].endswith("interpreter")
    assert state.attributes["attribution"] == "© OpenStreetMap contributors"
    assert state.state in ("on", "off")


async def test_overpass_as_configured_source(hass, fake_fetcher):
    fake_fetcher.post_response = json.dumps(overpass_payload()).encode()
    entry = make_entry(options={"data_source": "overpass", "allow_overpass": True})
    await setup(hass, entry)
    assert not [r for r in fake_fetcher.requests if "pmtiles" in r[0] or "catalog" in r[0]]
    coordinator = next(iter(entry.runtime_data.spots.values()))
    assert coordinator.data.meta.provider == "overpass" and coordinator.data.building_count == 1
