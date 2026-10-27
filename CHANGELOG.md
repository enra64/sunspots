# Changelog

## 1.1.0 (pre-release)

- `sensor.<spot>_sun_tomorrow` and `intervals_tomorrow`: when there will be sun tomorrow (cloud-aware windows as far as the forecast reaches).
- Card: redesigned `timeline` mode (today and tomorrow, hour grid, times on the sunny segments, text summary, automatic hour range) and a new `custom:sunspots-shadow-card` (current shadow map, auto-refresh, dark mode).
- `sunspots.render_shadow_map` has a `theme` (`light`/`dark`).
- Manifest category and CI action versions updated; the repository now has a description and topics (HACS checks).

## 1.0.0 (publish as a GitHub *pre-release* until the human sign-off items in `docs/phase*-report.md` are done)

- Hardening: scale test with 50 spots, hub reconfigure flow, icon translations, recovery log line,
  `mypy --strict` clean for the whole integration, test coverage above 95 %.
- Docs: quality-scale self-review, HACS default-repository checklist, migration notes, validation protocol,
  automation examples, troubleshooting and limitations in the README.
- No functional change to sun/shade results compared with 0.3.0; no migration needed.

## 0.3.0 (pre-release)

- Shadow view: `image.<spot>_shadow_map` (SVG, cached 5 min, buildings-only at night) and the
  `sunspots.render_shadow_map` action (optional `time`, returns the SVG).
- `custom:sunspots-card` with modes `overview`, `timeline` and `map` (time slider), bundled with the
  integration and registered automatically (needs `http` and `frontend`).
- Pure renderer in `core/render.py`: shadows on the observer plane, courtyards, height-source colours
  with hatching for guessed heights, escaped text, no scripting content.
- CI: frontend typecheck/test/build and a drift check for the committed bundle.

## 0.2.0 (pre-release)

- `sensor.<spot>_sun_forecast` (enum: sunny now / partly sunny / sunny later / partly sunny later / no sun today)
  with `windows`, `best_window`, `hourly`, `forecast_available`, `forecast_resolution`, `source_entity`.
- Weather forecast read once per weather entity for the whole hub (hourly, else daily, else geometry only;
  refresh every 30 min and on change with 5 min debounce; last good forecast kept on failure).
- `sunspots.get_sun_forecast` now also returns windows, hourly rows and forecast metadata.
- Hub `sunny spots` sensor gains a `next_window` attribute across all spots.
- New shared setting: cloud limit for "partly sunny" (default 75 %).
- Docs: provider compatibility table, "Today" dashboard, optional morning notification automation.

## 0.1.0 (pre-release)

First version: is this outdoor spot in direct sun, and when does that change?

- Hub entry with shared settings; each spot is a config subentry (add, reconfigure, delete).
- Building footprints and heights from Overture Maps (public PMTiles, zoom 14) with an
  opt-in Overpass (OpenStreetMap) alternative/fallback.
- Horizon-profile shading model (720 bins) with courtyard handling, parts, height resolution
  (override → height → floors → class → default) and a coverage metric.
- Entities per spot: `sunny`, `sunny (weather-aware)` (current cloud only), `next change`,
  `sun remaining`, `sun hours today`, `data quality` (disabled by default). Hub: `sunny spots`.
- Actions: `get_sun_forecast` (geometry), `refresh_buildings`, `set_building_height`, `calibrate`.
- Corrections (building heights, obstacles, calibrations) managed from the spot's Reconfigure menu.
- Diagnostics (no coordinates, no geometry), one repair issue for low coverage, one for unavailable data.
- English and German translations; "Now" dashboard example; tools `bench.py` and `score_observations.py`.
