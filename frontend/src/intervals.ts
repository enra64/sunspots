import type { ForecastClass, Segment } from "./types";

export type Range = readonly [number, number];

/** Clip ranges to [lo, hi], drop empty ones, sort and merge overlapping/touching ones. */
export function clipAndMerge(ranges: readonly Range[], lo: number, hi: number): Range[] {
  const clipped = ranges
    .map(([s, e]): Range => [Math.max(s, lo), Math.min(e, hi)])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of clipped) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged;
}

export interface ForecastWindow {
  start: number;
  end: number;
  kind: ForecastClass;
  past: boolean;
}

export interface TimelineInput {
  geometry: readonly Range[];
  forecast: readonly ForecastWindow[];
  windowStart: number;
  windowEnd: number;
  now: number;
}

export interface TimelineModel {
  geometry: Segment[];
  forecast: Segment[];
  /** Position of "now" in percent of the bar, or undefined when outside the window. */
  nowPercent: number | undefined;
}

export function toPercent(minutes: number, windowStart: number, windowEnd: number): number {
  return ((minutes - windowStart) / (windowEnd - windowStart)) * 100;
}

export function computeTimeline(input: TimelineInput): TimelineModel {
  const { windowStart, windowEnd, now } = input;
  const geometry = clipAndMerge(input.geometry, windowStart, windowEnd).map(
    ([start, end]): Segment => ({ start, end, kind: "sunny", past: end <= now }),
  );

  const forecast: Segment[] = [];
  for (const kind of ["unlikely", "partly", "sunny"] as const) {
    const ranges = input.forecast.filter((w) => w.kind === kind).map((w): Range => [w.start, w.end]);
    for (const [start, end] of clipAndMerge(ranges, windowStart, windowEnd)) {
      forecast.push({ start, end, kind, past: end <= now });
    }
  }
  forecast.sort((a, b) => a.start - b.start);

  const inside = now >= windowStart && now <= windowEnd;
  return {
    geometry,
    forecast,
    nowPercent: inside ? toPercent(now, windowStart, windowEnd) : undefined,
  };
}
