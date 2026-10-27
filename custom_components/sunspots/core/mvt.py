"""Minimal Mapbox Vector Tile decoder (polygons and tags only, no dependencies)."""

from __future__ import annotations

import struct
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

from .geometry import signed_area

# Hard limits against hostile or corrupt input.
MAX_RING_POINTS = 200_000
MAX_FEATURES_PER_LAYER = 500_000

PixelRing = list[tuple[int, int]]
PixelPolygon = list[PixelRing]  # exterior first, then holes


class MvtError(ValueError):
    """Truncated or malformed vector tile."""


@dataclass(slots=True)
class MvtFeature:
    properties: dict[str, Any]
    polygons: list[PixelPolygon]  # tile pixel coordinates, y down


@dataclass(slots=True)
class MvtLayer:
    name: str
    extent: int
    keys: list[str]
    features: list[MvtFeature] = field(default_factory=list)


def _varint(buf: bytes, i: int) -> tuple[int, int]:
    shift = result = 0
    while True:
        if i >= len(buf):
            raise MvtError("truncated varint")
        b = buf[i]
        i += 1
        result |= (b & 0x7F) << shift
        if not b & 0x80:
            return result, i
        shift += 7
        if shift > 70:
            raise MvtError("varint too long")


def _fields(buf: bytes) -> Iterator[tuple[int, int, Any]]:
    i = 0
    n = len(buf)
    value: Any
    while i < n:
        key, i = _varint(buf, i)
        field_no, wire = key >> 3, key & 7
        if wire == 0:
            value, i = _varint(buf, i)
        elif wire == 2:
            length, i = _varint(buf, i)
            if i + length > n:
                raise MvtError("truncated field")
            value = buf[i : i + length]
            i += length
        elif wire == 1:
            if i + 8 > n:
                raise MvtError("truncated field")
            value = buf[i : i + 8]
            i += 8
        elif wire == 5:
            if i + 4 > n:
                raise MvtError("truncated field")
            value = buf[i : i + 4]
            i += 4
        else:
            raise MvtError(f"unsupported wire type {wire}")
        yield field_no, wire, value


def _packed(buf: bytes) -> list[int]:
    out: list[int] = []
    i = 0
    while i < len(buf):
        v, i = _varint(buf, i)
        out.append(v)
    return out


def _decode_value(buf: bytes) -> Any:
    for f, _, v in _fields(buf):
        if f == 1:
            return bytes(v).decode("utf-8", "replace")
        if f == 2:
            return struct.unpack("<f", v)[0]
        if f == 3:
            return struct.unpack("<d", v)[0]
        if f == 4:  # int64 (two's complement)
            return v - (1 << 64) if v >= 1 << 63 else v
        if f == 5:
            return v
        if f == 6:  # sint64 zigzag
            return (v >> 1) ^ -(v & 1)
        if f == 7:
            return bool(v)
    return None


def _zigzag(v: int) -> int:
    return (v >> 1) ^ -(v & 1)


def _polygons(commands: list[int]) -> list[PixelPolygon]:
    rings: list[PixelRing] = []
    current: PixelRing = []
    x = y = i = 0
    n = len(commands)
    while i < n:
        cmd, count = commands[i] & 7, commands[i] >> 3
        i += 1
        if cmd == 7:  # ClosePath
            if len(current) >= 3:
                rings.append(current)
            current = []
            continue
        if cmd not in (1, 2):
            raise MvtError(f"bad geometry command {cmd}")
        if i + 2 * count > n:
            raise MvtError("truncated geometry")
        for _ in range(count):
            x += _zigzag(commands[i])
            y += _zigzag(commands[i + 1])
            i += 2
            if cmd == 1:  # MoveTo starts a new ring
                if len(current) >= 3:
                    rings.append(current)
                current = []
            current.append((x, y))
            if len(current) > MAX_RING_POINTS:
                raise MvtError("ring too large")
    polygons: list[PixelPolygon] = []
    for ring in rings:
        # Spec: exterior rings have positive area in the y-down tile plane, interior negative.
        area = signed_area([(float(a), float(b)) for a, b in ring])
        if area == 0:
            continue
        if area > 0 or not polygons:
            polygons.append([ring])
        else:
            polygons[-1].append(ring)
    return polygons


def decode_tile(data: bytes) -> list[MvtLayer]:
    """Decode a (decompressed) vector tile into layers of polygon features."""
    layers: list[MvtLayer] = []
    for field_no, _, layer_buf in _fields(data):
        if field_no != 3:
            continue
        name = ""
        extent = 4096
        keys: list[str] = []
        values: list[Any] = []
        raw_features: list[bytes] = []
        for f, _, v in _fields(layer_buf):
            if f == 1:
                name = bytes(v).decode("utf-8", "replace")
            elif f == 2:
                raw_features.append(v)
                if len(raw_features) > MAX_FEATURES_PER_LAYER:
                    raise MvtError("too many features")
            elif f == 3:
                keys.append(bytes(v).decode("utf-8", "replace"))
            elif f == 4:
                values.append(_decode_value(v))
            elif f == 5:
                extent = int(v)
        layer = MvtLayer(name=name, extent=extent, keys=keys)
        for raw in raw_features:
            tags: list[int] = []
            gtype = 0
            geometry: list[int] = []
            for f, _, v in _fields(raw):
                if f == 2:
                    tags = _packed(v)
                elif f == 3:
                    gtype = int(v)
                elif f == 4:
                    geometry = _packed(v)
            if gtype != 3:  # polygons only
                continue
            try:
                props = {keys[tags[k]]: values[tags[k + 1]] for k in range(0, len(tags) - 1, 2)}
            except IndexError as err:
                raise MvtError("tag index out of range") from err
            layer.features.append(MvtFeature(props, _polygons(geometry)))
        layers.append(layer)
    return layers
