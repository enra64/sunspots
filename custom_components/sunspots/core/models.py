"""Data models shared by core modules."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .geometry import Polygon

# Height sources, in resolution order.
SOURCE_OVERRIDE = "override"
SOURCE_HEIGHT = "height"
SOURCE_FLOORS = "floors"
SOURCE_CLASS = "class"
SOURCE_DEFAULT = "default"
SOURCES = (SOURCE_OVERRIDE, SOURCE_HEIGHT, SOURCE_FLOORS, SOURCE_CLASS, SOURCE_DEFAULT)
EXPLICIT_SOURCES = frozenset({SOURCE_OVERRIDE, SOURCE_HEIGHT, SOURCE_FLOORS})


@dataclass(slots=True)
class Building:
    """A footprint (possibly several pieces) in local metres around the spot."""

    id: str
    polygons: list[Polygon]
    height: float | None = None
    num_floors: float | None = None
    min_height: float = 0.0
    klass: str | None = None
    subtype: str | None = None
    is_part: bool = False

    def to_dict(self) -> dict[str, Any]:
        """Compact JSON-serialisable form (rings as flat coordinate lists)."""
        return {
            "i": self.id,
            "g": [
                [[c for pt in ring for c in (round(pt[0], 2), round(pt[1], 2))] for ring in poly]
                for poly in self.polygons
            ],
            "h": self.height,
            "f": self.num_floors,
            "m": self.min_height,
            "c": self.klass,
            "s": self.subtype,
            "p": self.is_part,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Building:
        """Inverse of :meth:`to_dict`."""
        polygons = [
            [[(flat[k], flat[k + 1]) for k in range(0, len(flat), 2)] for flat in poly]
            for poly in data["g"]
        ]
        return cls(
            id=data["i"],
            polygons=polygons,
            height=data["h"],
            num_floors=data["f"],
            min_height=data["m"],
            klass=data["c"],
            subtype=data["s"],
            is_part=data["p"],
        )
