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


TODAY = Path(__file__).parents[1] / "docs" / "dashboards" / "today.yaml"
NOTIFY = Path(__file__).parents[1] / "docs" / "dashboards" / "morning-notification.yaml"


async def test_today_view_templates_render(hass, fake_fetcher, freezer):
    from datetime import UTC, datetime

    freezer.move_to(datetime(2026, 6, 21, 7, 0, tzinfo=UTC))
    await setup(hass, make_entry())
    view = yaml.safe_load(TODAY.read_text())
    assert [c["type"] for c in view["cards"]] == ["markdown", "markdown", "tile"]
    best = Template(view["cards"][0]["content"], hass).async_render()
    assert "**Schneiderei**: sunny" in best and "–" in best
    hourly = Template(view["cards"][1]["content"], hass).async_render()
    assert "**Schneiderei**" in hourly and "| 09:00 |" in hourly and "☀️" in hourly


async def test_morning_notification_message_renders(hass, fake_fetcher, freezer):
    from datetime import UTC, datetime

    freezer.move_to(datetime(2026, 6, 21, 6, 30, tzinfo=UTC))
    await setup(hass, make_entry())
    automation = yaml.safe_load(NOTIFY.read_text())
    assert automation["triggers"][0]["at"] == "08:30:00" and "conditions" not in automation
    message = Template(automation["actions"][0]["data"]["message"], hass).async_render()
    assert message.startswith("Next sun: Schneiderei from ")


EXAMPLES = Path(__file__).parents[1] / "docs" / "examples.md"


def test_example_automations_are_valid_yaml():
    import re

    blocks = re.findall(r"```yaml\n(.*?)```", EXAMPLES.read_text(), re.S)
    assert len(blocks) == 3
    for block in blocks:
        parsed = yaml.safe_load(block)
        assert parsed["alias"] and ("actions" in parsed or "sequence" in parsed)
