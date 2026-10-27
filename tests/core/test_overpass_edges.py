"""Edge cases of the Overpass parser and provider."""

import pytest

from custom_components.sunspots.core.providers import overpass
from custom_components.sunspots.core.providers.base import ProviderSchemaError

from .fakes import FakeFetcher

P = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]


def geom(*pts):
    return [{"lat": lat, "lon": lon} for lon, lat in pts]


def way(id_, tags, *pts):
    return {"type": "way", "id": id_, "tags": tags, "geometry": geom(*pts)}


def parse(*elements):
    return overpass.parse_overpass({"elements": list(elements)})


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("12", 12.0),
        ("12,5 m", 12.5),
        ("3 meters", 3.0),
        ("7.25 Metres", 7.25),
        (" 4m ", 4.0),
        ("garbage", None),
        ("12 ft", None),
        ("-3", None),
        ("0", None),
        ("", None),
        (12, None),
        (None, None),
    ],
)
def test_parse_height_variants(raw, expected):
    assert overpass._parse_height(raw) == expected


def test_height_falls_back_to_building_height_and_levels_min_height():
    (f,) = parse(
        way(
            1,
            {
                "building": "house",
                "height": "nope",
                "building:height": "9,5",
                "building:levels": "3",
                "min_height": "2 m",
            },
            *P,
        )
    )
    assert f.props == {
        "is_underground": False,
        "height": 9.5,
        "num_floors": 3.0,
        "min_height": 2.0,
        "class": "house",
    }
    assert f.id == "w1"


def test_generic_building_value_has_no_class_and_layer_handling():
    (f,) = parse(way(1, {"building": "yes", "layer": "-1"}, *P))
    assert "class" not in f.props and f.props["is_underground"] is True
    (f,) = parse(way(2, {"building": "yes", "layer": "one"}, *P))
    assert f.props["is_underground"] is False  # non numeric layer ignored


def test_skipped_elements():
    elements = [
        way(1, {"building": "no"}, *P),
        way(2, {"building": "yes", "location": "underground"}, *P),
        {"type": "node", "id": 3, "lat": 0, "lon": 0},
        way(4, {"building": "yes"}, *P[:2]),  # fewer than 3 points
        {"type": "way", "id": 5, "tags": {"building": "yes"}},  # no geometry
    ]
    assert parse(*elements) == []


def test_closed_way_drops_duplicate_end_point():
    (f,) = parse(way(1, {"building": "yes"}, *P, P[0]))
    assert f.polygons == [[P]]


@pytest.mark.parametrize(
    "fragments",
    [
        # current = last fragment [p1,p2]; each case hits one endpoint rule
        [[P[2], P[3], P[0]], [P[0], P[1]], [P[1], P[2]]],  # other[0] == current[-1]
        [[P[3], P[2]], [P[3], P[0], P[1]], [P[1], P[2]]],  # other[-1] == current[-1]
        [[P[0], P[1]], [P[2], P[3], P[0]], [P[1], P[2]]],  # other[-1] == current[0]
        [[P[1], P[0]], [P[2], P[3], P[0]], [P[1], P[2]]],  # other[0] == current[0]
    ],
)
def test_open_way_fragments_are_joined(fragments):
    members = [{"type": "way", "role": "outer", "geometry": geom(*frag)} for frag in fragments]
    (f,) = parse({"type": "relation", "id": 9, "tags": {"building": "yes"}, "members": members})
    assert f.id == "r9"
    ((ring,),) = f.polygons
    assert len(ring) == 4 and set(ring) == set(P)


def test_unclosable_fragments_are_dropped():
    members = [
        {"type": "way", "role": "outer", "geometry": geom(P[0], P[1], P[2])},
        {"type": "way", "role": "outer", "geometry": geom((5.0, 5.0), (6.0, 6.0))},
    ]
    rel = {"type": "relation", "id": 1, "tags": {"building": "yes"}, "members": members}
    assert parse(rel) == []


def test_relation_with_inner_rings_only_yields_nothing_and_holes_attach_to_outer():
    inner = {"type": "way", "role": "inner", "geometry": geom(*P, P[0])}
    outer_pts = [(-5.0, -5.0), (5.0, -5.0), (5.0, 5.0), (-5.0, 5.0)]
    outer = {"type": "way", "role": "outer", "geometry": geom(*outer_pts, outer_pts[0])}
    junk = [{"type": "node", "role": "outer"}, {"type": "way", "role": "outer"}]
    tags = {"building": "yes"}
    assert parse({"type": "relation", "id": 1, "tags": tags, "members": [inner]}) == []
    (f,) = parse({"type": "relation", "id": 2, "tags": tags, "members": [inner, outer, *junk]})
    assert len(f.polygons) == 1 and len(f.polygons[0]) == 2


def test_missing_elements_key_rejected():
    with pytest.raises(ProviderSchemaError):
        overpass.parse_overpass({})


def test_query_and_chunk_key():
    q = overpass.build_query(52.5, 13.25, 300.9)
    assert "around:300,52.500000,13.250000" in q and q.startswith("[out:json]")
    assert overpass.chunk_key(52.5, 13.25, 300.9) == "op-52.5000-13.2500-300"


async def test_invalid_json_from_provider_is_schema_error():
    fetcher = FakeFetcher(b"")
    fetcher.post_response = b"<html>rate limited</html>"
    with pytest.raises(ProviderSchemaError, match="invalid JSON"):
        await overpass.OverpassProvider(fetcher).fetch_chunk(52.0, 13.0, 100)
