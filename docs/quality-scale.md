# Home Assistant quality scale: self-review

Rules taken from Home Assistant core's `script/hassfest/quality_scale.py` (core `dev`, 2026-10-27). This is a
custom integration, so nothing here is enforced or certified; it is the checklist the code was reviewed against.

| Tier | Rule | Status |
|---|---|---|
| Bronze | action-setup | ✅ registered in `async_setup` |
| | appropriate-polling | ✅ `iot_class: calculated`, no polling; point-in-time scheduling and a 1-minute local tick |
| | brands | ✅ local `brand/` folder |
| | common-modules | ✅ `coordinator.py`, `entity.py`, `data.py` |
| | config-flow, config-flow-test-coverage | ✅ UI flows; `config_flow.py` coverage reported in the Phase 4 report |
| | dependency-transparency, docs-* (actions, high-level, installation, removal) | ✅ README; `pmtiles` and `numpy` only; docs-conditions/triggers: none exist |
| | entity-event-setup, entity-unique-id, has-entity-name | ✅ |
| | runtime-data | ✅ typed `ConfigEntry[SunspotsRuntime]` |
| | test-before-configure | ✅ the add-spot flow downloads and checks data before creating the spot |
| | test-before-setup | ⚠ by design the hub never fails because one spot cannot load (it retries every 15 minutes and raises a repair issue) |
| | unique-config-entry | ✅ `single_config_entry`; spots dedupe by location |
| Silver | action-exceptions | ✅ `ServiceValidationError` with translation keys |
| | config-entry-unloading | ✅ |
| | docs-configuration-parameters, docs-installation-parameters | ✅ README |
| | entity-unavailable, log-when-unavailable | ✅ unavailable until loaded; logged once, and again on recovery |
| | integration-owner | ✅ `codeowners` |
| | parallel-updates | ✅ declared in every platform |
| | reauthentication-flow | exempt: no credentials |
| | test-coverage | ✅ > 95 % overall (see Phase 4 report) |
| Gold | devices, diagnostics, stale-devices, dynamic-devices | ✅ one device per spot subentry; removal tested |
| | entity-category, entity-device-class, entity-disabled-by-default | ✅ |
| | entity-translations, exception-translations, icon-translations | ✅ en + de, `icons.json` |
| | reconfiguration-flow | ✅ hub reconfigure + options; spot reconfigure menu |
| | repair-issues | ✅ |
| | discovery, discovery-update-info | exempt: nothing to discover |
| | docs-data-update, known-limitations, supported-functions, troubleshooting, use-cases, examples, supported-devices | ✅ README, `docs/accuracy.md`, `docs/examples.md`, `docs/weather-providers.md` |
| Platinum | async-dependency | ⚠ `pmtiles` is synchronous, but only its pure parsing helpers are used (no I/O); decoding runs in the executor |
| | inject-websession | ✅ Home Assistant's shared aiohttp session |
| | strict-typing | ✅ `mypy --strict` clean for the whole integration (not registered in core's `.strict-typing`, which is for core integrations) |
