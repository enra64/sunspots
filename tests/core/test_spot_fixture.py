"""End-to-end core test on a real Overture tile (Berlin, Cafe Schneiderei area)."""

import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from custom_components.sunspots.core.buildings import derive_buildings
from custom_components.sunspots.core.corrections import Corrections
from custom_components.sunspots.core.heights import HeightSettings
from custom_components.sunspots.core.providers.overture_pmtiles import parse_tile
from custom_components.sunspots.core.spot import SpotParameters, build_spot_model, final_horizon
from custom_components.sunspots.core.timeline import compute_timeline

FIXTURE = Path(__file__).parents[1] / "fixtures" / "overture_buildings_z14_8802_5370.mvt"
LAT, LON = 52.5520183, 13.4191958


def test_real_tile_end_to_end():
    chunk = parse_tile(
        FIXTURE.read_bytes(), 8802, 5370, "2026-10-21.0", "2026-10-27T00:00:00+00:00"
    )
    assert chunk.release == "2026-10-21.0" and len(chunk.features) > 1000
    derived = derive_buildings(chunk.features, LAT, LON, 250)
    assert 50 < len(derived.buildings) < 1000

    params = SpotParameters(LAT, LON, 250, 1.2, 0.0, HeightSettings())
    t0 = time.perf_counter()
    model = build_spot_model(
        derived.buildings, params, Corrections(), derived.parts_with_min_height
    )
    elapsed = time.perf_counter() - t0
    assert elapsed < 2.0
    assert model.geometric.max() > 20.0
    assert model.coverage is not None and model.coverage > 0.3
    assert abs(sum(model.source_pct.values()) - 100.0) < 0.5

    tz = ZoneInfo("Europe/Berlin")
    start = datetime(2026, 6, 21, tzinfo=tz).astimezone(UTC)
    tl = compute_timeline(
        LAT, LON, final_horizon(model, Corrections()), start, start + timedelta(days=2)
    )
    open_sky = compute_timeline(LAT, LON, model.geometric * 0, start, start + timedelta(days=2))
    assert tl.sun_time(start, start + timedelta(days=1)) < open_sky.sun_time(
        start, start + timedelta(days=1)
    )
    assert len(tl.slot_fractions) == 192
