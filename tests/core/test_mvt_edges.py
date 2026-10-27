"""Error and edge paths of the MVT decoder."""

import struct

import pytest

from custom_components.sunspots.core import mvt
from custom_components.sunspots.core.mvt import MvtError, decode_tile

from .mvt_encoder import encode_layer, field, varint, zigzag

SQUARE = [(0, 0), (100, 0), (100, 100), (0, 100)]  # positive area (y down)
HOLE = [(20, 20), (20, 80), (80, 80), (80, 20)]  # negative area


def _geom(*cmds: int) -> bytes:
    return b"".join(varint(c) for c in cmds)


def _layer(feature: bytes, keys=(), values=()) -> bytes:
    body = field(1, 2, b"L") + field(2, 2, feature)
    body += b"".join(field(3, 2, k.encode()) for k in keys)
    body += b"".join(field(4, 2, v) for v in values)
    return field(3, 2, body)


def _feature(geometry: bytes, tags: list[int] | None = None, gtype: int = 3) -> bytes:
    out = b""
    if tags is not None:
        out += field(2, 2, b"".join(varint(t) for t in tags))
    return out + field(3, 0, gtype) + field(4, 2, geometry)


@pytest.mark.parametrize(
    "data",
    [
        b"\x80",  # truncated varint key
        b"\x08\x80",  # truncated varint value (wire 0)
        b"\x1a\x05ab",  # length-delimited longer than the buffer
        b"\x09\x00\x00\x00",  # fixed64 truncated
        b"\x0d\x00\x00",  # fixed32 truncated
        b"\x0b",  # wire type 3 (start group) is unsupported
        b"\x08" + b"\xff" * 12 + b"\x01",  # varint too long
    ],
)
def test_malformed_wire_data_raises(data):
    with pytest.raises(MvtError):
        decode_tile(data)


def test_unknown_top_level_fields_are_skipped():
    tile = field(1, 2, b"x") + varint(9 << 3 | 1) + b"\0" * 8 + encode_layer("b", [({}, [SQUARE])])
    assert [layer.name for layer in decode_tile(tile)] == ["b"]


def test_bad_geometry_command_and_truncated_geometry():
    with pytest.raises(MvtError, match="bad geometry command"):
        decode_tile(_layer(_feature(_geom(3 | 1 << 3, 0, 0))))
    with pytest.raises(MvtError, match="truncated geometry"):
        decode_tile(_layer(_feature(_geom(1 | 2 << 3, 0, 0))))


def test_ring_too_large(monkeypatch):
    monkeypatch.setattr(mvt, "MAX_RING_POINTS", 3)
    geom = _geom(1 | 1 << 3, 0, 0, 2 | 3 << 3, 2, 0, 0, 2, 2, 0)
    with pytest.raises(MvtError, match="ring too large"):
        decode_tile(_layer(_feature(geom)))


def test_too_many_features(monkeypatch):
    monkeypatch.setattr(mvt, "MAX_FEATURES_PER_LAYER", 1)
    body = field(1, 2, b"L") + field(2, 2, _feature(b"")) * 2
    with pytest.raises(MvtError, match="too many features"):
        decode_tile(field(3, 2, body))


def test_tag_index_out_of_range():
    tile = _layer(_feature(_geom(), tags=[0, 5]), keys=["k"], values=[field(1, 2, b"v")])
    with pytest.raises(MvtError, match="tag index"):
        decode_tile(tile)
    tile = _layer(_feature(_geom(), tags=[3, 0]), keys=["k"], values=[field(1, 2, b"v")])
    with pytest.raises(MvtError, match="tag index"):
        decode_tile(tile)


def test_all_value_types():
    values = [
        field(1, 2, b"txt"),
        varint(2 << 3 | 5) + struct.pack("<f", 1.5),
        varint(3 << 3 | 1) + struct.pack("<d", 2.25),
        field(4, 0, (1 << 64) - 7),  # int64 -7
        field(4, 0, 7),
        field(5, 0, 42),  # uint
        field(6, 0, zigzag(-5)),  # sint
        field(7, 0, 1),
        field(7, 0, 0),
        field(15, 0, 1),  # unknown field only -> None
    ]
    keys = [f"k{i}" for i in range(len(values))]
    tags = [t for i in range(len(values)) for t in (i, i)]
    (layer,) = decode_tile(_layer(_feature(_geom(), tags=tags), keys=keys, values=values))
    props = layer.features[0].properties
    assert props == {
        "k0": "txt",
        "k1": 1.5,
        "k2": 2.25,
        "k3": -7,
        "k4": 7,
        "k5": 42,
        "k6": -5,
        "k7": True,
        "k8": False,
        "k9": None,
    }
    assert props["k7"] is True


def test_non_polygon_features_are_skipped():
    geom = _geom(1 | 1 << 3, 2, 2)
    for gtype in (1, 2):
        (layer,) = decode_tile(_layer(_feature(geom, gtype=gtype)))
        assert layer.features == []


def test_layer_defaults_and_no_geometry():
    body = field(2, 2, field(3, 0, 3))
    (layer,) = decode_tile(field(3, 2, body))
    assert (layer.name, layer.extent, layer.keys) == ("", 4096, [])
    assert layer.features[0].polygons == []


def test_zero_area_ring_skipped_and_short_ring_dropped():
    flat = [(0, 0), (10, 0), (20, 0)]  # collinear -> zero area
    two = [(0, 0), (5, 5)]  # fewer than 3 points
    (layer,) = decode_tile(encode_layer("b", [({}, [flat, two, SQUARE])]))
    assert layer.features[0].polygons == [[SQUARE]]


def test_interior_ring_first_becomes_own_polygon():
    (layer,) = decode_tile(encode_layer("b", [({}, [HOLE, SQUARE])]))
    assert layer.features[0].polygons == [[HOLE], [SQUARE]]


def test_hole_attaches_to_preceding_exterior():
    (layer,) = decode_tile(encode_layer("b", [({}, [SQUARE, HOLE])]))
    assert layer.features[0].polygons == [[SQUARE, HOLE]]


def test_ring_without_closepath_at_end_is_dropped_but_earlier_one_kept():
    # a new MoveTo flushes the first ring; the last ring has no ClosePath and is dropped.
    geom = _geom(
        1 | 1 << 3, 0, 0, 2 | 3 << 3, zigzag(100), 0, 0, zigzag(100), zigzag(-100), 0,
        1 | 1 << 3, zigzag(300), 0, 2 | 2 << 3, 2, 0, 0, 2,
    )  # fmt: skip
    (layer,) = decode_tile(_layer(_feature(geom)))
    assert len(layer.features[0].polygons) == 1
