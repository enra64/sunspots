"""Horizon profile: the maximum blocking elevation per azimuth bin.

Edge sweep (no rays x edges matrix): every ring edge, exterior and interior,
contributes to the bins its azimuth span overlaps.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from .const import AZIMUTH_BINS, MIN_HIT_DISTANCE_M
from .models import Building

_CHUNK_PAIRS = 400_000
_PARALLEL_EPS_DEG = 1e-6

FloatArray = npt.NDArray[np.float64]
IntArray = npt.NDArray[np.int32]


@dataclass(slots=True)
class HorizonResult:
    """Per-bin blocking elevation (degrees) and the limiting building index (-1 = none)."""

    angles: FloatArray
    limiter: IntArray


def _gather_edges(
    buildings: Sequence[Building], h_eff: Sequence[float]
) -> tuple[FloatArray, FloatArray, FloatArray, FloatArray, FloatArray, IntArray]:
    xs: list[float] = []
    ys: list[float] = []
    qxs: list[float] = []
    qys: list[float] = []
    heights: list[float] = []
    owners: list[int] = []
    for index, building in enumerate(buildings):
        if h_eff[index] <= 0:
            continue
        for polygon in building.polygons:
            for ring in polygon:
                n = len(ring)
                for k in range(n):
                    px, py = ring[k]
                    qx, qy = ring[(k + 1) % n]
                    xs.append(px)
                    ys.append(py)
                    qxs.append(qx)
                    qys.append(qy)
                    heights.append(h_eff[index])
                    owners.append(index)
    f = np.float64
    return (
        np.array(xs, dtype=f),
        np.array(ys, dtype=f),
        np.array(qxs, dtype=f),
        np.array(qys, dtype=f),
        np.array(heights, dtype=f),
        np.array(owners, dtype=np.int32),
    )


def compute_horizon(
    buildings: Sequence[Building],
    heights: Sequence[float],
    observer_height: float,
    radius: float,
    bins: int = AZIMUTH_BINS,
) -> HorizonResult:
    """Compute the horizon profile for buildings given in local metres around the observer.

    ``heights[i]`` is the absolute resolved height of ``buildings[i]``; the effective
    height is ``height - observer_height`` and buildings with a non-positive value
    are skipped.
    """
    h_eff = [h - observer_height for h in heights]
    px, py, qx, qy, he, owner = _gather_edges(buildings, h_eff)
    horizon = np.zeros(bins, dtype=np.float64)
    limiter = np.full(bins, -1, dtype=np.int32)
    if px.size == 0:
        return HorizonResult(horizon, limiter)

    ex, ey = qx - px, qy - py
    length2 = ex * ex + ey * ey
    safe = np.where(length2 == 0, 1.0, length2)
    t_proj = np.clip(-(px * ex + py * ey) / safe, 0.0, 1.0)
    near = np.hypot(px + t_proj * ex, py + t_proj * ey)
    keep = (length2 > 0) & (near <= radius)

    tp = np.degrees(np.arctan2(px, py)) % 360.0
    tq = np.degrees(np.arctan2(qx, qy)) % 360.0
    delta = (tq - tp + 180.0) % 360.0 - 180.0
    keep &= np.abs(np.abs(delta) - 180.0) > _PARALLEL_EPS_DEG
    sel = np.nonzero(keep)[0]
    if sel.size == 0:
        return HorizonResult(horizon, limiter)
    px, py, ex, ey, he, owner = px[sel], py[sel], ex[sel], ey[sel], he[sel], owner[sel]
    tp, delta = tp[sel], delta[sel]

    step = 360.0 / bins
    a0 = np.minimum(tp, tp + delta)
    a1 = np.maximum(tp, tp + delta)
    b0 = np.floor(a0 / step).astype(np.int64)
    counts = np.floor(a1 / step).astype(np.int64) - b0 + 1

    start = 0
    total_edges = px.size
    while start < total_edges:
        # take edges until the pair budget is reached (at least one edge per chunk)
        cum = np.cumsum(counts[start:])
        take = int(np.searchsorted(cum, _CHUNK_PAIRS, side="right")) or 1
        end = min(total_edges, start + take)
        _sweep_chunk(
            slice(start, end),
            px,
            py,
            ex,
            ey,
            he,
            owner,
            a0,
            a1,
            b0,
            counts,
            horizon,
            limiter,
            bins,
            step,
        )
        start = end
    return HorizonResult(horizon, limiter)


def _sweep_chunk(
    sl: slice,
    px: FloatArray,
    py: FloatArray,
    ex: FloatArray,
    ey: FloatArray,
    he: FloatArray,
    owner: IntArray,
    a0: FloatArray,
    a1: FloatArray,
    b0: npt.NDArray[np.int64],
    counts: npt.NDArray[np.int64],
    horizon: FloatArray,
    limiter: IntArray,
    bins: int,
    step: float,
) -> None:
    cnt = counts[sl]
    edge = np.repeat(np.arange(cnt.size), cnt)
    first = np.cumsum(cnt) - cnt
    offset = np.arange(edge.size) - np.repeat(first, cnt)
    b = b0[sl][edge] + offset
    az = np.clip((b + 0.5) * step, a0[sl][edge], a1[sl][edge])
    rad = np.radians(az)
    ux, uy = np.sin(rad), np.cos(rad)
    exs, eys = ex[sl][edge], ey[sl][edge]
    den = ux * eys - uy * exs
    num = px[sl][edge] * eys - py[sl][edge] * exs
    ok = np.abs(den) > 1e-12
    dist = np.divide(num, den, out=np.zeros_like(num), where=ok)
    ok &= dist >= MIN_HIT_DISTANCE_M
    if not ok.any():
        return
    angle = np.degrees(np.arctan2(he[sl][edge][ok], dist[ok]))
    bin_idx = (b[ok] % bins).astype(np.int64)
    who = owner[sl][edge][ok]
    order = np.lexsort((angle, bin_idx))
    bin_idx, angle, who = bin_idx[order], angle[order], who[order]
    last = np.r_[bin_idx[1:] != bin_idx[:-1], True]
    bin_idx, angle, who = bin_idx[last], angle[last], who[last]
    better = angle > horizon[bin_idx]
    horizon[bin_idx[better]] = angle[better]
    limiter[bin_idx[better]] = who[better]


def horizon_at(horizon: FloatArray, azimuth: float) -> float:
    """Conservative lookup: max of the two bins whose centres bracket the azimuth."""
    bins = horizon.size
    f = (azimuth % 360.0) / (360.0 / bins) - 0.5
    i0 = math.floor(f)
    return float(max(horizon[i0 % bins], horizon[(i0 + 1) % bins]))


def horizon_at_many(horizon: FloatArray, azimuth: FloatArray) -> FloatArray:
    """Vectorised :func:`horizon_at`."""
    bins = horizon.size
    f = (azimuth % 360.0) / (360.0 / bins) - 0.5
    i0 = np.floor(f).astype(np.int64)
    return np.maximum(horizon[i0 % bins], horizon[(i0 + 1) % bins])
