#!/usr/bin/env python3
"""Phase 0 probe: can Overture's buildings.pmtiles power Sunspots?

Standalone (stdlib + `pmtiles`). Run where Overture's S3 bucket is reachable:

    pip install pmtiles==3.8.1
    python tools/probe_pmtiles.py                       # built-in test locations
    python tools/probe_pmtiles.py --loc "Home=52.52,13.41" --radius 250
    python tools/probe_pmtiles.py --save-tile tests/fixtures --json out.json

For each location it measures requests / bytes / latency / decode time, which
attributes exist, header max_zoom, compression, ring orientation, and the
skyline-weighted real-height coverage metric (spec 4.2).

This is a throwaway measurement tool: the decoder and horizon code here are
deliberately simple and are NOT the Phase 1 implementation.
Data: (c) OpenStreetMap contributors, Overture Maps Foundation (ODbL).
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import statistics
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

from pmtiles.tile import (
    Compression,
    deserialize_directory,
    deserialize_header,
    find_tile,
    zxy_to_tileid,
)

STAC = "https://stac.overturemaps.org/catalog.json"
TILE_URL = "https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/{release}/buildings.pmtiles"
ZOOM = 14
R_EARTH = 6_371_000.0
UA = "Sunspots-probe/0 (+https://github.com/enra64/sunspots)"
LOW_COVERAGE_THRESHOLD = 0.30
FLOOR_HEIGHT = 3.2
GLOBAL_DEFAULT = 12.0
OBSERVER_HEIGHT = 1.2

LOCATIONS = {
    "Berlin (Cafe Schneiderei)": (52.5520183, 13.4191958),
    "Berlin Mitte": (52.5200, 13.4050),
    "Munich Marienplatz": (48.1374, 11.5755),
    "Paris Marais": (48.8566, 2.3522),
    "Portland OR (US mid-size)": (45.5152, -122.6784),
    "Small town: Quedlinburg": (51.7886, 11.1437),
}


# --------------------------------------------------------------------- HTTP
class Http:
    def __init__(self) -> None:
        self.requests = 0
        self.bytes = 0
        self.latencies: list[float] = []

    def get(self, url: str, start: int | None = None, length: int | None = None) -> bytes:
        headers = {"User-Agent": UA}
        if start is not None:
            headers["Range"] = f"bytes={start}-{start + length - 1}"
        req = urllib.request.Request(url, headers=headers)
        t0 = time.perf_counter()
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        self.latencies.append(time.perf_counter() - t0)
        self.requests += 1
        self.bytes += len(data)
        time.sleep(1.0)  # etiquette: <= 1 request/s
        return data


class Archive:
    """Minimal PMTiles reader with cached header and request accounting."""

    def __init__(self, url: str, http: Http) -> None:
        self.url, self.http = url, http
        self.header = deserialize_header(http.get(url, 0, 127))
        self.dir_cache: dict[tuple[int, int], list] = {}

    def _directory(self, offset: int, length: int):
        key = (offset, length)
        if key not in self.dir_cache:
            raw = self.http.get(self.url, offset, length)
            self.dir_cache[key] = deserialize_directory(raw)
        return self.dir_cache[key]

    def tile(self, z: int, x: int, y: int) -> bytes | None:
        h = self.header
        tid = zxy_to_tileid(z, x, y)
        off, ln = h["root_offset"], h["root_length"]
        for _ in range(4):
            entry = find_tile(self._directory(off, ln), tid)
            if entry is None:
                return None
            if entry.run_length == 0:
                off, ln = h["leaf_directory_offset"] + entry.offset, entry.length
                continue
            raw = self.http.get(self.url, h["tile_data_offset"] + entry.offset, entry.length)
            comp = h["tile_compression"]
            if comp == Compression.GZIP:
                return gzip.decompress(raw)
            if comp == Compression.NONE:
                return raw
            raise RuntimeError(f"unsupported tile compression {comp}")
        raise RuntimeError("directory depth exceeded")


# ---------------------------------------------------------------- MVT decode
def _varint(buf: bytes, i: int) -> tuple[int, int]:
    shift = result = 0
    while True:
        b = buf[i]
        i += 1
        result |= (b & 0x7F) << shift
        if not b & 0x80:
            return result, i
        shift += 7


def _fields(buf: bytes):
    i = 0
    while i < len(buf):
        key, i = _varint(buf, i)
        field, wt = key >> 3, key & 7
        if wt == 0:
            v, i = _varint(buf, i)
        elif wt == 2:
            n, i = _varint(buf, i)
            v = buf[i : i + n]
            i += n
        elif wt == 1:
            v = buf[i : i + 8]
            i += 8
        elif wt == 5:
            v = buf[i : i + 4]
            i += 4
        else:
            raise ValueError(f"bad wire type {wt}")
        yield field, wt, v


def _packed(buf: bytes) -> list[int]:
    out, i = [], 0
    while i < len(buf):
        v, i = _varint(buf, i)
        out.append(v)
    return out


def _value(buf: bytes):
    import struct

    for f, _wt, v in _fields(buf):
        if f == 1:
            return v.decode("utf-8", "replace")
        if f == 2:
            return struct.unpack("<f", v)[0]
        if f == 3:
            return struct.unpack("<d", v)[0]
        if f == 4:
            return v - (1 << 64) if v >= 1 << 63 else v
        if f == 5:
            return v
        if f == 6:
            return (v >> 1) ^ -(v & 1)
        if f == 7:
            return bool(v)
    return None


def decode_tile(buf: bytes) -> dict[str, dict]:
    """-> {layer: {extent, features: [(id, props, polygons)]}}; polygon = [ring,...] in tile px."""
    layers = {}
    for f, _, lbuf in _fields(buf):
        if f != 3:
            continue
        name, extent, keys, vals, feats = "", 4096, [], [], []
        for lf, _, v in _fields(lbuf):
            if lf == 1:
                name = v.decode()
            elif lf == 2:
                feats.append(v)
            elif lf == 3:
                keys.append(v.decode())
            elif lf == 4:
                vals.append(_value(v))
            elif lf == 5:
                extent = v
        out = []
        for fb in feats:
            fid, tags, gtype, geom = None, [], 0, []
            for ff, _, v in _fields(fb):
                if ff == 1:
                    fid = v
                elif ff == 2:
                    tags = _packed(v)
                elif ff == 3:
                    gtype = v
                elif ff == 4:
                    geom = _packed(v)
            if gtype != 3:
                continue
            props = {keys[tags[k]]: vals[tags[k + 1]] for k in range(0, len(tags) - 1, 2)}
            out.append((fid, props, _polygons(geom)))
        layers[name] = {"extent": extent, "features": out}
    return layers


def _signed_area(ring) -> float:
    return (
        sum(
            ring[i][0] * ring[(i + 1) % len(ring)][1] - ring[(i + 1) % len(ring)][0] * ring[i][1]
            for i in range(len(ring))
        )
        / 2
    )


def _polygons(geom: list[int]):
    rings, cur, x, y, i = [], [], 0, 0, 0
    while i < len(geom):
        cmd, count = geom[i] & 7, geom[i] >> 3
        i += 1
        if cmd == 7:
            if len(cur) >= 3:
                rings.append(cur)
            cur = []
            continue
        for _ in range(count):
            dx, dy = geom[i], geom[i + 1]
            i += 2
            x += (dx >> 1) ^ -(dx & 1)
            y += (dy >> 1) ^ -(dy & 1)
            if cmd == 1 and cur:
                rings.append(cur) if len(cur) >= 3 else None
                cur = []
            cur.append((x, y))
    polys: list[list] = []
    for r in rings:
        if _signed_area(r) > 0 or not polys:  # spec: exterior positive in y-down tile space
            polys.append([r])
        else:
            polys[-1].append(r)
    return polys


# ------------------------------------------------------------------ geometry
def tile_of(lat: float, lon: float, z: int) -> tuple[float, float]:
    n = 1 << z
    x = (lon + 180) / 360 * n
    lr = math.radians(lat)
    y = (1 - math.asinh(math.tan(lr)) / math.pi) / 2 * n
    return x, y


def tile_px_to_lonlat(z, tx, ty, px, py, extent):
    n = 1 << z
    lon = (tx + px / extent) / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty + py / extent) / n))))
    return lon, lat


def tiles_for(lat, lon, radius, z):
    dlat = math.degrees(radius / R_EARTH)
    dlon = dlat / math.cos(math.radians(lat))
    x0, y1 = tile_of(lat - dlat, lon - dlon, z)
    x1, y0 = tile_of(lat + dlat, lon + dlon, z)
    return [
        (int(x), int(y)) for x in range(int(x0), int(x1) + 1) for y in range(int(y0), int(y1) + 1)
    ]


def to_local(lat0, lon0, lon, lat):
    return (
        R_EARTH * math.radians(lon - lon0) * math.cos(math.radians(lat0)),
        R_EARTH * math.radians(lat - lat0),
    )


def point_in_ring(px, py, ring):
    inside = False
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


CLASS_DEFAULTS = {
    "garage": 3,
    "shed": 3,
    "carport": 3,
    "house": 8,
    "detached": 8,
    "semidetached_house": 8,
    "terrace": 9,
    "apartments": 15,
    "residential": 15,
    "commercial": 15,
    "office": 15,
    "retail": 15,
    "church": 20,
    "cathedral": 20,
    "warehouse": 8,
    "industrial": 8,
}


def resolve_height(p):
    """-> (height_m, source)"""
    h = p.get("height")
    if isinstance(h, (int, float)) and h > 0:
        return float(h), "height"
    nf = p.get("num_floors")
    if isinstance(nf, (int, float)) and nf > 0:
        return nf * FLOOR_HEIGHT, "floors"
    for k in ("class", "subtype"):
        if p.get(k) in CLASS_DEFAULTS:
            return float(CLASS_DEFAULTS[p[k]]), "class"
    return GLOBAL_DEFAULT, "default"


# --------------------------------------------------------------- horizon (probe)
def horizon_with_limiters(buildings, bins=720):
    """buildings: [(rings_local, H_eff, explicit)] -> (horizon deg list, limiter explicit flag list)"""
    hor = [0.0] * bins
    lim = [None] * bins
    step = 360.0 / bins
    for rings, h_eff, explicit in buildings:
        for ring in rings:
            for k in range(len(ring)):
                (px, py), (qx, qy) = ring[k], ring[(k + 1) % len(ring)]
                if px == qx and py == qy:
                    continue
                tp = math.degrees(math.atan2(px, py)) % 360
                tq = math.degrees(math.atan2(qx, qy)) % 360
                d = (tq - tp + 180) % 360 - 180
                if abs(abs(d) - 180) < 1e-6:
                    continue
                a0, a1 = (tp, tp + d) if d >= 0 else (tp + d, tp)
                for b in range(math.floor(a0 / step), math.floor(a1 / step) + 1):
                    az = min(max((b + 0.5) * step, a0), a1)
                    ux, uy = math.sin(math.radians(az)), math.cos(math.radians(az))
                    ex, ey = qx - px, qy - py
                    den = ux * ey - uy * ex
                    if abs(den) < 1e-12:
                        continue
                    t = (px * ey - py * ex) / den
                    dist = t
                    if dist < 1.0:
                        continue
                    ang = math.degrees(math.atan2(h_eff, dist))
                    bi = b % bins
                    if ang > hor[bi]:
                        hor[bi], lim[bi] = ang, explicit
    return hor, lim


def coverage_metric(hor, lim):
    sel = [lim[i] for i in range(len(hor)) if hor[i] > 2.0]
    return (sum(1 for v in sel if v) / len(sel)) if sel else None


# --------------------------------------------------------------------- probe
def resolve_release(http: Http) -> str:
    return json.loads(http.get(STAC))["latest"]


def probe_location(name, lat, lon, radius, arch, save_dir):
    http = arch.http
    r0, b0, l0 = http.requests, http.bytes, len(http.latencies)
    t_fetch = time.perf_counter()
    tiles = tiles_for(lat, lon, radius, ZOOM)
    raws = []
    for tx, ty in tiles:
        raw = arch.tile(ZOOM, tx, ty)
        raws.append((tx, ty, raw))
    fetch_s = time.perf_counter() - t_fetch - 1.0 * (http.requests - r0)  # minus the polite sleeps
    lat_s = http.latencies[l0:]
    res = {
        "name": name,
        "lat": lat,
        "lon": lon,
        "tiles": len(tiles),
        "requests": http.requests - r0,
        "bytes": http.bytes - b0,
        "fetch_seconds_excl_sleep": round(fetch_s, 2),
        "median_request_latency_s": round(statistics.median(lat_s), 3) if lat_s else None,
    }

    t0 = time.perf_counter()
    keycount: Counter = Counter()
    ring_signs = Counter()
    buildings, parts = {}, {}
    nb = np_ = 0
    for tx, ty, raw in raws:
        if raw is None:
            continue
        res.setdefault("tile_bytes_decompressed", []).append(len(raw))
        if save_dir:
            Path(save_dir).mkdir(parents=True, exist_ok=True)
            (Path(save_dir) / f"overture_buildings_z{ZOOM}_{tx}_{ty}.mvt").write_bytes(raw)
        layers = decode_tile(raw)
        for lname, layer in layers.items():
            for fid, props, polys in layer["features"]:
                local_polys = []
                for poly in polys:
                    ring_signs[_signed_area(poly[0]) > 0] += 1
                    rings = [
                        [
                            to_local(
                                lat, lon, *tile_px_to_lonlat(ZOOM, tx, ty, px, py, layer["extent"])
                            )
                            for px, py in r
                        ]
                        for r in poly
                    ]
                    local_polys.append(rings)
                if lname == "building":
                    nb += 1
                    keycount.update(props.keys())
                    buildings.setdefault(props.get("id", fid), []).append((props, local_polys))
                elif lname == "building_part":
                    np_ += 1
                    parts.setdefault(props.get("building_id"), []).append((props, local_polys))
    res["decode_seconds"] = round(time.perf_counter() - t0, 3)
    res["building_features"], res["part_features"] = nb, np_
    res["attr_availability_pct"] = {
        k: round(100 * keycount[k] / nb, 1) if nb else 0
        for k in (
            "height",
            "num_floors",
            "min_height",
            "class",
            "subtype",
            "has_parts",
            "is_underground",
            "id",
            "names",
        )
    }
    res["ring_orientation_exterior_positive_pct"] = (
        round(100 * ring_signs[True] / sum(ring_signs.values()), 1) if ring_signs else None
    )

    # spot containment (outer ring, not in hole; any piece counts)
    skip_ids = set()
    for bid, pieces in buildings.items():
        for _props, polys in pieces:
            for rings in polys:
                if point_in_ring(0, 0, rings[0]) and not any(
                    point_in_ring(0, 0, h) for h in rings[1:]
                ):
                    skip_ids.add(bid)

    def near(rings):
        return any(math.hypot(x, y) <= radius for x, y in rings[0])

    entries, src = [], Counter()
    parts_min_h = 0
    for bid, pieces in buildings.items():
        if bid in skip_ids or any(p.get("is_underground") for p, _ in pieces):
            continue
        use = pieces
        if (
            any(p.get("has_parts") for p, _ in pieces)
            and bid in parts
            and any(
                isinstance(pp.get("height"), (int, float))
                or isinstance(pp.get("num_floors"), (int, float))
                for pp, _ in parts[bid]
            )
        ):
            use = parts[bid]
        for props, polys in use:
            if (props.get("min_height") or 0) > 0:
                parts_min_h += 1
            h, s = resolve_height(props)
            src[s] += 1
            for rings in polys:
                if near(rings):
                    entries.append((rings, h - OBSERVER_HEIGHT, s in ("height", "floors")))
    entries = [e for e in entries if e[1] > 0]
    n_edges = sum(len(r) for rings, _, _ in entries for r in rings)
    t0 = time.perf_counter()
    hor, lim = horizon_with_limiters(entries)
    res["horizon_seconds_pure_python"] = round(time.perf_counter() - t0, 3)
    res["edges"] = n_edges
    res["buildings_in_radius"] = len(entries)
    total = sum(src.values()) or 1
    res["height_source_pct"] = {k: round(100 * v / total, 1) for k, v in src.items()}
    res["parts_with_min_height_gt0"] = parts_min_h
    res["spot_inside_building"] = bool(skip_ids)
    res["max_horizon_deg"] = round(max(hor), 1)
    cov = coverage_metric(hor, lim)
    res["coverage_metric"] = None if cov is None else round(cov, 3)
    return res


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--loc", action="append", help='"Name=lat,lon" (repeatable)')
    ap.add_argument("--radius", type=float, default=250.0)
    ap.add_argument("--release", help="override STAC latest")
    ap.add_argument("--save-tile", help="directory to store the raw decompressed tiles (fixtures)")
    ap.add_argument("--json", help="write full results here")
    a = ap.parse_args()
    locs = dict(LOCATIONS)
    if a.loc:
        locs = {}
        for item in a.loc:
            n, c = item.split("=")
            la, lo = c.split(",")
            locs[n] = (float(la), float(lo))

    http = Http()
    release = a.release or resolve_release(http)
    url = TILE_URL.format(release=release)
    arch = Archive(url, http)
    h = arch.header
    out = {
        "release": release,
        "url": url,
        "header": {
            k: (v.name if hasattr(v, "name") else v)
            for k, v in h.items()
            if k
            in (
                "min_zoom",
                "max_zoom",
                "tile_compression",
                "internal_compression",
                "tile_type",
                "tile_entries_count",
                "root_length",
                "leaf_directory_length",
            )
        },
        "locations": [],
    }
    print(f"release {release}\nheader {out['header']}")
    for name, (la, lo) in locs.items():
        try:
            r = probe_location(name, la, lo, a.radius, arch, a.save_tile)
        except (urllib.error.URLError, RuntimeError, ValueError) as e:
            r = {"name": name, "error": repr(e)}
        out["locations"].append(r)
        print(json.dumps(r, indent=1))
    covs = [r["coverage_metric"] for r in out["locations"] if r.get("coverage_metric") is not None]
    if covs:
        out["median_coverage_metric"] = round(statistics.median(covs), 3)
        print(
            f"\nmedian coverage metric: {out['median_coverage_metric']} "
            f"(threshold {LOW_COVERAGE_THRESHOLD}) over {len(covs)} locations"
        )
    out["total_requests"], out["total_bytes"] = http.requests, http.bytes
    if a.json:
        Path(a.json).write_text(json.dumps(out, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
