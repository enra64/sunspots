# Contributing

```bash
uv venv --python 3.14 .venv
uv pip install --python .venv/bin/python pytest-homeassistant-custom-component home-assistant-frontend==20260930.5 pmtiles==3.8.1 ruff mypy
.venv/bin/python -m pytest          # tests
.venv/bin/ruff check . && .venv/bin/ruff format --check .
.venv/bin/mypy                      # strict, whole integration
```

Rules of the road (see `docs/decisions.md` for the reasons):

- `custom_components/sunspots/core/` is pure Python + numpy and must never import
  `homeassistant` (a test enforces it).
- No new dependencies: `pmtiles==3.8.1` and `numpy` only. `astral` is used but not listed
  (Home Assistant pins 2.2).
- Everything user-visible needs English and German strings (`strings.json`, `translations/`).
- Diagnostics must not contain coordinates or geometry.
- Test fixtures under `tests/fixtures/` are ODbL data and keep their own `LICENSE`.
- `tools/` scripts use `tools/_core.py` to load `core/` without Home Assistant.

Frontend (`frontend/`, TypeScript + Lit): `cd frontend && npm ci && npm run typecheck && npm test && npm run build`.
The built bundle `custom_components/sunspots/frontend/sunspots-card.js` is committed; CI rebuilds it and
fails if it differs, so always commit the rebuilt file together with source changes.
