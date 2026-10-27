# Automation examples

Replace entity ids with yours. These are valid Home Assistant YAML (parsed by the test suite); they
have not been run on a live system by the maintainer.

## Tell me when the terrace gets sun

```yaml
alias: Terrace is sunny
triggers:
  - trigger: state
    entity_id: binary_sensor.cafe_schneiderei_sunny_weather_aware
    to: "on"
    for: "00:05:00"
conditions:
  - condition: time
    after: "09:00:00"
    before: "20:00:00"
actions:
  - action: notify.mobile_app_phone
    data:
      message: >-
        Sun at the terrace for the next
        {{ states('sensor.cafe_schneiderei_sun_remaining') }} minutes.
mode: single
```

## Warn me ten minutes before the sun leaves

```yaml
alias: Sun leaves the bench soon
triggers:
  - trigger: template
    value_template: >-
      {{ is_state('binary_sensor.bench_sunny', 'on')
         and states('sensor.bench_sun_remaining') | int(99) <= 10 }}
actions:
  - action: notify.mobile_app_phone
    data:
      message: "Only {{ states('sensor.bench_sun_remaining') }} minutes of sun left at the bench."
mode: single
```

## Read the day's windows from a script

```yaml
alias: Log sunny windows
sequence:
  - action: sunspots.get_sun_forecast
    target:
      entity_id: binary_sensor.cafe_schneiderei_sunny
    response_variable: sun
  - action: persistent_notification.create
    data:
      message: "{{ sun['binary_sensor.cafe_schneiderei_sunny'].windows | map(attribute='start') | list }}"
```
