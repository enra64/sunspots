#!/usr/bin/env python3
"""Benchmark the horizon computation on synthetic dense city blocks.

    python tools/bench.py                 # 20 000 edges, radius 250 m
    python tools/bench.py --edges 40000 --repeat 5

Needs numpy (and astral for --timeline). Prints edge count, wall time and extra
peak memory plus the machine description. Numbers are only meaningful for the machine
they were measured on: run it on the device you care about (Raspberry Pi, your server).
"""

from __future__ import annotations

import argparse
import os
import platform
import random
import sys
import time
import tracemalloc
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _core import load_core

load_core()
from sunspots_core.horizon import compute_horizon  # noqa: E402
from sunspots_core.models import Building  # noqa: E402


def synthetic_blocks(edges: int, radius: float, seed: int = 1) -> list[Building]:
    """Small buildings with 4x4 m courtyards (8 edges each), spread over 1.2x the radius."""
    rng = random.Random(seed)
    buildings = []
    for i in range(edges // 8):
        while True:
            x, y = (
                rng.uniform(-1.2 * radius, 1.2 * radius),
                rng.uniform(-1.2 * radius, 1.2 * radius),
            )
            if abs(x) > 15 or abs(y) > 15:
                break
        outer = [(x, y), (x + 12, y), (x + 12, y + 12), (x, y + 12)]
        hole = [(x + 4, y + 4), (x + 4, y + 8), (x + 8, y + 8), (x + 8, y + 4)]
        buildings.append(Building(id=str(i), polygons=[[outer, hole]], height=rng.uniform(6, 40)))
    return buildings


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--edges", type=int, default=20_000)
    ap.add_argument("--radius", type=float, default=250.0)
    ap.add_argument("--repeat", type=int, default=3)
    ap.add_argument("--timeline", action="store_true", help="also time the 2-day sun timeline")
    args = ap.parse_args()

    buildings = synthetic_blocks(args.edges, args.radius)
    heights = [b.height or 0.0 for b in buildings]
    edges = sum(len(r) for b in buildings for p in b.polygons for r in p)
    print(
        f"machine : {platform.platform()} / {platform.machine()} / {os.cpu_count()} cpus / "
        f"python {platform.python_version()}"
    )
    print(f"input   : {edges} edges in {len(buildings)} buildings, radius {args.radius:.0f} m")

    times = []
    peak = 0
    for _ in range(args.repeat):
        tracemalloc.start()
        t0 = time.perf_counter()
        result = compute_horizon(buildings, heights, 1.2, args.radius)
        times.append(time.perf_counter() - t0)
        peak = max(peak, tracemalloc.get_traced_memory()[1])
        tracemalloc.stop()
    print(
        f"horizon : best {min(times):.3f} s, worst {max(times):.3f} s over {args.repeat} runs; "
        f"max elevation {result.angles.max():.1f} deg"
    )
    print(f"memory  : extra peak {peak / 1e6:.1f} MB (tracemalloc, Python+numpy allocations)")
    if args.timeline:
        from sunspots_core.timeline import compute_timeline

        start = datetime(2026, 6, 21, tzinfo=UTC)
        t0 = time.perf_counter()
        compute_timeline(52.5, 13.4, result.angles, start, start + timedelta(days=2))
        print(f"timeline: {time.perf_counter() - t0:.3f} s for 2 days at 1-minute steps")
    print("targets : < 2 s and < 150 MB extra for ~20 000 edges on a Raspberry Pi 4 class device")


if __name__ == "__main__":
    main()
