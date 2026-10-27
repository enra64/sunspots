# Phase 3 report — shadow view and card (v0.3.0)

Date: 2026-10-27. Human sign-off pending (phone/desktop, accessibility).

## Done
- `core/render.py`: `shadow_polygons` (footprint + one quad per ring edge incl. courtyard walls, clamped to 2× radius, oriented so one nonzero path is their exact union) and `to_svg` (north up, evenodd building holes, colours by height source with hatch for guessed heights, spot marker, north arrow, sun arrow, scale bar, caption, attribution, escaped text).
- `image.<spot>_shadow_map` (SVG; 5-minute cache; buildings-only image kept at night until sunrise; invalidated when the model or corrections change), `sunspots.render_shadow_map` (naive times are read as local; response `svg`, `time`, `sun_azimuth`, `sun_elevation`, `sun_below_horizon`), payload budget 300 KB with up to two zoom-in retries, then a translated error.
- `custom:sunspots-card` (built by a delegated agent from a written contract; reviewed and re-run by me): modes overview/timeline/map with slider. Static path + `add_extra_js_url` in `async_setup`, `dependencies: ["http","frontend"]`, CI frontend job with drift check.

## Verified (agent)
- Python: 170 tests pass (new: renderer, image entity caching/night/invalidation, service, budget, card registration and file served over HTTP); ruff and strict mypy on core clean.
- Renderer ↔ horizon consistency: 25 random scenes × 40 random times (≥ 300 compared samples) agree **100 %** under the spec's exclusions. Exclusion classes (documented in the test): sun < 2°; within 0.5° azimuth of an edge-span endpoint; within 0.1° elevation of the exact blocking angle; samples where the 0.5° bin lookup differs from the exact ray cast by more than 0.1° (the "bin interpolation" systematic difference).
- Orientation (building south of the spot casts toward the top), courtyard (low sun shades the courtyard, high sun lights it), clamping, sun below horizon, SVG well-formed and safe against hostile caption/title/attribution text (no script, image, foreignObject, event or href content), payload < 300 KB for the real Berlin tile at three times of year.
- Frontend: `npm run typecheck`, 56 unit tests, build is byte-identical (sha1 verified twice), 13.2 KB gzipped (< 100 KB).
- I rendered all three card modes in a browser against a mock `hass` object (light and dark): overview chips, timeline with forecast patterns and legend, map from a real renderer SVG; slider input produced one debounced `render_shadow_map` call with a local time and the image is a blob URL (no inline SVG).

## Not verified
- The card in a real Home Assistant (`ha-card`, `ha-icon`, grid options, theme variables), any phone, the accessibility checklist. No screenshots of the card in docs (the README shows a real renderer SVG instead).
- Visual card editor: not built (optional).

## Deviations
- Shadows are filled `nonzero` (oriented union), buildings `evenodd`: evenodd on overlapping shadow quads would cancel overlaps; the spec's evenodd applies to the building footprints with holes.
- SVG served as `image/svg+xml` from the image entity (HA accepts any `image/*`; confirmed in source and by an end-to-end test).

## Human sign-off
Phone + desktop in light/dark, keyboard/screen-reader pass, confirm the card appears as a custom card in the picker and that the `time` slider calls work against your real instance.
