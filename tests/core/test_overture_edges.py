"""Error and edge paths of the Overture PMTiles provider."""

import gzip

import pytest
from pmtiles.tile import Compression, Entry, TileType, deserialize_header

from custom_components.sunspots.core.providers import overture_pmtiles as ov
from custom_components.sunspots.core.providers.base import ProviderSchemaError

from .fakes import RELEASE, FakeFetcher, build_archive
from .mvt_encoder import encode_layer

X, Y = 8802, 5370
SQUARE = [(0, 0), (100, 0), (100, 100), (0, 100)]
GOOD_TILE = encode_layer("building", [({"id": "a", "height": 3.0}, [SQUARE])])


def patched(archive: bytes, **byte_at: int) -> bytes:
    data = bytearray(archive)
    offsets = {"internal_compression": 97, "tile_compression": 98, "tile_type": 99}
    for name, value in byte_at.items():
        data[offsets[name]] = value
    return bytes(data)


def provider(archive: bytes) -> ov.OvertureProvider:
    return ov.OvertureProvider(FakeFetcher(archive))


def test_decompress_none_over_limit_and_unsupported():
    assert ov._decompress(b"abc", Compression.NONE, 3) == b"abc"
    with pytest.raises(ProviderSchemaError, match="larger than limit"):
        ov._decompress(b"abcd", Compression.NONE, 3)
    with pytest.raises(ProviderSchemaError, match="unsupported compression"):
        ov._decompress(b"abc", Compression.ZSTD, 100)
    with pytest.raises(ProviderSchemaError, match="corrupt gzip"):
        ov._decompress(b"not gzip at all", Compression.GZIP, 100)


@pytest.mark.parametrize("release", ["../../evil", "2026 10", "", 5, None, ["a"]])
async def test_bad_release_id_is_rejected(release):
    fetcher = FakeFetcher(b"", release=release)
    with pytest.raises(ProviderSchemaError):
        await ov.OvertureProvider(fetcher).latest_release()


async def test_stac_not_json_is_rejected():
    class Garbage(FakeFetcher):
        async def get(self, url, **kw):
            return b"<html>"

    with pytest.raises(ProviderSchemaError, match="latest"):
        await ov.OvertureProvider(Garbage(b"")).latest_release()


async def test_non_mvt_archive_rejected():
    archive = patched(build_archive({(X, Y): GOOD_TILE}), tile_type=TileType.PNG.value)
    with pytest.raises(ProviderSchemaError, match="vector tiles"):
        await provider(archive).fetch_chunk(RELEASE, X, Y)


async def test_unsupported_internal_compression_rejected():
    archive = patched(build_archive({(X, Y): GOOD_TILE}), internal_compression=1)
    with pytest.raises(ProviderSchemaError, match="directory compression"):
        await provider(archive).fetch_chunk(RELEASE, X, Y)


async def test_corrupt_directory_bytes():
    archive = build_archive({(X, Y): GOOD_TILE})
    header = deserialize_header(archive[:127])
    start = header["root_offset"]
    end = start + header["root_length"]
    broken = archive[:start] + b"\xde\xad" * ((end - start) // 2 + 1) + archive[end:]
    with pytest.raises(ProviderSchemaError, match="corrupt directory"):
        await provider(broken[: len(archive)]).fetch_chunk(RELEASE, X, Y)


def _leaf_provider(levels: int, archive: bytes) -> ov.OvertureProvider:
    """Provider whose directories point to leaf directories ``levels`` times, then to the tile."""
    prov = provider(archive)
    real = prov._directory
    calls: list[tuple[int, int]] = []

    async def fake_directory(url, offset, length):
        calls.append((offset, length))
        if len(calls) <= levels:
            return [Entry(0, 1000 + len(calls), 7, 0)]  # run_length 0 -> leaf pointer
        return await real(url, *header_root)

    header = deserialize_header(archive[:127])
    header_root = (header["root_offset"], header["root_length"])
    prov._directory = fake_directory  # type: ignore[method-assign]
    prov.calls = calls  # type: ignore[attr-defined]
    return prov


async def test_leaf_directories_are_followed():
    archive = build_archive({(X, Y): GOOD_TILE})
    prov = _leaf_provider(2, archive)
    chunk = await prov.fetch_chunk(RELEASE, X, Y)
    assert [f.id for f in chunk.features] == ["a"]
    leaf_base = deserialize_header(archive[:127])["leaf_directory_offset"]
    assert prov.calls[1] == (leaf_base + 1001, 7)  # type: ignore[attr-defined]


async def test_directory_nesting_too_deep():
    prov = _leaf_provider(10, build_archive({(X, Y): GOOD_TILE}))
    with pytest.raises(ProviderSchemaError, match="nesting too deep"):
        await prov.fetch_chunk(RELEASE, X, Y)


def test_parse_tile_skips_features_without_string_id_and_other_layers():
    tile = (
        encode_layer(
            "building",
            [
                ({"id": 17, "height": 3.0}, [SQUARE]),  # int id -> skipped
                ({"height": 3.0}, [SQUARE]),  # no id -> skipped
                ({"id": "keep", "height": 3.0, "num_floors": 2}, [SQUARE]),
            ],
        )
        + encode_layer("building_part", [({"id": "p1", "building_id": 5, "height": 2.0}, [SQUARE])])
        + encode_layer("place", [({"id": "x", "height": 1.0}, [SQUARE])])
        + encode_layer(
            "building_part", [({"id": "p2", "building_id": "keep", "height": 2.0}, [SQUARE])]
        )
    )
    chunk = ov.parse_tile(tile, X, Y, RELEASE, "now")
    got = {f.id: (f.kind, f.parent_id, f.props) for f in chunk.features}
    assert set(got) == {"keep", "p1", "p2"}
    assert got["keep"][2] == {"height": 3.0, "num_floors": 2}
    assert got["p1"][:2] == ("part", None)  # non string building_id ignored
    assert got["p2"][:2] == ("part", "keep")
    assert chunk.key == "ov-14-8802-5370" and chunk.release == RELEASE


async def test_malformed_mvt_inside_valid_gzip_tile():
    archive = build_archive({(X, Y): b"\x0b\x01\x02"})  # wire type 3 -> MvtError
    with pytest.raises(ProviderSchemaError, match="malformed tile"):
        await provider(archive).fetch_chunk(RELEASE, X, Y)


async def test_corrupt_gzip_tile_data():
    archive = build_archive({(X, Y): GOOD_TILE})
    assert gzip.compress(GOOD_TILE) in archive
    broken = archive.replace(gzip.compress(GOOD_TILE), b"\x00" * len(gzip.compress(GOOD_TILE)))
    with pytest.raises(ProviderSchemaError, match="corrupt gzip"):
        await provider(broken).fetch_chunk(RELEASE, X, Y)


async def test_directories_and_header_are_cached():
    fetcher = FakeFetcher(build_archive({(X, Y): GOOD_TILE, (X + 1, Y): GOOD_TILE}))
    prov = ov.OvertureProvider(fetcher)
    await prov.fetch_chunk(RELEASE, X, Y)
    first = len(fetcher.requests)
    await prov.fetch_chunk(RELEASE, X + 1, Y)
    assert len(fetcher.requests) == first + 1  # only the tile itself
