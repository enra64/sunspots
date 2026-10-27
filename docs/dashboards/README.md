# Dashboard examples

## "Now" view (`now.yaml`)

Shows, for every Sunspots spot, whether it is in the sun right now and until/from when,
plus the count of sunny spots from `sensor.sunspots_sunny_spots`.

How to use: *Edit dashboard → three dots → Raw configuration editor*, and paste the
view from `now.yaml` under `views:` (or paste single cards through the card editor's code editor).
The Markdown card finds your spots automatically (`integration_entities('sunspots')`), so it
needs no entity ids. The last card is a hand-picked example: replace the entity ids.

**Validation status.** The YAML parses and the Markdown template is rendered by the test
suite against Sunspots' real entities in a test Home Assistant instance (`tests/test_dashboards.py`).
The cards have **not** been opened in a running Home Assistant UI by the maintainer's agent;
the tile card's `state_content` option needs a recent Home Assistant (2026.10 is fine).

## "Today" view (`today.yaml`)

Best sun window per spot and an hour-by-hour table (sun share, cloud, ☀️/⛅/☁️) from
`sensor.<spot>_sun_forecast`. Same validation status as above (templates rendered in tests).

## Morning notification (`morning-notification.yaml`)

Optional automation: at 08:30 tells you the next sunny window across all spots. Replace the notify
service. The message template is tested; the automation itself was not run.

## Optional HACS variants

- [`auto-entities`](https://github.com/thomasloven/lovelace-auto-entities): list only the sunny spots:

  ```yaml
  type: custom:auto-entities
  card:
    type: entities
    title: Sunny right now
  filter:
    include:
      - integration: sunspots
        domain: binary_sensor
        state: "on"
        entity_id: "*_sunny"
  ```

  (Unvalidated: written from the card's documentation.)
