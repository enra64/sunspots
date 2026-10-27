"""The dashboard example YAML parses and its Markdown template renders correctly."""

from pathlib import Path

import yaml
from homeassistant.helpers.template import Template

from .conftest import make_entry
from .test_setup import SHADED_NOON, SUNNY_MORNING, setup

DASHBOARD = Path(__file__).parents[1] / "docs" / "dashboards" / "now.yaml"


def load_cards():
    view = yaml.safe_load(DASHBOARD.read_text())
    return {c["type"]: c for c in view["cards"]}


def test_yaml_structure():
    view = yaml.safe_load(DASHBOARD.read_text())
    assert view["path"] == "sunspots-now"
    assert [c["type"] for c in view["cards"]] == ["tile", "markdown", "entities"]
    assert view["cards"][0]["entity"] == "sensor.sunspots_sunny_spots"


async def test_markdown_lists_sunny_and_shaded_spots(hass, fake_fetcher, freezer):
    template = load_cards()["markdown"]["content"]
    freezer.move_to(SUNNY_MORNING)
    await setup(hass, make_entry())
    sunny = Template(template, hass).async_render()
    assert "☀️ **Schneiderei** is in the sun until 10:0" in sunny

    freezer.move_to(SHADED_NOON)
    from pytest_homeassistant_custom_component.common import async_fire_time_changed

    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    shaded = Template(template, hass).async_render()
    assert "🌥️ **Schneiderei** is shaded until 14:0" in shaded


async def test_markdown_without_spots(hass, fake_fetcher):
    await setup(hass, make_entry(subentries=[]))
    assert (
        "No Sunspots spots set up yet."
        in Template(load_cards()["markdown"]["content"], hass).async_render()
    )
