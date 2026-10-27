import { MINUTES_PER_DAY } from "./days";
import { formatClock, formatNumber } from "./format";
import { clipAndMerge, type Range } from "./intervals";
import { translate } from "./locale";
import type { Segment } from "./types";

/** A label only goes inside a sunny segment that is at least this long ... */
export const MIN_LABEL_MINUTES = 90;
/** ... and at least this share of the bar wide, so the text fits on phones. */
export const MIN_LABEL_PERCENT = 18;

export function formatRange(start: number, end: number, language: string | undefined): string {
  return `${formatClock(start, language)}–${formatClock(end, language)}`;
}

/** Time range printed inside a bar segment, or undefined when it is too narrow (or not sunny). */
export function segmentLabel(
  segment: Segment,
  windowStart: number,
  windowEnd: number,
  language: string | undefined,
): string | undefined {
  if (segment.kind !== "sunny") return undefined;
  const minutes = segment.end - segment.start;
  const percent = (minutes / (windowEnd - windowStart)) * 100;
  if (minutes < MIN_LABEL_MINUTES || percent < MIN_LABEL_PERCENT) return undefined;
  return formatRange(segment.start, segment.end, language);
}

export function totalMinutes(ranges: readonly Range[]): number {
  return ranges.reduce((sum, [s, e]) => sum + (e - s), 0);
}

/**
 * One-line summary of a day's sun in words: "Sun: 11:00–13:30, 15:00–17:20 · 5.9 h"
 * or "No direct sun". `ranges` are minutes within the day; `partly` switches the wording.
 */
export function daySummary(ranges: readonly Range[], partly: boolean, language: string | undefined): string {
  const merged = clipAndMerge(ranges, 0, MINUTES_PER_DAY);
  if (merged.length === 0) return translate(language, "no_direct_sun");
  return translate(language, partly ? "partly_summary" : "sun_summary", {
    ranges: merged.map(([s, e]) => formatRange(s, e, language)).join(", "),
    hours: translate(language, "hours_short", { hours: formatNumber(totalMinutes(merged) / 60, language) }),
  });
}

/** Append "first sun 09:40" to a summary when the time is known. */
export function withFirstSun(summary: string, firstSun: number | undefined, language: string | undefined): string {
  if (firstSun === undefined) return summary;
  return `${summary} · ${translate(language, "first_sun", { time: formatClock(firstSun, language) })}`;
}
