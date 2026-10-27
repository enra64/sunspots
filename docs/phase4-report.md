# Phase 4 report — hardening and v1.0.0 candidate

Date: 2026-10-27. The release itself is **human-gated**: publish `v1.0.0` as a GitHub *pre-release* and un-flag it only after the sign-off items below.

## Done
- Scale test (50 spots), quality-scale self-review (`docs/quality-scale.md`), strict typing for the whole integration, icon translations, hub reconfigure flow, recovery logging, HACS default-repository checklist, migration notes, validation protocol, examples, README (updates, troubleshooting, limitations), issue templates, changelog.
- Two real bugs found and fixed in this phase: (1) the `buildings_unavailable` repair stayed open after a spot recovered (found by the coverage agent's strict xfail test, fixed, marker removed); (2) the hub sensor's `entity_ids` could be empty until the next minute because it was written before the spots' binary sensors registered (found as a rare flaky test; now refreshed on registry events).
- Dead code removed: unused attributes found by vulture, the unreachable `invalid_obstacle` branch in the add-obstacle flow, test-only `unproject` moved out of core.

## Verified (agent)
| Check | Result |
|---|---|
| Tests | 261 Python tests + 56 frontend tests; Python suite run 6× in a row after the last change without failure |
| Coverage | 99 % overall; `config_flow.py` 100 %; all other modules ≥ 97 % |
| ruff / ruff format / mypy --strict (all 32 integration files) | clean |
| Frontend typecheck, build reproducible (sha1 identical twice), 13.2 KB gzipped | OK |
| Scale (sandbox: Apple arm64, 12 cpus, Python 3.14.9; includes Home Assistant test-harness overhead) | 50 spots: cold start 3.3 s (one tile download shared, 4 HTTP requests), warm start from stores 1.8 s with zero requests, one-minute tick for all spots 0.04 s, extra peak RSS ≈ 77 MB, spot stores 3.2 MB in total |
| Network etiquette | one fetch at a time, ≤ 1 request/s per host, hourly cap, `Retry-After`/backoff, size caps, ranged requests refused if the server ignores Range (tests with a local server) |
| `tools/bench.py` (20 000 synthetic edges) | horizon 0.02 s, 11 MB extra; **not** a server/Pi number |

## Not verified / needs you
1. **hassfest and HACS Action** have never run (local hassfest from an external clone was blocked by the permission check; CI workflows exist). Push and watch CI, or allow a local run.
2. **Real Home Assistant (Docker) install**, flows in the real UI, the card in a real dashboard and on a phone, accessibility pass, `tools/bench.py` on your server.
3. **ShadeMap/observation validation round and the published `docs/accuracy.md`**: this is a [core] Phase 4 item that only you can do (needs real observations; protocol in `docs/validation-protocol.md`, tool `tools/score_observations.py`). `docs/accuracy.md` says plainly that no numbers exist yet.
4. Met.no **hourly** forecast fields and the time semantics assumed in `docs/decisions.md` D20.
5. The optional corrections import/export was not built (backlog).

## Decisions that need your veto/confirmation
D19 (no ≤10-minute flicker bridging — it cannot occur with 15-minute slots), D21 (slots under 50 % sunlit add no window), D2 (Apache-2.0 + NOTICE), the 1-minute tick (recorder rows while sunny).

## Release steps (yours)
Run CI → fix anything hassfest/HACS report → install on your HA → validation round → tag `v1.0.0` as pre-release → un-flag → follow `docs/hacs-default-submission.md`.
