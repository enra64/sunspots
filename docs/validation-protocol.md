# Validation round (ShadeMap / own observations)

Target (reported, not a release gate): at least 85 % agreement for geometry only. The agent cannot do
this; it needs your eyes, a few sunny days and ShadeMap (https://shademap.app, use it manually).

1. Pick **≥ 5 spots in ≥ 2 cities** (Cafe Schneiderei, Berlin is one). Put each exactly on the table or bench.
2. Observe each at **≥ 6 times of day** in **≥ 2 seasons** and write down what you see. Optionally also read
   ShadeMap's state for the same moment.
3. Fill `observations.csv`:
   ```
   spot,datetime,observed,shademap
   Cafe Schneiderei,2026-11-02T11:30,shaded,shaded
   ```
4. Run `python tools/score_observations.py --config-dir /path/to/ha/config observations.csv`.
5. For each mismatch the tool prints sun position, skyline at the sun and a likely cause class
   (low sun, near a boundary, shaded in the model, sunny in the model). Classify: wrong height (fix with
   *Corrections*), tree/awning (use `sunspots.calibrate` or an obstacle), pin placement, data gap.
6. Copy the table of results and the mismatch classes into `docs/accuracy.md`, tune the class default heights
   in `core/heights.py` if one class is consistently off, and bump `ALGO_VERSION` only if the maths changed.
7. Repeat after tuning to show the effect.

Issues from users: use the "Wrong sun/shade result" template and attach diagnostics plus this output.
