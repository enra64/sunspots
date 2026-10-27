"""The standalone tools run against stored data and the standalone core loader works."""

import ast
import csv
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).parents[1]


def test_core_has_no_homeassistant_imports():
    offenders = []
    for path in (ROOT / "custom_components" / "sunspots" / "core").rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            names = []
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                names = [node.module]
            offenders += [f"{path.name}: {n}" for n in names if n.split(".")[0] == "homeassistant"]
    assert offenders == []


def test_score_observations_end_to_end(tmp_path):
    storage = tmp_path / ".storage"
    storage.mkdir()
    horizon = np.zeros(720)
    horizon[int(150 / 0.5) - 10 : int(150 / 0.5) + 10] = 70.0  # tall building to the SSE
    (storage / "core.config_entries").write_text(
        json.dumps(
            {
                "data": {
                    "entries": [
                        {
                            "domain": "sunspots",
                            "subentries": [{"subentry_id": "abc", "title": "Test Spot"}],
                        }
                    ]
                }
            }
        )
    )
    (storage / "sunspots.spot.abc").write_text(
        json.dumps(
            {
                "data": {
                    "meta": {"location": [52.55, 13.42, 250]},
                    "horizon": horizon.tolist(),
                    "corrections": {},
                }
            }
        )
    )
    obs = tmp_path / "obs.csv"
    with obs.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["spot", "datetime", "observed", "shademap"])
        w.writerow(["Test Spot", "2026-06-21T08:00", "sunny", "sunny"])  # open sky: sunny
        w.writerow(
            ["Test Spot", "2026-06-21T12:00", "sunny", "shaded"]
        )  # sun at ~150 deg: model shaded
    out = subprocess.run(
        [
            sys.executable,
            str(ROOT / "tools" / "score_observations.py"),
            "--config-dir",
            str(tmp_path),
            str(obs),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert out.returncode == 0, out.stderr
    assert "OVERALL: 50% agreement" in out.stdout
    assert "MISMATCH Test Spot 2026-06-21 12:00" in out.stdout
    assert "building heights" in out.stdout
    assert "ShadeMap vs your observations: 50%" in out.stdout


def test_bench_runs_small():
    out = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "bench.py"), "--edges", "800", "--repeat", "1"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert out.returncode == 0, out.stderr
    assert "horizon :" in out.stdout and "memory  :" in out.stdout
