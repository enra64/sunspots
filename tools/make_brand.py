#!/usr/bin/env python3
"""Generate the brand images in custom_components/sunspots/brand (needs Pillow)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "custom_components" / "sunspots" / "brand"
SUN = (245, 179, 1, 255)


def icon(size: int, dark: bool) -> Image.Image:
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    wall = (170, 183, 196, 255) if dark else (59, 74, 90, 255)
    shade = (170, 183, 196, 90) if dark else (59, 74, 90, 70)
    cx, cy, r = 0.64 * s, 0.30 * s, 0.14 * s
    for k in range(8):
        a = math.radians(k * 45)
        d.line(
            [
                (cx + math.cos(a) * r * 1.35, cy + math.sin(a) * r * 1.35),
                (cx + math.cos(a) * r * 1.85, cy + math.sin(a) * r * 1.85),
            ],
            fill=SUN,
            width=int(0.04 * s),
        )
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SUN)
    d.polygon(
        [(0.30 * s, 0.98 * s), (0.30 * s, 0.50 * s), (0.62 * s, 0.50 * s), (0.62 * s, 0.98 * s)],
        fill=wall,
    )
    d.polygon([(0.62 * s, 0.98 * s), (0.62 * s, 0.50 * s), (0.99 * s, 0.98 * s)], fill=shade)
    for row in range(3):
        for col in range(2):
            x, y = 0.35 * s + col * 0.13 * s, 0.57 * s + row * 0.12 * s
            d.rectangle([x, y, x + 0.07 * s, y + 0.07 * s], fill=(0, 0, 0, 0))
    return img.resize((size, size), Image.LANCZOS)


def logo(height: int, dark: bool) -> Image.Image:
    mark = icon(height, dark)
    font = ImageFont.load_default(size=int(height * 0.5))
    text = "Sunspots"
    width = int(ImageDraw.Draw(mark).textlength(text, font=font)) + height + 12
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    img.paste(mark, (0, 0))
    ImageDraw.Draw(img).text(
        (height + 12, height * 0.22),
        text,
        font=font,
        fill=(235, 240, 245, 255) if dark else (59, 74, 90, 255),
    )
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for dark in (False, True):
        prefix = "dark_" if dark else ""
        icon(256, dark).save(OUT / f"{prefix}icon.png", optimize=True)
        icon(512, dark).save(OUT / f"{prefix}icon@2x.png", optimize=True)
        logo(256, dark).save(OUT / f"{prefix}logo.png", optimize=True)
        logo(512, dark).save(OUT / f"{prefix}logo@2x.png", optimize=True)


if __name__ == "__main__":
    main()
