# sunspots-card and sunspots-shadow-card

Shipped inside the integration (served from `/sunspots_static/sunspots-card.js`, registered when
Sunspots starts, so there is nothing to add under *Resources*). Works with light and dark themes,
English and German, keyboard and screen readers (text for every state, patterns not only colours).

```yaml
type: custom:sunspots-card
mode: overview            # overview | timeline | map
entities:                 # the spots' "<spot> Sunny" binary sensors
  - binary_sensor.cafe_schneiderei_sunny
  - binary_sensor.bench_sunny
title: Where is the sun?  # optional
```

| Mode | Shows | Extra options |
|---|---|---|
| `overview` | Sunny/shaded chip per spot, "until / from HH:MM", "sun, but cloudy" if the weather-aware sensor is off, expected sun later today, sun hours | – |
| `timeline` | Today **and tomorrow** as bars per spot: hour grid, the sunny times written on the segments, a one-line summary ("Sun: 11:00–13:30, 15:00–17:20 · 5.9 h", "first sun 09:40"), geometric sun or the forecast classes (solid = sunny, hatched = partly, dotted = unlikely), "Now" marker | `day` (`today` / `tomorrow` / `both`, default `both`), `start_hour` / `end_hour` (`auto` by default: fits the sunny times, or a number) |
| `map` | The shadow picture for the first spot with a time slider (10-minute steps, debounced, one request at a time); follows the dark theme | `start_hour` (4), `end_hour` (23) |

## sunspots-shadow-card

The current shadow picture of one spot, refreshed automatically, in the colours of your theme (light or dark).

```yaml
type: custom:sunspots-shadow-card
entity: binary_sensor.cafe_schneiderei_sunny
title: Shadows now         # optional
theme: auto                # auto (follow Home Assistant) | light | dark
refresh_minutes: 5         # 1-60
show_slider: false         # true adds the time slider
```

Details, the entity contract and the build instructions are in [frontend/README.md](../frontend/README.md).
The picture is shown as an image from a blob URL, never injected into the page, and rejected if it is
larger than 300 KB.

## Status

Logic is unit-tested (117 tests) and the bundle is 16 KB gzipped. The agent checked all three modes and
the slider against a mock Home Assistant object in a browser (light and dark); it has **not** been
opened in a real Home Assistant, and no phone testing was done. The visual card editor is not built
(YAML only).
