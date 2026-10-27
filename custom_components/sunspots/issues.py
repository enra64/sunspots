"""The single low-coverage repair issue."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN, ISSUE_LOW_COVERAGE
from .core.const import LOW_COVERAGE_THRESHOLD
from .data import SunspotsConfigEntry


def async_update_coverage_issue(hass: HomeAssistant, entry: SunspotsConfigEntry) -> None:
    """Create, update or delete the one summary issue for spots with mostly guessed heights."""
    low = sorted(
        c.settings.name
        for c in entry.runtime_data.spots.values()
        if c.data is not None
        and c.data.model.coverage is not None
        and c.data.model.coverage < LOW_COVERAGE_THRESHOLD
    )
    if not low:
        ir.async_delete_issue(hass, DOMAIN, ISSUE_LOW_COVERAGE)
        return
    placeholders = {
        "spots": ", ".join(low),
        "threshold": str(round(LOW_COVERAGE_THRESHOLD * 100)),
    }
    existing = ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_LOW_COVERAGE)
    if existing is not None and existing.translation_placeholders == placeholders:
        return
    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_LOW_COVERAGE,
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key=ISSUE_LOW_COVERAGE,
        translation_placeholders=placeholders,
    )
