/**
 * All card logic works on a "wall-clock minutes" axis: minutes since local
 * midnight today in the Home Assistant time zone (negative = yesterday,
 * >= 1440 = tomorrow). This avoids depending on the browser's own zone.
 */

const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Wall-clock time of an instant in `timeZone`, expressed as ms of a UTC date. */
export function wallMs(date: Date, timeZone: string): number {
  const p: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  return Date.UTC(p["year"] ?? 1970, (p["month"] ?? 1) - 1, p["day"] ?? 1, (p["hour"] ?? 0) % 24, p["minute"] ?? 0, p["second"] ?? 0);
}

/** Wall-clock midnight (as UTC-ms) of the day containing `now`. */
export function dayStartWall(now: Date, timeZone: string): number {
  return Math.floor(wallMs(now, timeZone) / DAY_MS) * DAY_MS;
}

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Convert an ISO string to wall minutes relative to `dayStart`. Strings with an
 * offset are converted into `timeZone`; strings without are taken as local.
 */
export function toWallMinutes(iso: unknown, timeZone: string, dayStart: number): number | undefined {
  if (typeof iso !== "string") return undefined;
  const m = ISO.exec(iso.trim());
  if (!m) return undefined;
  let wall: number;
  if (m[7] === undefined) {
    wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  } else {
    const instant = new Date(iso.trim());
    if (Number.isNaN(instant.getTime())) return undefined;
    wall = wallMs(instant, timeZone);
  }
  if (Number.isNaN(wall)) return undefined;
  return (wall - dayStart) / 60_000;
}

/** Wall minutes -> "YYYY-MM-DDTHH:MM:00" local ISO string (no offset). */
export function wallMinutesToIso(minutes: number, dayStart: number): string {
  return new Date(dayStart + Math.round(minutes) * 60_000).toISOString().slice(0, 19);
}

/** Wall minutes of `now` itself. */
export function nowMinutes(now: Date, timeZone: string): number {
  return (wallMs(now, timeZone) - dayStartWall(now, timeZone)) / 60_000;
}
