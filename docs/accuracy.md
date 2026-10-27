# Accuracy

**Status: no validation round has been done yet.** This page is filled in during the
human sign-off of each phase (see `docs/phase1-report.md`). Nothing below is a measurement.

## What the model does

Flat ground around the spot; buildings are prisms with a flat roof; the sun counts as visible
when its apparent elevation (refraction included) exceeds the skyline elevation at its
azimuth by 0.27° (the sun disc). Heights come from, in order: your overrides, measured heights,
floor count × 3.2 m, a table by building type, a default of 12 m.

## Known limits

- **Heights** are the main error source. In some places most buildings have no measured height;
  the *Data quality* sensor shows how much of the skyline is measured, and a repair issue appears
  below 30 %.
- No trees, awnings, overhangs, roof shapes, or terrain slopes (use *ground offset* for a raised
  terrace). Parts that float above the ground (arcades) are treated as solid.
- Clouds are not simulated; the weather-aware sensor uses the cloud value of your weather entity.
- "Today" uses Home Assistant's time zone, also for spots in other time zones.

## How to validate (you)

1. Note the real state at the spot at several times of day and in two seasons.
2. Put them in a CSV (`spot,datetime,observed[,shademap]`).
3. `python tools/score_observations.py --config-dir /path/to/config observations.csv`
   prints agreement, a confusion matrix, and each mismatch with a likely cause.
4. Fix heights (spot → Reconfigure → Corrections) or use the `sunspots.calibrate` action, and
   share the output in an issue ("attach diagnostics + comparison").

## Results

| Spot | Observations | Agreement | Notes |
|---|---|---|---|
| Cafe Schneiderei, Berlin | – | – | pending (human task) |
