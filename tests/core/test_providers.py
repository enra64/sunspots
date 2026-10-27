import json

import pytest
from pmtiles.tile import Compression

from custom_components.sunspots.core.providers import overpass
from custom_components.sunspots.core.providers import overture_pmtiles as ov
from custom_components.sunspots.core.providers.base import Chunk, ProviderSchemaError

from .fakes import FIXTURE, RELEASE, FakeFetcher, build_archive
from .mvt_encoder import encode_layer

X, Y = 8802, 5370


async def test_latest_release_and_fetch_tile_roundtrip():
    fetcher = FakeFetcher(build_archive({(X, Y): FIXTURE.read_bytes()}))
    provider = ov.OvertureProvider(fetcher)
    release = await provider.latest_release()
    assert release == RELEASE
    chunk = await provider.fetch_chunk(release, X, Y)
    assert chunk.key == "ov-14-8802-5370" and chunk.release == RELEASE
    assert len(chunk.features) > 1000
    assert any(f.kind == "part" and f.parent_id for f in chunk.features)
    # serialisation roundtrip keeps features
    again = Chunk.from_dict(json.loads(json.dumps(chunk.to_dict())))
    assert len(again.features) == len(chunk.features)
    assert again.features[5].props == chunk.features[5].props
    # header + root directory + tile = 3 requests, a second tile adds only the tile fetch
    assert len(fetcher.requests) == 4  # STAC + header + directory + tile


async def test_missing_tile_gives_empty_chunk():
    fetcher = FakeFetcher(build_archive({(X, Y): FIXTURE.read_bytes()}))
    chunk = await ov.OvertureProvider(fetcher).fetch_chunk(RELEASE, X + 5, Y)
    assert chunk.features == []


async def test_uncompressed_tiles_with_gzip_directories_ok():
    fetcher = FakeFetcher(
        build_archive({(X, Y): FIXTURE.read_bytes()}, compression=Compression.NONE)
    )
    chunk = await ov.OvertureProvider(fetcher).fetch_chunk(RELEASE, X, Y)
    assert chunk.features


async def test_low_max_zoom_fails_clearly():
    fetcher = FakeFetcher(build_archive({(X, Y): FIXTURE.read_bytes()}, max_zoom=13))
    with pytest.raises(ProviderSchemaError, match="max_zoom"):
        await ov.OvertureProvider(fetcher).fetch_chunk(RELEASE, X, Y)


async def test_missing_attributes_fail_clearly():
    tile = encode_layer(
        "building", [({"id": "a", "foo": 1}, [[(0, 0), (10, 0), (10, 10), (0, 10)]])]
    )
    fetcher = FakeFetcher(build_archive({(X, Y): tile}))
    with pytest.raises(ProviderSchemaError, match="attributes"):
        await ov.OvertureProvider(fetcher).fetch_chunk(RELEASE, X, Y)


async def test_not_a_pmtiles_file_and_bad_stac():
    fetcher = FakeFetcher(b"x" * 500)
    with pytest.raises(ProviderSchemaError):
        await ov.OvertureProvider(fetcher).fetch_chunk(RELEASE, X, Y)

    class BadStac(FakeFetcher):
        async def get(self, url, **kw):
            return b'{"nope": 1}'

    with pytest.raises(ProviderSchemaError):
        await ov.OvertureProvider(BadStac(b"")).latest_release()


def test_decompression_bomb_is_rejected():
    import gzip

    bomb = gzip.compress(b"\0" * (2 * 1024 * 1024))
    with pytest.raises(ProviderSchemaError):
        ov._decompress(bomb, Compression.GZIP, 1024 * 1024)


def test_keys_for_radius_covers_tiles():
    keys = ov.keys_for(52.5520183, 13.4191958, 250)
    assert ("ov-14-8802-5370", 8802, 5370) in keys
    assert 1 <= len(keys) <= 4


OVERPASS_PAYLOAD = {
    "elements": [
        {
            "type": "way",
            "id": 1,
            "tags": {"building": "house", "height": "9.5 m", "building:levels": "3"},
            "geometry": [
                {"lat": 52.0, "lon": 13.0},
                {"lat": 52.0, "lon": 13.001},
                {"lat": 52.001, "lon": 13.001},
                {"lat": 52.0, "lon": 13.0},
            ],
        },
        {
            "type": "way",
            "id": 2,
            "tags": {"building": "yes", "location": "underground"},
            "geometry": [
                {"lat": 52.0, "lon": 13.0},
                {"lat": 52.0, "lon": 13.001},
                {"lat": 52.001, "lon": 13.0},
            ],
        },
        {
            "type": "way",
            "id": 3,
            "tags": {"building": "yes", "layer": "-1"},
            "geometry": [
                {"lat": 52.0, "lon": 13.0},
                {"lat": 52.0, "lon": 13.001},
                {"lat": 52.001, "lon": 13.0},
            ],
        },
        {
            "type": "relation",
            "id": 4,
            "tags": {"building": "apartments", "building:height": "20"},
            "members": [
                {
                    "type": "way",
                    "role": "outer",
                    "geometry": [
                        {"lat": 52.0, "lon": 13.0},
                        {"lat": 52.0, "lon": 13.01},
                        {"lat": 52.01, "lon": 13.01},
                    ],
                },
                {
                    "type": "way",
                    "role": "outer",
                    "geometry": [
                        {"lat": 52.01, "lon": 13.01},
                        {"lat": 52.01, "lon": 13.0},
                        {"lat": 52.0, "lon": 13.0},
                    ],
                },
                {
                    "type": "way",
                    "role": "inner",
                    "geometry": [
                        {"lat": 52.004, "lon": 13.004},
                        {"lat": 52.004, "lon": 13.006},
                        {"lat": 52.006, "lon": 13.006},
                        {"lat": 52.004, "lon": 13.004},
                    ],
                },
            ],
        },
    ]
}


def test_parse_overpass():
    feats = overpass.parse_overpass(OVERPASS_PAYLOAD)
    by_id = {f.id: f for f in feats}
    assert set(by_id) == {"w1", "w3", "r4"}
    assert by_id["w1"].props["height"] == 9.5 and by_id["w1"].props["num_floors"] == 3
    assert by_id["w1"].props["class"] == "house" and not by_id["w1"].props["is_underground"]
    assert by_id["w3"].props["is_underground"] is True
    r4 = by_id["r4"]
    assert r4.props["height"] == 20.0 and len(r4.polygons) == 1 and len(r4.polygons[0]) == 2


def test_parse_overpass_rejects_garbage():
    with pytest.raises(ProviderSchemaError):
        overpass.parse_overpass({"remark": "runtime error"})


async def test_overpass_fetch_posts_query_and_returns_chunk():
    fetcher = FakeFetcher(b"")
    fetcher.post_response = json.dumps(OVERPASS_PAYLOAD).encode()
    chunk = await overpass.OverpassProvider(fetcher).fetch_chunk(52.0, 13.0, 250)
    assert chunk.provider == "overpass" and chunk.release is None
    assert chunk.key == "op-52.0000-13.0000-250"
    url, data = fetcher.posted[0]
    assert url == overpass.OVERPASS_URL and "around:250,52.000000,13.000000" in data
    assert "OpenStreetMap" in chunk.attribution and "Overture" not in chunk.attribution
