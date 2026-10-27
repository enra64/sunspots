# Sunspots Lovelace card

`custom:sunspots-card` shows sun and shade status, a timeline for today and
tomorrow and a shadow map for spots created by the Sunspots integration.
`custom:sunspots-shadow-card` shows the current, automatically refreshed shadow map
of one spot. TypeScript + Lit, bundled by esbuild into one ES module with both cards:
`custom_components/sunspots/frontend/sunspots-card.js`.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | required | `custom:sunspots-card` |
| `mode` | `overview` \| `timeline` \| `map` | `overview` | Card view |
| `entities` | list | | `binary_sensor.<spot>_sunny` entities |
| `entity` | string | | Single entity (alternative to `entities`, not both) |
| `title` | string | `Sunspots` | Card header |
| `show_today` | boolean | `true` | Draw today (timeline only) |
| `show_tomorrow` | boolean | `true` | Draw tomorrow (timeline only); at least one of the two must be on, otherwise the card reports a configuration error |
| `full_day` | boolean | `false` | Timeline only: always show 0-24 h, ignoring `start_hour`, `end_hour` and `auto` |
| `start_hour` | 0-24 \| `auto` | timeline: `auto`, map: 4 | First hour shown (timeline, map slider) |
| `end_hour` | 0-24 \| `auto` | timeline: `auto`, map: 23 | Last hour shown; must be greater than `start_hour` |

`auto` (timeline only) covers all sunny intervals and forecast windows of the shown days,
rounded outward to whole hours and clamped to 0-24; without any sun it falls back to 6-22.
Numbers override `auto` per bound. Invalid configuration raises a clear error in the editor. Only the first entity is used in `map` mode.

### Overview

One row per spot: name, a chip with icon and text (Sunny / Shaded / Sun, but cloudy),
"until HH:MM" or "from HH:MM", an "sun expected from HH:MM" hint from the forecast
sensor, sun hours today and cloud coverage when available.

```yaml
type: custom:sunspots-card
title: My spots
entities:
  - binary_sensor.garden_sunny
  - binary_sensor.terrace_sunny
```

### Timeline

Per spot a header (name and the current state chip, as in the overview) and one 28 px bar per
day with a day label ("Today"/"Tomorrow"). Each bar has hour grid lines, hour labels (24 h or 12 h by locale), a prominent "Now" marker on today's bar and the time range
printed inside sunny segments that are at least 90 minutes and 18 % of the bar wide. A one-line
summary under each bar lists all ranges and the total ("Sun: 11:00-13:30, 15:00-17:20 · 5.9 h",
"No direct sun"); tomorrow's adds "first sun 09:40" when `sun_tomorrow` has a state.

The label spacing depends on the visible window so labels stay readable on a narrow card
(about 350 px): every 2 hours up to a 12 h window, every 3 hours up to 18 h and every 4 hours
beyond (so `full_day: true` labels 00, 04, ..., 20, 00). Hour grid lines are always drawn.

Forecast classes (sunny solid, partly sunny hatched, sun unlikely light with dotted edges) are
used for a day when its forecast sensor has windows (today: `sun_forecast`, tomorrow:
`sun_tomorrow`); otherwise the geometry intervals are drawn solid with the "no weather
forecast" legend. Each bar has an `aria-label` listing its intervals.

```yaml
type: custom:sunspots-card
mode: timeline
entities:
  - binary_sensor.garden_sunny
```

```yaml
type: custom:sunspots-card
mode: timeline
show_today: false  # tomorrow only
start_hour: 7      # numbers override "auto"
end_hour: auto
entity: binary_sensor.garden_sunny
```

```yaml
type: custom:sunspots-card
mode: timeline
show_tomorrow: false   # today only
full_day: true         # 0-24 h, start_hour/end_hour are ignored
entities:
  - binary_sensor.garden_sunny
```

### Map

The shadow map of the first entity with a 10-minute time slider (default: now).
Slider moves call `sunspots.render_shadow_map` (debounced 150 ms, one request in
flight, stale responses dropped). The SVG is shown only through an `<img>` with a
`blob:` URL and never injected as HTML; responses over 300 KB are rejected. The render
follows the Home Assistant theme (`theme: dark` when `hass.themes.darkMode`, otherwise `light`)
and is requested again when the theme flips.

```yaml
type: custom:sunspots-card
mode: map
entity: binary_sensor.garden_sunny
start_hour: 5
end_hour: 22
```

## Shadow map card

`custom:sunspots-shadow-card` shows the current shadow map of one spot, refreshed automatically.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | required | `custom:sunspots-shadow-card` |
| `entity` | string | required | The spot's `binary_sensor.<spot>_sunny` (`entities` is accepted too, the first is used; `entity` wins if both are set) |
| `title` | string | `Sunspots` | Card header |
| `theme` | `auto` \| `light` \| `dark` | `auto` | `auto` follows the Home Assistant dark mode and re-renders when it flips |
| `refresh_minutes` | 1-60 | 5 | Refresh interval, rounded and clamped |
| `show_slider` | boolean | `false` | Adds the 10-minute time slider of the map mode |
| `start_hour`, `end_hour` | 0-24 | 4, 23 | Slider range |

It renders once when first connected with `hass`, then every `refresh_minutes` while connected
(the timer is stopped when the card is detached), and on the refresh button (which also resets
the slider to now). Below the image: render time, sun azimuth/elevation and the entity's
attribution. Loading and errors are announced (`role="alert"`); the same safeguards as the map
mode apply (single request in flight, `blob:` image only, 300 KB limit).

```yaml
type: custom:sunspots-shadow-card
entity: binary_sensor.garden_sunny
```

```yaml
type: custom:sunspots-shadow-card
title: Garden now
entity: binary_sensor.garden_sunny
theme: auto
refresh_minutes: 10
show_slider: true
```

## Visual editors

Both cards provide a visual editor (`getConfigElement()`), so they can be configured in the
Lovelace UI without YAML: `sunspots-card-editor` and `sunspots-shadow-card-editor`. They are
built on Home Assistant's `ha-form` (provided by Home Assistant at runtime) with entity pickers
limited to the Sunspots `binary_sensor` entities, and labels and helper texts in English and German
(`src/locale.ts`, keys `editor_*`).

- `sunspots-card`: `mode`, `entities`, `title`. Timeline adds `show_today`, `show_tomorrow`,
  `full_day` and the optional number fields `start_hour` / `end_hour` (empty = automatic; hidden
  while `full_day` is on). Map adds `start_hour` / `end_hour`.
- `sunspots-shadow-card`: `entity`, `title`, `theme`, `refresh_minutes`, `show_slider`; the slider
  range `start_hour` / `end_hour` appears only while `show_slider` is on.

The editors keep the YAML tidy: defaults and empty values are removed (`mode: overview`, `true` for
`show_today`/`show_tomorrow`, `false` for `full_day`/`show_slider`, `theme: auto`, 5 minutes,
default hours), `type` stays, a single `entity` of the overview card becomes `entities`, hours are
rounded to 0-24, and keys the editor does not know (for example `grid_options`, `visibility`) are
never removed. Values hidden by a toggle are kept. Pure logic lives in `src/editor-schema.ts`
(schema, labels) and `src/editor-config.ts` (normalisation, `config-changed` event); the Lit
element `src/editor-element.ts` only wires `ha-form` to them.

## Build and test

```sh
cd frontend
npm install
npm run typecheck   # strict tsc
npm test            # vitest
npm run build       # writes ../custom_components/sunspots/frontend/sunspots-card.js
```

The build is deterministic and prints the gzipped size; it fails above 100 KB.

## Entity contract (short)

Siblings are found via `hass.entities[id].device_id` and `translation_key`.

- `binary_sensor` `sunny`: on = in sun. Attributes `sun_azimuth`, `sun_elevation`,
  `horizon_elevation_at_sun`, `intervals_today` and `intervals_tomorrow` (lists of
  `[startISO, endISO]`; geometric sun), `attribution`.
- `binary_sensor` `sunny_weather_aware` (optional): on = sunny and clouds permit; `cloud_coverage`, `cloud_known`.
- `sensor` `next_change` (timestamp), `sun_remaining` (minutes), `sun_hours_today` (hours).
- `sensor` `sun_forecast` (optional): `sunny_now`, `partly`, `sunny_later`, `partly_later`,
  `no_sun_today`; attributes `windows` (`{start,end,class,past}`), `best_window`, `hourly`,
  `forecast_available`, `forecast_resolution`, `source_entity`. Today only.
- `sensor` `sun_tomorrow` (optional, timestamp): start of tomorrow's first sunny (else partly sunny)
  window, `unknown` if none. Attributes `intervals` (`{start,end}`, geometric sun, used when the
  `sunny` entity lacks `intervals_tomorrow`), `sun_hours`, `windows` and `best_window` (as in
  `sun_forecast`, for tomorrow), `forecast_available`, `forecast_resolution`.
- Service `sunspots.render_shadow_map` (target: the `sunny` entity, fields `time` and
  `theme`: `light` or `dark`) returns `{svg, time, sun_azimuth, sun_elevation, sun_below_horizon}`
  per entity. The cards send `theme` always and omit `time` for the current moment.

## Notes

- Times are formatted with `Intl.DateTimeFormat` using the HA language and `hass.config.time_zone`.
  Timestamps without UTC offset are read as local time in that zone.
- The card name is trimmed of a trailing "Sunny"/"Sonnig" from the entity's friendly name.
- UI strings: English and German (`src/locale.ts`), fallback English.
