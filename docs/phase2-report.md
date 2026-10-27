# Phase 2 report — forecast and dashboards (v0.2.0)

Date: 2026-10-27. Human sign-off still pending (see below); phase continued without a stop at the user's request.

## Done
- `core/forecast.py`: forecast parsing, per-slot classes (spec table), window building clipped to the geometric intervals, state precedence, best window, hourly rows.
- `forecast_manager.py`: one fetch loop per weather entity (hourly → daily → none), 30-min refresh, 5-min debounced state-change refresh, last good forecast kept on failure.
- `sensor.<spot>_sun_forecast` (enum, large attributes unrecorded), extended `get_sun_forecast`, hub `next_window`, hub option for the "partly sunny" limit, en + de strings.
- Docs: provider compatibility table, "Today" dashboard, morning notification example.
- Provider-shaped fixtures: Met.no hourly (condition only), Open-Meteo hourly (numeric cloud), Met.no daily (the user's real output shape), a provider with no cloud field.

## Verified (agent)
- 160+ tests pass, ruff and strict mypy on core clean (full-suite results in the Phase 3 report run).
- Failure behaviour (keeps last good forecast), debounce, one fetch shared by two spots, daily-only and no-cloud providers, unknown service error, precedence and best-window tables, templates rendered against real entities.

## Not verified
- No real weather integration was queried; hourly Met.no output (`cloudiness` → `cloud_coverage`) has not been seen. Time semantics of forecast entries are assumed (D20).
- YAML dashboards parse and templates render in tests; cards not opened in a UI.

## Deviations
- D19: no ≤10-minute flicker bridging (cannot occur with 15-minute slots; shade is never bridged). **Needs your decision if you want it differently.**
- D21: slots under 50 % sunlit add no window.

## Human sign-off
Confirm forecast fields with your Met.no entity (paste `weather.get_forecasts` with `type: hourly` for `weather.home`).
