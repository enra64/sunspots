# Versions, storage and migrations

| What | Version | On a mismatch |
|---|---|---|
| Config entry (`VERSION`/`MINOR_VERSION`) | 1.1 | `async_migrate_entry` raises the minor version of older entries; an entry from a *newer* major version fails to load (no downgrade) |
| Storage files `.storage/sunspots.spot.<id>`, `sunspots.tile.<key>`, `sunspots.tile_index` | 1.1 | `_SunspotsStore` migrates minor version 0 files by forcing a horizon recompute; unknown major versions raise instead of guessing |
| `algo_version` inside each spot store (currently 1) | 1 | The horizon is recomputed from the stored buildings (no network) and saved again |
| Horizon signature in each spot store | – | Observer height, ground offset, floor height, default height or height overrides changed: horizon recomputed from stored buildings. Location or radius changed: buildings re-derived from the tile cache (the reconfigure flow downloads missing tiles first) |

**When you change the model** (horizon or timeline maths): bump `ALGO_VERSION` in `core/const.py`. Every
spot recomputes once at next start, offline.

**When you change the stored layout**: bump `STORAGE_VERSION`/`STORAGE_MINOR_VERSION` in `data.py` and
extend `_SunspotsStore._async_migrate_func`; add a test that loads an old file from `hass_storage`.

**Upgrading between releases of this project** needs no action: 0.1 → 0.3 only added entities
(`sun_forecast`, `shadow_map`), one hub option (`cloud_threshold_partly`, defaulted when missing) and
actions. Cached building data stays valid. Overture releases expire after about 60 days; Sunspots
always asks for the latest release when it downloads and keeps older cached tiles.
