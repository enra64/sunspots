"""Top-down shadow view: shadow polygons on the observer plane and a safe SVG."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from xml.sax.saxutils import escape, quoteattr

from .geometry import Point, Polygon, signed_area
from .models import (
    SOURCE_CLASS,
    SOURCE_DEFAULT,
    SOURCE_FLOORS,
    SOURCE_HEIGHT,
    SOURCE_OVERRIDE,
    Building,
)

SHADOW_MAX_FACTOR = 2.0
SVG_PX = 600
_COORD_DECIMALS = 1


@dataclass(frozen=True, slots=True)
class Palette:
    """Colours of one theme; the SVG carries its own background so it works inside an <img>."""

    background: str
    shadow: str
    shadow_opacity: float
    text: str
    sun: str
    hatch: str
    buildings: dict[str, str]


PALETTES = {
    "light": Palette(
        background="#ece9e2",
        shadow="#1c2b3a",
        shadow_opacity=0.38,
        text="#33414f",
        sun="#d99a00",
        hatch="#ffffff",
        buildings={
            SOURCE_OVERRIDE: "#2e7d4f",  # user-set height
            SOURCE_HEIGHT: "#44586b",  # measured height
            SOURCE_FLOORS: "#6c8197",  # from floor count
            SOURCE_CLASS: "#9aa9b8",  # guessed from building type (hatched)
            SOURCE_DEFAULT: "#b9c3cd",  # global default (hatched)
        },
    ),
    "dark": Palette(
        background="#171d24",
        shadow="#000000",
        shadow_opacity=0.55,
        text="#c9d3dd",
        sun="#f2b632",
        hatch="#171d24",
        buildings={
            SOURCE_OVERRIDE: "#4caf78",
            SOURCE_HEIGHT: "#8aa0b6",
            SOURCE_FLOORS: "#6f879e",
            SOURCE_CLASS: "#4f6275",
            SOURCE_DEFAULT: "#3a4857",
        },
    ),
}
_GUESSED = (SOURCE_CLASS, SOURCE_DEFAULT)
_SCALE_STEPS = (5, 10, 20, 25, 50, 100, 200)


def _ccw(ring: list[Point]) -> list[Point]:
    return ring if signed_area(ring) >= 0 else ring[::-1]


def _cw(ring: list[Point]) -> list[Point]:
    return ring if signed_area(ring) <= 0 else ring[::-1]


def shadow_polygons(
    buildings: Sequence[Building],
    heights: Sequence[float],
    sun_azimuth: float,
    sun_elevation: float,
    observer_height: float,
    radius: float,
) -> list[Polygon]:
    """Shadows cast on the observer's plane, in north-up metres around the observer.

    Per building the shadow is the footprint (holes kept) united with one quad per ring edge,
    exterior and interior, swept along ``s = H_eff / tan(elevation)`` away from the sun and
    clamped to twice the radius. Polygons are oriented so that one nonzero-filled path is
    their exact union. Empty when the sun is not above the horizon.
    """
    if sun_elevation <= 0:
        return []
    az = math.radians(sun_azimuth)
    away = (-math.sin(az), -math.cos(az))
    tan_el = math.tan(math.radians(sun_elevation))
    limit = SHADOW_MAX_FACTOR * radius
    result: list[Polygon] = []
    for building, height in zip(buildings, heights, strict=True):
        h_eff = height - observer_height
        if h_eff <= 0:
            continue
        length = min(h_eff / tan_el, limit)
        sx, sy = away[0] * length, away[1] * length
        for polygon in building.polygons:
            result.append([_ccw(polygon[0]), *(_cw(h) for h in polygon[1:])])
            for ring in polygon:
                n = len(ring)
                for k in range(n):
                    (px, py), (qx, qy) = ring[k], ring[(k + 1) % n]
                    quad = [(px, py), (qx, qy), (qx + sx, qy + sy), (px + sx, py + sy)]
                    if abs(signed_area(quad)) > 1e-9:
                        result.append([_ccw(quad)])
    return result


def _bbox_hits(ring: list[Point], half: float) -> bool:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return max(xs) >= -half and min(xs) <= half and max(ys) >= -half and min(ys) <= half


def _path(polygons: Sequence[Polygon], half: float, scale: float) -> str:
    centre = SVG_PX / 2
    parts: list[str] = []
    for polygon in polygons:
        if not _bbox_hits(polygon[0], half):
            continue
        for ring in polygon:
            pts = " L".join(
                f"{round(centre + x * scale, _COORD_DECIMALS)},{round(centre - y * scale, _COORD_DECIMALS)}"
                for x, y in ring
            )
            parts.append(f"M{pts}Z")
    return "".join(parts)


def to_svg(
    buildings: Sequence[Building],
    sources: Sequence[str],
    shadows: Sequence[Polygon],
    *,
    radius: float,
    sun_azimuth: float,
    sun_elevation: float,
    caption: str,
    attribution: str,
    title: str,
    theme: str = "light",
) -> str:
    """Build the SVG string; every text value is escaped and no scripting content is emitted.

    North is up (y is flipped explicitly). Buildings are coloured by height source; guessed
    heights additionally carry a hatch pattern so the distinction survives without colour vision.
    """
    palette = PALETTES.get(theme, PALETTES["light"])
    scale = SVG_PX / (2 * radius)
    centre = SVG_PX / 2
    out: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_PX} {SVG_PX}" '
        f'width="{SVG_PX}" height="{SVG_PX}" role="img" aria-label={quoteattr(title)}>',
        f"<title>{escape(title)}</title>",
        f'<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" '
        f'patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="{palette.hatch}" '
        'stroke-width="2" stroke-opacity="0.75"/></pattern></defs>',
        f'<rect width="{SVG_PX}" height="{SVG_PX}" fill="{palette.background}"/>',
    ]
    shadow_d = _path(shadows, radius, scale)
    if shadow_d:
        out.append(
            f'<path d="{shadow_d}" fill="{palette.shadow}" fill-opacity="{palette.shadow_opacity}" fill-rule="nonzero"/>'
        )
    by_source: dict[str, list[Polygon]] = {}
    for building, source in zip(buildings, sources, strict=True):
        by_source.setdefault(source, []).extend(building.polygons)
    for source in (SOURCE_DEFAULT, SOURCE_CLASS, SOURCE_FLOORS, SOURCE_HEIGHT, SOURCE_OVERRIDE):
        d = _path(by_source.get(source, []), radius, scale)
        if not d:
            continue
        colour = palette.buildings[source]
        out.append(f'<path d="{d}" fill="{colour}" fill-rule="evenodd"/>')
        if source in _GUESSED:
            out.append(f'<path d="{d}" fill="url(#hatch)" fill-rule="evenodd"/>')
    # spot marker
    out.append(
        f'<circle cx="{centre}" cy="{centre}" r="6" fill="#e53935" stroke="#ffffff" stroke-width="2"/>'
    )
    # sun arrow (only when the sun is up)
    if sun_elevation > 0:
        az = math.radians(sun_azimuth)
        tip = (centre + math.sin(az) * 0.42 * SVG_PX, centre - math.cos(az) * 0.42 * SVG_PX)
        out.append(
            f'<line x1="{centre}" y1="{centre}" x2="{tip[0]:.1f}" y2="{tip[1]:.1f}" '
            f'stroke="{palette.sun}" stroke-width="2" stroke-dasharray="6 4"/>'
            f'<circle cx="{tip[0]:.1f}" cy="{tip[1]:.1f}" r="9" fill="{palette.sun}"/>'
        )
    # north arrow
    out.append(
        f'<g fill="{palette.text}"><path d="M30,48 L22,68 L30,62 L38,68 Z"/>'
        '<text x="30" y="38" text-anchor="middle" font-family="sans-serif" font-size="16" '
        'font-weight="bold">N</text></g>'
    )
    # scale bar
    bar = max((s for s in _SCALE_STEPS if s <= radius / 2), default=_SCALE_STEPS[0])
    bar_px = bar * scale
    out.append(
        f'<g fill="{palette.text}" font-family="sans-serif" font-size="13">'
        f'<rect x="16" y="{SVG_PX - 44}" width="{bar_px:.1f}" height="5"/>'
        f'<text x="16" y="{SVG_PX - 50}">{bar} m</text></g>'
    )
    out.append(
        f'<g fill="{palette.text}" font-family="sans-serif">'
        f'<text x="16" y="{SVG_PX - 20}" font-size="15">{escape(caption)}</text>'
        f'<text x="{SVG_PX - 12}" y="{SVG_PX - 8}" font-size="10" text-anchor="end">{escape(attribution)}</text></g>'
    )
    out.append("</svg>")
    return "".join(out)
