# Sunspots Lovelace card

`custom:sunspots-card` shows sun and shade status, a daily timeline and a shadow
map for spots created by the Sunspots integration. TypeScript + Lit, bundled by
esbuild into one ES module: `custom_components/sunspots/frontend/sunspots-card.js`.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | string | required | `custom:sunspots-card` |
| `mode` | `overview` \| `timeline` \| `map` | `overview` | Card view |
| `entities` | list | | `binary_sensor.<spot>_sunny` entities |
| `entity` | string | | Single entity (alternative to `entities`, not both) |
| `title` | string | `Sunspots` | Card header |
| `start_hour` | 0-24 | 6 (map: 4) | First hour shown (timeline, map slider) |
| `end_hour` | 0-24 | 22 (map: 23) | Last hour shown; must be greater than `start_hour` |

Invalid configuration raises a clear error in the editor. Only the first entity is used in `map` mode.

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

A bar per spot for today. Geometry intervals are drawn solid; when the forecast
sensor has windows, they are drawn instead: sunny solid, partly sunny hatched,
sun unlikely light with dotted edges. A legend, a "now" marker and an `aria-label`
listing all intervals are included.

```yaml
type: custom:sunspots-card
mode: timeline
start_hour: 7
end_hour: 21
entities:
  - binary_sensor.garden_sunny
```

### Map

The shadow map of the first entity with a 10-minute time slider (default: now).
Slider moves call `sunspots.render_shadow_map` (debounced 150 ms, one request in
flight, stale responses dropped). The SVG is shown only through an `<img>` with a
`blob:` URL and never injected as HTML; responses over 300 KB are rejected.

```yaml
type: custom:sunspots-card
mode: map
entity: binary_sensor.garden_sunny
start_hour: 5
end_hour: 22
```

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
  `horizon_elevation_at_sun`, `intervals_today` (list of `[startISO, endISO]`), `attribution`.
- `binary_sensor` `sunny_weather_aware` (optional): on = sunny and clouds permit; `cloud_coverage`, `cloud_known`.
- `sensor` `next_change` (timestamp), `sun_remaining` (minutes), `sun_hours_today` (hours).
- `sensor` `sun_forecast` (optional): `sunny_now`, `partly`, `sunny_later`, `partly_later`,
  `no_sun_today`; attributes `windows` (`{start,end,class,past}`), `best_window`, `hourly`,
  `forecast_available`, `forecast_resolution`, `source_entity`.
- Service `sunspots.render_shadow_map` (target: the `sunny` entity, field `time`) returns
  `{svg, time, sun_azimuth, sun_elevation, sun_below_horizon}` per entity.

## Notes

- Times are formatted with `Intl.DateTimeFormat` using the HA language and `hass.config.time_zone`.
  Timestamps without UTC offset are read as local time in that zone.
- The card name is trimmed of a trailing "Sunny"/"Sonnig" from the entity's friendly name.
- UI strings: English and German (`src/locale.ts`), fallback English.
