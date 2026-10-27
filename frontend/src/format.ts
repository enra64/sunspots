import { type StringKey, translate } from "./locale";

const clockFormatters = new Map<string, Intl.DateTimeFormat>();

/** Format wall minutes as a clock time (no date) with the HA language. */
export function formatClock(minutes: number, language: string | undefined): string {
  const lang = language ?? "en";
  let f = clockFormatters.get(lang);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    } catch {
      f = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    }
    clockFormatters.set(lang, f);
  }
  const inDay = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return f.format(new Date(inDay * 60_000));
}

/** Clock time, prefixed with "tomorrow" when the instant is not today. */
export function formatWhen(minutes: number, language: string | undefined): string {
  const clock = formatClock(minutes, language);
  return minutes >= 1440 ? `${translate(language, "tomorrow")} ${clock}` : clock;
}

/** "until 14:30" / "from 06:12" style text. */
export function formatBoundary(
  kind: Extract<StringKey, "until" | "from" | "sun_expected_from" | "partly_expected_from">,
  minutes: number,
  language: string | undefined,
): string {
  return translate(language, kind, { time: formatWhen(minutes, language) });
}

export function formatDegrees(value: number, language: string | undefined): string {
  return `${new Intl.NumberFormat(language ?? "en", { maximumFractionDigits: 1 }).format(value)}°`;
}
