import contextlib
from pathlib import Path

import pytest

from custom_components.sunspots.core.geometry import signed_area
from custom_components.sunspots.core.mvt import MvtError, decode_tile

from .mvt_encoder import encode_layer

FIXTURE = Path(__file__).parents[1] / "fixtures" / "overture_buildings_z14_8802_5370.mvt"


def test_fixture_tile_decodes():
    layers = {layer.name: layer for layer in decode_tile(FIXTURE.read_bytes())}
    assert set(layers) == {"building", "building_part"}
    b = layers["building"]
    assert b.extent == 4096
    assert len(b.features) > 1000
    assert {"height", "num_floors", "class", "id", "has_parts"} <= set(b.keys)
    for f in b.features:
        assert isinstance(f.properties["id"], str)
        for poly in f.polygons:
            assert signed_area([(float(x), float(y)) for x, y in poly[0]]) > 0  # exterior positive
            for hole in poly[1:]:
                assert signed_area([(float(x), float(y)) for x, y in hole]) < 0
    assert any(len(p) > 1 for f in b.features for p in f.polygons)  # real courtyards exist
    parts = layers["building_part"].features
    assert parts and "building_id" in parts[0].properties


def test_truncated_input_only_raises_mvt_error():
    data = FIXTURE.read_bytes()
    for cut in (1, 5, 100, 4097, len(data) // 2, len(data) - 1):
        with contextlib.suppress(MvtError):
            decode_tile(data[:cut])


def test_garbage_raises_mvt_error():
    with pytest.raises(MvtError):
        decode_tile(b"\x1a\xff\xff\xff\xff\xff\xff\xff\xff\xff\xff\x01")


def test_hand_built_tile_rings_values_and_buffer():
    exterior = [(0, 0), (100, 0), (100, 100), (0, 100)]  # y-down: positive area
    hole = [(20, 20), (20, 80), (80, 80), (80, 20)]  # negative area
    buffered = [(-50, -50), (-10, -50), (-10, -10), (-50, -10)]  # outside [0, extent]
    tile = encode_layer(
        "building",
        [
            (
                {
                    "id": "a",
                    "height": 12.5,
                    "num_floors": 4,
                    "has_parts": False,
                    "class": "house",
                    "min_height": -1,
                },
                [exterior, hole],
            ),
            ({"id": "b"}, [buffered]),
        ],
        extent=2048,
    )
    (layer,) = decode_tile(tile)
    assert layer.extent == 2048
    a, b = layer.features
    assert a.properties == {
        "id": "a",
        "height": 12.5,
        "num_floors": 4,
        "has_parts": False,
        "class": "house",
        "min_height": -1,
    }
    assert len(a.polygons) == 1 and len(a.polygons[0]) == 2
    assert b.polygons[0][0][0] == (-50, -50)
