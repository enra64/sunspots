import { clipAndMerge, type Range } from "./intervals";
import type { HourSetting } from "./types";

export type DayKey = "today" | "tomorrow";

export const MINUTES_PER_DAY = 1440;

/** Visible window used when a day has no sun at all. */
export const FALLBACK_HOURS: readonly [number, number] = [6, 22];

/** Start of each day on the card's axis (minutes since local midnight today). */
export const DAY_OFFSET: Record<DayKey, number> = { today: 0, tomorrow: MINUTES_PER_DAY };

export function selectDays(showToday: boolean, showTomorrow: boolean): readonly DayKey[] {
  const days: DayKey[] = [];
  if (showToday) days.push("today");
  if (showTomorrow) days.push("tomorrow");
  return days;
}

/**
 * Distance between labelled axis ticks for a visible window of `spanMinutes`:
 * 2 h up to 12 h, 3 h up to 18 h, 4 h beyond, so labels never collide on a narrow card.
 */
export function tickStepMinutes(spanMinutes: number): number {
  if (spanMinutes <= 12 * 60) return 120;
  if (spanMinutes <= 18 * 60) return 180;
  return 240;
}

export function shiftRanges(ranges: readonly Range[], offset: number): Range[] {
  return ranges.map(([s, e]): Range => [s + offset, e + offset]);
}

/**
 * Whole-hour window covering all ranges (minutes within a day), rounded
 * outward and clamped to 0-24; the fallback when there is nothing to show.
 */
export function autoHourWindow(ranges: readonly Range[]): readonly [number, number] {
  const merged = clipAndMerge(ranges, 0, MINUTES_PER_DAY);
  const first = merged[0];
  const last = merged[merged.length - 1];
  if (!first || !last) return FALLBACK_HOURS;
  return [Math.floor(first[0] / 60), Math.ceil(last[1] / 60)];
}

/**
 * Resolve configured hours: numbers win, "auto" is derived from `ranges`.
 * The result always spans at least one hour (a fixed start after an automatic
 * end shows the hour after the start).
 */
export function resolveHourWindow(
  start: HourSetting,
  end: HourSetting,
  ranges: readonly Range[],
): readonly [number, number] {
  const auto = autoHourWindow(ranges);
  let from = start === "auto" ? auto[0] : start;
  let to = end === "auto" ? auto[1] : end;
  if (to <= from) {
    to = Math.min(24, from + 1);
    from = to - 1;
  }
  return [from, to];
}
