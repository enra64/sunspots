#!/usr/bin/env python3
"""Score your own sun/shade observations against what Sunspots predicts.

    python tools/score_observations.py --config-dir /path/to/ha/config observations.csv

observations.csv columns (header required):
    spot,datetime,observed[,shademap]
    Cafe Schneiderei,2026-06-21T12:30,sunny,shaded
- spot      the spot's name in Home Assistant
- datetime  ISO 8601; without a UTC offset it is read in --tz (default: Europe/Berlin)
- observed  sunny | shaded   (what you saw)
- shademap  optional sunny | shaded (what ShadeMap showed at that time)

The tool reads the spot's stored horizon and corrections from <config>/.storage (read
only), recomputes the prediction (with the sun-disc margin, like the integration) and prints
agreement, a confusion matrix and every mismatch with a likely cause class.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from _core import load_core

load_core()
from sunspots_core.const import SUN_DISC_MARGIN_DEG  # noqa: E402
from sunspots_core.corrections import Corrections, apply_entries  # noqa: E402
from sunspots_core.solar import sun_position  # noqa: E402
from sunspots_core.timeline import is_sunny  # noqa: E402


def load_spots(config_dir: Path) -> dict[str, dict]:
    """name -> {lat, lon, geometric horizon, corrections}"""
    entries = json.loads((config_dir / ".storage" / "core.config_entries").read_text())["data"][
        "entries"
    ]
    spots = {}
    for entry in entries:
        if entry["domain"] != "sunspots":
            continue
        for sub in entry.get("subentries", []):
            store = config_dir / ".storage" / f"sunspots.spot.{sub['subentry_id']}"
            if not store.exists():
                continue
            data = json.loads(store.read_text())["data"]
            lat, lon, _ = data["meta"]["location"]
            spots[sub["title"]] = {
                "lat": lat,
                "lon": lon,
                "horizon": np.array(data["horizon"]),
                "corrections": Corrections.from_dict(data.get("corrections", {})),
            }
    return spots


def predict(spot: dict, horizon: np.ndarray, when: datetime) -> tuple[bool, float, float]:
    az, el = sun_position(spot["lat"], spot["lon"], when)
    return is_sunny(az, el, horizon, SUN_DISC_MARGIN_DEG), az, el


def classify(az: float, el: float, horizon_deg: float, flipped_nearby: bool) -> str:
    if el < 5:
        return "low sun (<5 deg): refraction/horizon-edge sensitivity"
    if flipped_nearby:
        return "near a sunny/shaded boundary (<=10 min): timing or a thin obstacle"
    if horizon_deg > el:
        return "model says shaded: check building heights near this azimuth, or trees"
    return "model says sunny: something not in the data (tree, awning, overhang, new building)"


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("observations")
    ap.add_argument("--config-dir", required=True, type=Path)
    ap.add_argument("--tz", default="Europe/Berlin")
    args = ap.parse_args()

    spots = load_spots(args.config_dir)
    tz = ZoneInfo(args.tz)
    with open(args.observations, newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        print("no observations")
        return 1
    stats: dict[str, Counter] = {}
    sm_stats: Counter = Counter()
    mismatches = []
    for row in rows:
        name = row["spot"].strip()
        if name not in spots:
            print(f"unknown spot {name!r}; known: {', '.join(spots) or 'none'}", file=sys.stderr)
            return 2
        spot = spots[name]
        when = datetime.fromisoformat(row["datetime"])
        when = when.replace(tzinfo=tz) if when.tzinfo is None else when
        horizon = apply_entries(spot["horizon"], spot["corrections"].entries)

        predicted, az, el = predict(spot, horizon, when)
        near = any(
            predict(spot, horizon, when + timedelta(minutes=m))[0] != predicted
            for m in (-10, -5, 5, 10)
        )
        observed = row["observed"].strip().lower() == "sunny"
        c = stats.setdefault(name, Counter())
        c[(observed, predicted)] += 1
        if row.get("shademap"):
            sm_stats[(row["shademap"].strip().lower() == "sunny", observed)] += 1
        if observed != predicted:
            from sunspots_core.horizon import horizon_at

            mismatches.append((name, when, observed, az, el, horizon_at(horizon, az), near))

    total = Counter()
    for name, c in stats.items():
        total.update(c)
        n = sum(c.values())
        print(
            f"{name}: {100 * (c[(True, True)] + c[(False, False)]) / n:.0f}% agree over {n} observations"
        )
    n = sum(total.values())
    agree = total[(True, True)] + total[(False, False)]
    print(
        f"\nOVERALL: {100 * agree / n:.0f}% agreement ({agree}/{n}); target >= 85% (reported, not a gate)"
    )
    print("confusion (rows: you saw; cols: model said)")
    print(
        f"            sunny  shaded\n  sunny   {total[(True, True)]:6d} {total[(True, False)]:7d}"
    )
    print(f"  shaded  {total[(False, True)]:6d} {total[(False, False)]:7d}")
    if sm_stats:
        s_n = sum(sm_stats.values())
        s_agree = sm_stats[(True, True)] + sm_stats[(False, False)]
        print(
            f"\nShadeMap vs your observations: {100 * s_agree / s_n:.0f}% agreement ({s_agree}/{s_n})"
        )
    for name, when, observed, az, el, h, near in mismatches:
        print(
            f"\nMISMATCH {name} {when:%Y-%m-%d %H:%M} you saw {'sunny' if observed else 'shaded'}; "
            f"sun az {az:.0f} el {el:.1f}, horizon {h:.1f}\n  -> {classify(az, el, h, near)}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
