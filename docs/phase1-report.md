# Phase 1 report — core sun/shade (v0.1.0)

Date: 2026-10-27. Status: **agent-checkable items done except two that could not be run (below); human sign-off pending. Nothing is committed, pushed or tagged yet.**

## Done

- `core/` (no `homeassistant` imports, enforced by a test): geometry, horizon (edge sweep, courtyards, chunked numpy), solar (astral 2.2, apparent elevation), timeline (1-minute steps, ±10 s bisection, 15-min sunlit fractions), heights + coverage metric, corrections (overrides, obstacles, bounded clearances, calibration), MVT decoder, buildings derivation (clipped pieces, parts, spot-in-courtyard), providers (Overture PMTiles, opt-in Overpass, rate-limited HTTP client), cloud values and the weather gate.
- Integration: hub entry + options flow; spot subentries (add with progress step, summary and low-coverage confirmation, duplicate check; reconfigure menu with settings, corrections, refresh); per-spot stores with versions and migrations, shared tile cache, update-listener lifecycle (removed spot → store removed; hub removal wipes storage); coordinators with point-in-time scheduling, 1-minute tick, staggered background load beyond 5 spots.
- Entities and actions as in the spec (`sunny`, `sunny_weather_aware`, `next_change`, `sun_remaining`, `sun_hours_today`, `data_quality`, hub `sunny_now`; `get_sun_forecast`, `refresh_buildings`, `set_building_height`, `calibrate`), diagnostics, repair issues (one low-coverage summary, one provider-failure), en + de translations, brand images, `hacs.json`, README, privacy and accuracy docs, "Now" dashboard, CI workflows, issue templates, changelog.
- Tools: `tools/bench.py`, `tools/score_observations.py` (both tested), `tools/probe_pmtiles.py` (Phase 0), `tools/make_brand.py`.

## How it was verified (agent-checkable)

| Check | Result |
|---|---|
| `pytest` (122 tests: horizon exact values incl. 43.2° wall and 66° courtyard, timeline incl. DST/polar, MVT on a real tile, providers via an in-memory PMTiles archive, HTTP client against a local server, flows, lifecycle, migration, offline start, weather, diagnostics redaction, issues, services, dashboards, translations parity, tools) | 122 passed, repeated 5× without flakes after one flaky helper was fixed |
| `ruff check` / `ruff format --check` | clean |
| `mypy --strict` on `core/` | clean |
| Dead-code scan (vulture) | unused items removed; remaining hits are Home Assistant entry points |
| `tools/bench.py` (**sandbox**: Apple arm64, 12 cpus, Python 3.14.9) | 20 000 edges: horizon 0.017–0.022 s, extra peak 11 MB; 2-day timeline 0.025 s. **Not a Raspberry Pi number.** |
| Second spot at a covered location | test proves zero HTTP requests; 8 spots at start share one tile download |
| Real-tile sanity (Berlin tile 8802/5370, Cafe Schneiderei coordinates) | model runs end to end; see note below |

Items from the Phase 0 `[U]` list now verified in Home Assistant 2026.10.4's test harness: progress steps inside subentry flows, `config_subentry_id` entity creation and cleanup, entity services with responses (`async_register_platform_entity_service`), `async_update_and_abort` with an update listener. Still unverified: SVG in an `image` entity and `hass.callService` returnResponse (both Phase 3), Met.no hourly forecast fields (Phase 2).

## Not verified / could not be done

1. **hassfest and HACS validation have not been run.** The workflows are in `.github/workflows/ci.yml` but never executed. I tried to run hassfest locally from a clone of Home Assistant core; the environment's permission check denied running that external code, so I stopped. Run it yourself (`docker run` hassfest or push and watch CI), or tell me to allow it.
2. **No pre-release tag**, no commit, no push: you have not asked me to publish anything.
3. Everything on a real Home Assistant (Docker container), a real browser UI, the dashboard cards in the UI.
4. Real-world accuracy: no observations or ShadeMap comparison exist.

## Notes you should know

- With the coordinates you gave (café pin), the horizon reaches ~85° toward the south-east: a tall building footprint is within a few metres of the pin. That is the pin sitting next to (or on the edge of) the building, not necessarily the terrace. Place the spot on the actual table; if the pin is *inside* a footprint, that building is ignored by design.
- Coverage metric for that spot is 1.0 (all limiting buildings have heights/floors) in the fixture tile; Quedlinburg in Phase 0 was 0.0.
- Weather: your Met.no entity has no `cloud_coverage`; the condition table is used (`partlycloudy` = 40 % equals the default limit, so it counts as sunny).

## Deviations from the spec (all in `decisions.md`)

D11 tile cache keyed by tile (release inside), D12 `probatio`, D13 weather-gate hysteresis shape, D14 cache-lost self-heal fetch, D15 1-minute tick, D17 no `repairs.py`, D18 brand folder location. Also: Overpass ignores `building:part` (documented limitation); the optional `python -m sunspots.core.demo` CLI was **not** built (optional).

## Known issues / risks

- `sun_remaining` writes a state per minute while sunny (recorder size); can be excluded by users.
- Overpass multipolygon assembly joins open ways only by exact endpoint match.
- The tick runs even when no entity is enabled (cheap).
- Timeline resolution is 1 minute: features narrower than that are missed (the spec accepts it).

## Human sign-off (blocking for un-flagging the release)

1. Run hassfest + HACS validation (CI or locally).
2. Install in your HA container, add your café spot on the table, confirm the flows (add, reconfigure, corrections, delete) and the entities.
3. Run `tools/bench.py` on the server; send the numbers. (Pi test waived by you; D9.)
4. Compare ≥ 3 spots with observations/ShadeMap (`tools/score_observations.py`), fill `docs/accuracy.md`, and tune class defaults.
5. Tell me when to commit, tag `v0.1.0` as a GitHub pre-release and push (needs your go-ahead).
