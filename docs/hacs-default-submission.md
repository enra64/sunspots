# Checklist: submitting to the HACS default repositories

Source: HACS documentation "Include default repositories" (read 2026-10-27). **You** (owner) must send the PR;
the agent cannot. Status key: ✅ done in the repository, ⬜ needs you or GitHub.

| Requirement | Status |
|---|---|
| Works as a custom repository (HACS → Custom repositories) | ⬜ test it once on your HA |
| Public GitHub repository, not archived | ⬜ push `enra64/sunspots` and make it public |
| Description, issues enabled, topics (e.g. `home-assistant`, `hacs`, `integration`, `solar`) | ⬜ GitHub settings |
| OSI licence GitHub can identify | ✅ Apache-2.0 `LICENSE` (the ODbL fixtures sit in their own subfolder) |
| Domain not used by a core integration | ✅ `sunspots` is not in Home Assistant core (checked against core `dev` 2026-10-27) |
| `brand/icon.png` | ✅ `custom_components/sunspots/brand/` (icon, dark icon, logos, @2x) |
| `manifest.json` valid | ✅ keys per docs; ⬜ hassfest result in CI |
| `hacs.json` with `name` | ✅ (`homeassistant: 2026.10.0`, `render_readme`) |
| HACS Action passes with no ignores | ⬜ runs in `.github/workflows/ci.yml` (job `hacs`) |
| Hassfest passes | ⬜ job `hassfest` |
| At least one full GitHub **release** (not just a tag) | ⬜ create a release from tag after the checks pass |
| PR from a personal account to `hacs/default`, branch from `master`, entry added alphabetically under `integration`, PR template filled completely | ⬜ you |

Before the release: finish the human sign-off items of the phase reports, run `tools/score_observations.py`
on real observations and put the numbers in `docs/accuracy.md`, tag `v1.0.0` (un-flag the pre-release), and
make sure the README screenshots/claims match what you saw in a real Home Assistant.
