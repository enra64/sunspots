# Phase 0 report — verification gate

Date: 2026-10-27. Measurements are from the agent's sandbox (a Mac laptop, residential network), **not** a Raspberry Pi. Raw results: `phase0-probe-results.json`. Labels: **[M]** measured by me, **[V]** verified in primary source (HA core `dev` branch source / official docs fetched today), **[I]** inferred, **[U]** not verified.

## 1. Overture PMTiles probe (`tools/probe_pmtiles.py`)

- STAC `latest` = `2026-10-21.0` **[M]**; tile URL pattern `…/tiles/<release>/buildings.pmtiles` returns 200 **[M]**. S3 response carries a 60-day retention lifecycle rule (`release data 60 day retention`) **[M]**, which confirms that releases expire.
- Header: `min_zoom 0`, `max_zoom 14`, tile and internal compression **GZIP**, type MVT, 16 068 537 tile entries, root dir 14 KB **[M]**.
- Ring orientation: exterior rings have positive signed area in y-down tile space in 100 % of 6 locations (MVT spec holds) **[M]**.
- `height`, `num_floors`, `class`, `subtype`, `has_parts`, `is_underground`, `id` all occur as feature keys **[M]**. `min_height` occurs at 0 % of building features but 6–166 parts per location have `min_height > 0` **[M]**.

| Location | Tiles | Requests | KB transferred | Decode s | Edges ≤250 m | height % | floors % | Height source (height/floors/class/default %) | Coverage metric |
|---|---|---|---|---|---|---|---|---|---|
| Berlin, Cafe Schneiderei | 1 | 3 | 161 | 0.05 | 1833 | 19.5 | 68.0 | 19/57/15/8 | 1.00 |
| Berlin Mitte | 2 | 2 | 257 | 0.10 | 798 | 15.9 | 62.9 | 20/56/6/18 | 0.92 |
| Munich Marienplatz | 2 | 3 | 524 | 0.15 | 2612 | 7.6 | 49.8 | 12/45/12/31 | 1.00 |
| Paris Marais (*) | 2 | 3 | 841 | 0.27 | 2321 | 2.9 | 65.4 | 11/59/13/17 | 0.95 |
| Portland OR | 1 | 2 | 173 | 0.04 | 870 | 81.7 | 83.0 | 70/25/2/3 | 1.00 |
| Quedlinburg (small town) | 2 | 3 | 505 | 0.13 | 4225 | 14.5 | 4.1 | 15/3/18/64 | **0.00** |

(*) the chosen Paris coordinate lies inside a building footprint and was handled by the containment rule.
Median coverage metric 0.973. Totals: 18 requests, 2.5 MB over 6 locations; median request latency 0.6 s (Berlin run) **[M]**. Peak RSS of a Paris probe run including decode and a pure-Python horizon: 78 MB **[M, macOS]**. Pure-Python horizon with up to 4 225 edges: ≤ 0.01 s **[M]** (the 20 000-edge bench on a Pi is **not** done; `tools/bench.py` is Phase 1).

Caveats: the probe's decoder and horizon are throwaway and simplified (no real clipping-piece merge, no sun-disc, 1 m rule only). Coverage counts floors as "real". The metric is also optimistic where a building is both tall and unmapped but not the limiting one. Locations in the table were not hand-checked against reality.

**Gate evaluation.** Tile attributes exist (pass). Median coverage 0.973 ≥ 0.30 (pass). **But the small town scored 0.00**: 64 % of buildings are guessed and every limiting building was a guess. The spec's escalation rule is median-based, so it does not trigger, yet this shows the "crux" risk is real outside big cities: expect the repair issue to fire and corrections/hatching to matter there.

## 2. HA platform checks (HA core `dev` source fetched today)

- **[V]** `async_register_platform_entity_service(hass, service_domain, service_name, *, admin_only, description_placeholders, entity_device_classes, entity_domain, func, required_features, schema, supports_response)` — `entity_domain` and `schema` are required keywords. Spec §6.4 holds.
- **[V]** `frontend.add_extra_js_url(hass, url, es5=False)` and `hass.http.async_register_static_paths(...)` exist.
- **[V]** `ConfigSubentryFlow` exists with `async_create_entry`, `async_update_and_abort`; `async_add_subentry`, `async_remove_subentry`, `async_update_subentry`, `get_subentries_of_type` exist on ConfigEntries/ConfigEntry; entity platforms accept `config_subentry_id`. `async_show_progress` is defined on the `FlowHandler` base, so it is available to subentry flows **[I — not runtime-tested; schedule a throwaway test in Phase 1 week 1 before building the flow]**.
- **[V]** `image` entity has `content_type`, validated by `valid_image_content_type`; whether `image/svg+xml` is accepted (it may be served with a security header) **[U]** — needs a runtime test.
- **[V]** `weather.get_forecasts` takes `type` daily/hourly/twice_daily and raises `ServiceValidationError` when unsupported. Forecast fields include `cloud_coverage`, `condition`, `datetime`.
- **[V]** per provider (core): Open-Meteo hourly sets `cloud_coverage`; AccuWeather sets `cloud_coverage` for daily and hourly; Met.no and OpenWeatherMap expose current `cloud_coverage` as an entity property, but I did **not** confirm cloud in their forecast entries **[U]**. DWD and Pirate Weather are not core weather integrations in this tree (Pirate Weather is HACS) **[U]**. Time semantics (start vs end of hour, time zone) not verified **[U]** — Open-Meteo uses UTC-aware ISO datetimes.
- **[M, side note]** `weather/services.py` imports `probatio`, not `voluptuous`. Custom integrations may need to follow whatever schema library HA now exposes; check in Phase 1 before writing schemas **[U]**.
- **[V]** `pmtiles.tile.deserialize_directory` always gunzips, so it fails if a file used uncompressed internal directories (Overture uses GZIP; check header and fail clearly).
- **[V, docs]** HACS integration repos: need `brand/icon.png` (and the manifest keys domain, documentation, issue_tracker, codeowners, name, version). The page does not list `hacs.json` keys or default-repo rules **[U]**. HACS docs do not mention a "brand" path inside `custom_components/<domain>/` — the spec's location needs checking against current HACS/HA rules **[U]**.
- **[U]** `hass.callService(..., returnResponse)` signature, current quality-scale rule list: not checked.
- **[U]** Which weather integration the user runs: no Home Assistant MCP is connected here.

## 3. Duplicate search **[web search, today]**
No building-shade-per-spot integration using global building data found. Related: LawPaul/HA_Solar_Shade (USGS LiDAR zones, US only), andrejs2 CLSS Shade (Slovenia LiDAR), NoUsername10/Sunlight_Visualizer (your own house card), clmun/Shadow (SVG of house), Adaptive Cover (blinds). Sunspots' niche (any place, public footprint data, café/bench sunny-now) is distinct. Not exhaustive.

## 4. HTTP approach
Decision D6 (see `decisions.md`): async aiohttp + `pmtiles.tile` primitives; executor only for MVT decode. Evidence: 2–3 requests, 160–840 KB per spot, decode ≤ 0.27 s on laptop (likely 5–10× slower on a Pi **[I]**), RSS 78 MB.

## 5. Human tasks
1. Run `tools/probe_pmtiles.py` on the Pi (or in the HA container) and send the output; also from your real network.
2. Tell me which weather integration you use (needed to verify forecast fields) — or paste `weather.get_forecasts` output for hourly.
3. Confirm Apache-2.0 + NOTICE is what you meant by the licence answer.
4. Pi install test plan (Phase 1 H): install via HACS custom repository, add 3 spots, run `tools/bench.py`, record RAM/time.
5. Collect sun/shade observations at Cafe Schneiderei (CSV `spot,datetime,observed`).

## 6. Deviations
None from the spec. Not done: Met.no/OWM forecast-field confirmation, runtime test of subentry progress steps and SVG images, `hass.callService` check.

## 7. Gate status
Technically the gate passes (attributes present, median coverage 0.97). Waiting for your approval (blocking H item). Observations to weigh: small-town coverage 0.00; unresolved [U] items above, which I propose to settle at the start of Phase 1 with throwaway runtime tests in a dev HA instance.
