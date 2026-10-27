import math
import re
import xml.etree.ElementTree as ET
from datetime import UTC, datetime, timedelta
from pathlib import Path

import numpy as np
import pytest

from custom_components.sunspots.core.buildings import derive_buildings
from custom_components.sunspots.core.corrections import Corrections
from custom_components.sunspots.core.geometry import point_in_polygon
from custom_components.sunspots.core.heights import HeightSettings, resolve_all
from custom_components.sunspots.core.horizon import compute_horizon, horizon_at
from custom_components.sunspots.core.models import Building
from custom_components.sunspots.core.providers.overture_pmtiles import parse_tile
from custom_components.sunspots.core.render import SVG_PX, shadow_polygons, to_svg
from custom_components.sunspots.core.solar import sun_position

from .helpers import box, rect

FIXTURE = Path(__file__).parents[1] / "fixtures" / "overture_buildings_z14_8802_5370.mvt"
H_OBS = 1.2
RADIUS = 250.0


def lit(shadows, x=0.0, y=0.0) -> bool:
    return not any(point_in_polygon(x, y, poly) for poly in shadows)


def exact_horizon_angle(buildings, heights, az) -> tuple[float, bool]:
    """Independent ray cast: blocking elevation toward az, and whether az is near an edge end."""
    ux, uy = math.sin(math.radians(az)), math.cos(math.radians(az))
    best, near_edge = 0.0, False
    for b, h in zip(buildings, heights, strict=True):
        h_eff = h - H_OBS
        if h_eff <= 0:
            continue
        for poly in b.polygons:
            for ring in poly:
                for i, (px, py) in enumerate(ring):
                    qx, qy = ring[(i + 1) % len(ring)]
                    for ex_x, ex_y in ((px, py), (qx, qy)):
                        a = math.degrees(math.atan2(ex_x, ex_y)) % 360
                        if min(abs(a - az), 360 - abs(a - az)) < 0.5:
                            near_edge = True
                    ex, ey = qx - px, qy - py
                    den = ux * ey - uy * ex
                    if abs(den) < 1e-12:
                        continue
                    t = (px * ey - py * ex) / den
                    s = (px * uy - py * ux) / den  # parameter along the edge
                    if t >= 1.0 and 0.0 <= s <= 1.0:
                        best = max(best, math.degrees(math.atan2(h_eff, t)))
    return best, near_edge


def random_scene(rng, n=25):
    blds = []
    for i in range(n):
        x, y = rng.uniform(-200, 200, 2)
        w, d = rng.uniform(6, 35, 2)
        if abs(x) < 20 and abs(y) < 20:
            continue
        if math.hypot(max(abs(x), abs(x + w)), max(abs(y), abs(y + d))) > 240:
            continue
        polygon = [rect(x, y, x + w, y + d)]
        if i % 3 == 0 and w > 16 and d > 16:
            polygon.append(list(reversed(rect(x + 5, y + 5, x + w - 5, y + d - 5))))
        blds.append(Building(str(i), [polygon], height=float(rng.uniform(5, 45))))
    return blds


def test_renderer_and_horizon_agree_on_random_samples():
    rng = np.random.default_rng(42)
    checked = excluded = 0
    for _ in range(25):
        blds = random_scene(rng)
        heights = [b.height for b in blds]
        horizon = compute_horizon(blds, heights, H_OBS, RADIUS).angles
        for _ in range(40):
            when = datetime(2026, 1, 1, tzinfo=UTC) + timedelta(
                minutes=int(rng.integers(0, 525_600))
            )
            az, el = sun_position(52.5, 13.4, when)
            if el < 2.0:
                continue
            exact, near_edge = exact_horizon_angle(blds, heights, az)
            via_bins = horizon_at(horizon, az)
            if near_edge or abs(el - exact) < 0.1 or abs(via_bins - exact) > 0.1:
                excluded += 1
                continue
            shadows = shadow_polygons(blds, heights, az, el, H_OBS, RADIUS)
            assert lit(shadows) == (el > via_bins), (az, el, exact, via_bins)
            checked += 1
    assert checked > 300 and excluded < checked  # a meaningful number of samples, mostly kept


def test_shadow_falls_away_from_the_sun_and_svg_has_north_up():
    south = box("s", -10, -30, 10, -20, 20.0)  # building due south of the spot
    shadows = shadow_polygons([south], [20.0], 180.0, 45.0, H_OBS, RADIUS)
    ys = [y for poly in shadows for ring in poly for _, y in ring]
    assert max(ys) == pytest.approx(-20 + 18.8, abs=1e-6) and min(ys) == -30  # toward north
    svg = to_svg(
        [south],
        ["height"],
        shadows,
        radius=RADIUS,
        sun_azimuth=180,
        sun_elevation=45,
        caption="c",
        attribution="a",
        title="t",
    )
    paths = re.findall(r'<path d="([^"]+)" fill="(#[0-9a-f]+)"', svg)
    shadow_ys = [float(n.split(",")[1]) for n in re.findall(r"[\d.]+,[\d.]+", paths[0][0])]
    building_ys = [float(n.split(",")[1]) for n in re.findall(r"[\d.]+,[\d.]+", paths[1][0])]
    assert paths[0][1] == "#1c2b3a"
    assert min(shadow_ys) < min(building_ys)  # the shadow reaches further toward the top (north)
    assert min(building_ys) > SVG_PX / 2  # the building itself lies south of the spot


def test_courtyard_shadow_falls_into_the_hole_and_holes_stay_open():
    block = Building(
        "c",
        [[rect(-22.5, -22.5, 22.5, 22.5), list(reversed(rect(-7.5, -7.5, 7.5, 7.5)))]],
        height=18.0,
    )
    low_sun = shadow_polygons([block], [18.0], 270.0, 10.0, H_OBS, RADIUS)
    assert not lit(low_sun)  # the spot in the courtyard is shaded by the walls
    high_sun = shadow_polygons([block], [18.0], 270.0, 80.0, H_OBS, RADIUS)
    assert lit(high_sun)  # sun nearly overhead: the courtyard floor is lit
    svg = to_svg(
        [block],
        ["height"],
        high_sun,
        radius=RADIUS,
        sun_azimuth=270,
        sun_elevation=80,
        caption="c",
        attribution="a",
        title="t",
    )
    assert 'fill-rule="evenodd"' in svg


def test_shadow_length_is_clamped_and_sun_below_horizon_has_none():
    b = box("b", 50, 50, 60, 60, 40.0)
    low = shadow_polygons([b], [40.0], 90.0, 0.5, H_OBS, RADIUS)
    assert max(abs(x) for poly in low for ring in poly for x, _ in ring) <= 60 + 2 * RADIUS + 1e-6
    assert shadow_polygons([b], [40.0], 90.0, 0.0, H_OBS, RADIUS) == []
    svg = to_svg(
        [b],
        ["height"],
        [],
        radius=RADIUS,
        sun_azimuth=90,
        sun_elevation=-5,
        caption="sun below horizon",
        attribution="a",
        title="t",
    )
    assert "sun below horizon" in svg and "stroke-dasharray" not in svg


def test_svg_is_well_formed_and_safe_with_hostile_text():
    evil = '</text><script>alert(1)</script><image href="http://evil/x.png"/>" onload="x()'
    b = box("b", 10, 10, 20, 20, 12.0)
    svg = to_svg(
        [b],
        ["height"],
        [],
        radius=RADIUS,
        sun_azimuth=90,
        sun_elevation=30,
        caption=evil,
        attribution=evil,
        title=evil,
    )
    root = ET.fromstring(svg)  # parses: nothing broke out of the text nodes
    tags = {el.tag.split("}")[1] for el in root.iter()}
    assert tags <= {
        "svg",
        "title",
        "defs",
        "pattern",
        "line",
        "rect",
        "path",
        "circle",
        "g",
        "text",
    }
    for el in root.iter():  # injected markup stayed inside text/attribute values
        assert not any(k.lower().startswith("on") or k.endswith("href") for k in el.attrib)
    texts = [el.text for el in root.iter() if el.tag.endswith("text") and el.text]
    assert evil in texts  # round-trips as inert text


def test_real_tile_payload_is_within_budget():
    chunk = parse_tile(FIXTURE.read_bytes(), 8802, 5370, "r", "t")
    lat, lon = 52.5520183, 13.4191958
    derived = derive_buildings(chunk.features, lat, lon, RADIUS)
    heights, sources = resolve_all(
        derived.buildings, HeightSettings(), Corrections().overrides and {}
    )
    for when in (
        datetime(2026, 6, 21, 10, tzinfo=UTC),
        datetime(2026, 12, 21, 11, tzinfo=UTC),
        datetime(2026, 6, 21, 17, 30, tzinfo=UTC),
    ):
        az, el = sun_position(lat, lon, when)
        shadows = shadow_polygons(derived.buildings, heights, az, el, H_OBS, RADIUS)
        svg = to_svg(
            derived.buildings,
            sources,
            shadows,
            radius=RADIUS,
            sun_azimuth=az,
            sun_elevation=el,
            caption="x",
            attribution="© OpenStreetMap contributors, Overture Maps Foundation",
            title="t",
        )
        assert len(svg) < 300_000, len(svg)
        ET.fromstring(svg)
