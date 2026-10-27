"""Tiny MVT encoder for tests (polygons only)."""

from __future__ import annotations

import struct
from typing import Any


def varint(n: int) -> bytes:
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def field(no: int, wire: int, payload: bytes | int) -> bytes:
    key = varint(no << 3 | wire)
    if wire == 0:
        assert isinstance(payload, int)
        return key + varint(payload)
    assert isinstance(payload, bytes)
    return key + varint(len(payload)) + payload


def zigzag(v: int) -> int:
    return (v << 1) ^ (v >> 63)


def encode_rings(rings: list[list[tuple[int, int]]]) -> list[int]:
    cmds: list[int] = []
    x = y = 0
    for ring in rings:
        cmds += [1 | 1 << 3]
        (px, py) = ring[0]
        cmds += [zigzag(px - x), zigzag(py - y)]
        x, y = px, py
        cmds += [2 | (len(ring) - 1) << 3]
        for px, py in ring[1:]:
            cmds += [zigzag(px - x), zigzag(py - y)]
            x, y = px, py
        cmds += [7 | 1 << 3]
    return cmds


def encode_value(v: Any) -> bytes:
    if isinstance(v, bool):
        return field(7, 0, int(v))
    if isinstance(v, str):
        return field(1, 2, v.encode())
    if isinstance(v, float):
        return field(3, 2, struct.pack("<d", v)) if False else key_double(v)
    if isinstance(v, int):
        return field(4, 0, v if v >= 0 else v + (1 << 64))
    raise TypeError(v)


def key_double(v: float) -> bytes:
    return varint(3 << 3 | 1) + struct.pack("<d", v)


def encode_layer(
    name: str,
    features: list[tuple[dict[str, Any], list[list[tuple[int, int]]]]],
    extent: int = 4096,
) -> bytes:
    keys: list[str] = []
    values: list[bytes] = []
    feats = b""
    for props, rings in features:
        tags: list[int] = []
        for k, v in props.items():
            if k not in keys:
                keys.append(k)
            ev = encode_value(v)
            if ev not in values:
                values.append(ev)
            tags += [keys.index(k), values.index(ev)]
        geom = b"".join(varint(c) for c in encode_rings(rings))
        feat = field(2, 2, b"".join(varint(t) for t in tags)) + field(3, 0, 3) + field(4, 2, geom)
        feats += field(2, 2, feat)
    body = field(1, 2, name.encode()) + feats
    body += b"".join(field(3, 2, k.encode()) for k in keys)
    body += b"".join(field(4, 2, v) for v in values)
    body += field(5, 0, extent) + field(15, 0, 2)
    return field(3, 2, body)
