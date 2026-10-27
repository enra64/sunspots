import math

import numpy as np
import pytest

from custom_components.sunspots.core.buildings import RawFeature, derive_buildings
from custom_components.sunspots.core.geometry import project
from custom_components.sunspots.core.heights import (
    HeightSettings,
    coverage_metric,
    resolve_all,
    resolve_height,
    source_percentages,
)
from custom_components.sunspots.core.horizon import HorizonResult
from custom_components.sunspots.core.models import Building
from tests.core.helpers import unproject

LAT, LON = 52.55, 13.42


def lonlat_rect(x0, y0, x1, y1):
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    return [(lo, la) for la, lo in (unproject(LAT, LON, x, y) for x, y in pts)]


def feat(fid, rect, kind="building", parent=None, holes=(), **props):
    rings = [lonlat_rect(*rect)] + [lonlat_rect(*h) for h in holes]
    return RawFeature(fid, kind, parent, props, [rings])


def test_projection_roundtrip():
    x, y = project(LAT, LON, *unproject(LAT, LON, 120.0, -80.0))
    assert (x, y) == (pytest.approx(120.0, abs=1e-6), pytest.approx(-80.0, abs=1e-6))


def test_height_resolution_order():
    s = HeightSettings(floor_height=3.0, default_height=11.0)
    mk = lambda **kw: Building("x", [], **kw)  # noqa: E731
    assert resolve_height(mk(height=9.0, num_floors=3), s, override=30.0) == (30.0, "override")
    assert resolve_height(mk(height=9.0, num_floors=3), s) == (9.0, "height")
    assert resolve_height(mk(num_floors=4), s) == (12.0, "floors")
    assert resolve_height(mk(klass="church"), s) == (20.0, "class")
    assert resolve_height(mk(klass="weird", subtype="outbuilding"), s) == (3.0, "class")
    assert resolve_height(mk(klass="weird"), s) == (11.0, "default")
    assert resolve_height(mk(), s) == (11.0, "default")


def test_coverage_metric_skyline_weighted():
    angles = np.array([0.0, 1.0, 10.0, 10.0, 10.0, 30.0])
    limiter = np.array([-1, 0, 0, 1, 1, 1], dtype=np.int32)
    result = HorizonResult(angles, limiter)
    # bins above 2 deg: 2,3,4,5 -> limiters 0,1,1,1; building 1 is explicit
    assert coverage_metric(result, ["default", "height"]) == pytest.approx(0.75)
    assert coverage_metric(result, ["default", "default"]) == 0.0
    assert coverage_metric(HorizonResult(np.zeros(4), np.full(4, -1, dtype=np.int32)), []) is None


def test_source_percentages_and_resolve_all():
    s = HeightSettings()
    b = [Building("a", [], height=5.0), Building("b", [], num_floors=2), Building("c", [])]
    heights, sources = resolve_all(b, s, {"c": 7.0})
    assert sources == ["height", "floors", "override"]
    assert heights == [5.0, 2 * s.floor_height, 7.0]
    assert source_percentages(sources)["height"] == pytest.approx(33.3)


def test_derive_drops_building_containing_spot_but_keeps_courtyard():
    solid = feat("solid", (-10, -10, 10, 10), height=10)
    court = feat("court", (-30, -30, 30, 30), holes=[(-8, -8, 8, 8)], height=18)
    other = feat("other", (20, 20, 40, 40), height=9)
    out = derive_buildings([solid, court, other], LAT, LON, 250)
    ids = {b.id for b in out.buildings}
    assert ids == {"court", "other"}
    courtyard = next(b for b in out.buildings if b.id == "court")
    assert len(courtyard.polygons[0]) == 2  # hole kept


def test_derive_clipped_pieces_any_piece_containing_spot_counts():
    a = feat("split", (-20, -10, 0, 10), height=10)
    b = feat("split", (0, -10, 20, 10), height=10)
    out = derive_buildings([a, b], LAT, LON, 250)
    assert out.buildings == []
    c = feat("split2", (30, -10, 50, 10), height=10)
    d = feat("split2", (50, -10, 70, 10), height=10)
    out = derive_buildings([c, d], LAT, LON, 250)
    assert len(out.buildings) == 1 and len(out.buildings[0].polygons) == 2


def test_derive_underground_and_radius():
    ug = feat("ug", (30, 30, 40, 40), height=10, is_underground=True)
    far = feat("far", (900, 900, 910, 910), height=10)
    assert derive_buildings([ug, far], LAT, LON, 250).buildings == []


def test_parts_replace_parent_when_a_part_has_height():
    parent = feat("p", (30, 30, 60, 60), has_parts=True, **{"class": "apartments"})
    p1 = feat("p1", (30, 30, 45, 60), kind="part", parent="p", height=20.0)
    p2 = feat("p2", (45, 30, 60, 60), kind="part", parent="p", min_height=4.0, num_floors=2)
    out = derive_buildings([parent, p1, p2], LAT, LON, 250)
    assert {b.id for b in out.buildings} == {"p1", "p2"}
    assert out.parts_with_min_height == 1
    assert all(b.is_part and b.klass == "apartments" for b in out.buildings)


def test_parent_used_when_no_part_has_height_and_orphan_parts_stand_alone():
    parent = feat("p", (30, 30, 60, 60), has_parts=True, height=15.0)
    part = feat("p1", (30, 30, 45, 60), kind="part", parent="p")
    out = derive_buildings([parent, part], LAT, LON, 250)
    assert [b.id for b in out.buildings] == ["p"]
    orphan = feat("o1", (80, 30, 90, 40), kind="part", parent="missing", height=6.0)
    out = derive_buildings([orphan], LAT, LON, 250)
    assert [b.id for b in out.buildings] == ["o1"]


def test_building_roundtrip_dict():
    b = Building(
        "a",
        [[[(1.0, 2.0), (3.0, 2.0), (3.0, 5.0)], [(1.5, 2.5), (2.0, 2.5), (2.0, 3.0)]]],
        height=9.0,
        num_floors=3,
        min_height=1.0,
        klass="house",
        subtype="residential",
    )
    again = Building.from_dict(b.to_dict())
    assert again == b
    assert math.isclose(again.polygons[0][0][1][0], 3.0)
