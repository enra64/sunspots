# Changelog

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
