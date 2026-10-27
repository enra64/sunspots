"""From raw provider features to the per-spot building list (local metres)."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from .geometry import Polygon, point_in_polygon, project
from .models import Building

PART_KIND = "part"
BUILDING_KIND = "building"


@dataclass(slots=True)
class RawFeature:
    """A provider-neutral footprint feature in lon/lat."""

    id: str
    kind: str  # "building" | "part"
    parent_id: str | None
    props: dict[
        str, Any
    ]  # height, num_floors, min_height, class, subtype, has_parts, is_underground
    polygons: list[list[list[tuple[float, float]]]]  # polygons -> rings -> (lon, lat)

    def to_dict(self) -> dict[str, Any]:
        return {
            "i": self.id,
            "k": self.kind,
            "b": self.parent_id,
            "a": self.props,
            "g": [
                [[round(c, 7) for pt in ring for c in pt] for ring in poly]
                for poly in self.polygons
            ],
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> RawFeature:
        polygons = [
            [[(flat[k], flat[k + 1]) for k in range(0, len(flat), 2)] for flat in poly]
            for poly in d["g"]
        ]
        return cls(d["i"], d["k"], d["b"], d["a"], polygons)


@dataclass(slots=True)
class DerivedBuildings:
    buildings: list[Building]
    parts_with_min_height: int


def _num(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value) if value > 0 else None


def _local(feature: RawFeature, lat0: float, lon0: float) -> list[Polygon]:
    return [
        [[project(lat0, lon0, lat, lon) for lon, lat in ring] for ring in poly]
        for poly in feature.polygons
    ]


def _touches_radius(polygons: list[Polygon], radius: float) -> bool:
    for poly in polygons:
        xs = [x for ring in poly[:1] for x, _ in ring]
        ys = [y for ring in poly[:1] for _, y in ring]
        if (
            xs
            and max(xs) >= -radius
            and min(xs) <= radius
            and max(ys) >= -radius
            and min(ys) <= radius
        ):
            return True
    return False


def derive_buildings(
    features: Iterable[RawFeature], lat: float, lon: float, radius: float
) -> DerivedBuildings:
    """Merge clipped pieces, apply the parts rule, drop the building containing the spot.

    A spot inside a courtyard hole does *not* drop the building.
    """
    merged: dict[str, list[RawFeature]] = {}
    parts: dict[str, list[RawFeature]] = {}
    for f in features:
        if f.kind == PART_KIND:
            parts.setdefault(f.id, []).append(f)
        else:
            merged.setdefault(f.id, []).append(f)

    parts_by_parent: dict[str, dict[str, list[RawFeature]]] = {}
    for pid, pieces in parts.items():
        parent = pieces[0].parent_id
        if parent is not None and parent in merged:
            parts_by_parent.setdefault(parent, {})[pid] = pieces

    def contains_spot(pieces: list[RawFeature]) -> bool:
        return any(
            point_in_polygon(0.0, 0.0, poly) for piece in pieces for poly in _local(piece, lat, lon)
        )

    def merge_props(pieces: list[RawFeature]) -> dict[str, Any]:
        props: dict[str, Any] = {}
        for piece in pieces:
            for k, v in piece.props.items():
                if props.get(k) in (None, False, 0) and v not in (None,):
                    props[k] = v
        return props

    result: list[Building] = []
    parts_min = 0
    claimed_parts: set[str] = set()
    for bid, pieces in merged.items():
        props = merge_props(pieces)
        if props.get("is_underground"):
            continue
        if contains_spot(pieces):
            continue
        own_parts = parts_by_parent.get(bid, {})
        usable = {
            pid: pcs for pid, pcs in own_parts.items() if not merge_props(pcs).get("is_underground")
        }
        part_height_known = any(
            _num(merge_props(pcs).get("height")) or _num(merge_props(pcs).get("num_floors"))
            for pcs in usable.values()
        )
        if props.get("has_parts") and usable and part_height_known:
            claimed_parts.update(own_parts)
            for pid, pcs in usable.items():
                if contains_spot(pcs):
                    continue
                pp = merge_props(pcs)
                polys = [p for piece in pcs for p in _local(piece, lat, lon)]
                if not _touches_radius(polys, radius):
                    continue
                mh = _num(pp.get("min_height")) or 0.0
                parts_min += mh > 0
                result.append(
                    Building(
                        id=pid,
                        polygons=polys,
                        height=_num(pp.get("height")),
                        num_floors=_num(pp.get("num_floors")),
                        min_height=mh,
                        klass=pp.get("class") or props.get("class"),
                        subtype=pp.get("subtype") or props.get("subtype"),
                        is_part=True,
                    )
                )
            continue
        polys = [p for piece in pieces for p in _local(piece, lat, lon)]
        if not _touches_radius(polys, radius):
            continue
        result.append(
            Building(
                id=bid,
                polygons=polys,
                height=_num(props.get("height")),
                num_floors=_num(props.get("num_floors")),
                min_height=_num(props.get("min_height")) or 0.0,
                klass=props.get("class"),
                subtype=props.get("subtype"),
            )
        )

    # Parts whose parent footprint is not in the data stand on their own.
    for pid, pieces in parts.items():
        if pid in claimed_parts or pieces[0].parent_id in merged:
            continue
        pp = merge_props(pieces)
        if pp.get("is_underground") or contains_spot(pieces):
            continue
        polys = [p for piece in pieces for p in _local(piece, lat, lon)]
        if not _touches_radius(polys, radius):
            continue
        mh = _num(pp.get("min_height")) or 0.0
        parts_min += mh > 0
        result.append(
            Building(
                id=pid,
                polygons=polys,
                height=_num(pp.get("height")),
                num_floors=_num(pp.get("num_floors")),
                min_height=mh,
                klass=pp.get("class"),
                subtype=pp.get("subtype"),
                is_part=True,
            )
        )
    return DerivedBuildings(result, parts_min)
