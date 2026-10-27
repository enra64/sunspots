# Weather providers and the forecast

Sunspots asks your weather entity for its forecast with `weather.get_forecasts` (one request per
weather entity, shared by all spots; refreshed every 30 minutes and, debounced by 5 minutes, when
the entity changes; the last good forecast is kept if a refresh fails). It prefers **hourly**,
falls back to **daily**, and works geometry-only (`forecast_available: false`) if neither exists.

Cloud value per forecast entry: `cloud_coverage` (%) if present, else the `condition`
(sunny/clear-night 0, partlycloudy 40, cloudy 90, fog/rain/snow/pouring/lightning/hail 100; windy,
exceptional and anything else = unknown → geometry only).

Each 15-minute slot is classed **sunny** (at least half sunlit and cloud ≤ 40 %), **partly**
(cloud ≤ 75 %), or **unlikely**; limits are in the shared settings. Windows are clipped to the exact
geometric sun times.

## What each provider sends (from Home Assistant core source, 2026-10)

| Weather integration | Hourly | Daily | `cloud_coverage` in forecast entries | Notes |
|---|---|---|---|---|
| Met.no (`met`) | yes | yes | mapped from the library's `cloudiness` when present; **absent in the daily output of the maintainer's instance** | falls back to `condition`; hourly output still to be confirmed on a real instance |
| Open-Meteo | yes | yes | hourly: yes (`cloud_cover`) | daily entries are stamped 00:00 UTC |
| AccuWeather | yes | yes | yes (daily `CloudCoverDay`, hourly `CloudCover`) | |
| OpenWeatherMap | yes (free tier: hourly only) | yes (paid mode) | passed through from the library | |
| DWD, Pirate Weather | not checked (not core integrations) | – | – | should work through `condition` or `cloud_coverage` |

Time semantics assumed: an entry's `datetime` is the **start** of its period; hourly entries cover
until the next entry (at most 6 hours, e.g. Met.no's coarser later steps); a daily entry stamped
exactly 00:00 UTC stands for that UTC date, any other daily stamp for its local date.
These semantics were not confirmed in provider documentation; report mismatches in an issue.

## Limitation

Cloud percentage is a rough proxy for direct sun. Sunshine duration or direct radiation would be
better and is on the backlog.
