import { attrNumber, attrString, findSiblings, isUnavailable, type Siblings } from "./entities";
import { DAY_OFFSET, type DayKey, resolveHourWindow, selectDays, shiftRanges, tickStepMinutes } from "./days";
import { MAP_HOURS } from "./config";
import { formatBoundary, formatHourLabel, formatNumber } from "./format";
import { computeTimeline, type ForecastWindow, type Range } from "./intervals";
import { type StringKey, translate } from "./locale";
import { daySummary, formatRange, segmentLabel, withFirstSun } from "./summary";
import { dayStartWall, nowMinutes, toWallMinutes } from "./time";
import type { CardConfig, ForecastClass, Hass, HassEntityState, HourSetting, ShadowCardConfig } from "./types";

export const MAP_STEP_MINUTES = 10;

const FULL_DAY_HOURS: readonly [number, number] = [0, 24];

export type Status = "sunny" | "shaded" | "sunny_cloudy" | "unavailable";

export interface RowBase {
  entityId: string;
  name: string;
  /** Set when the entity cannot be shown; other fields are then empty. */
  error?: string;
}

export interface OverviewRow extends RowBase {
  status: Status;
  statusLabel: string;
  icon: string;
  /** "until 14:30" or "from 06:12". */
  boundary?: string;
  /** "sun expected from 15:00". */
  forecastNote?: string;
  /** Additional small facts (sun hours, cloud cover). */
  extras: string[];
}

export interface LegendItem {
  kind: ForecastClass | "geometry";
  label: string;
}

export interface TimelineTick {
  percent: number;
  /** Only every n-th hour (see `tickStepMinutes`) is labelled; the others are plain grid lines. */
  label?: string;
}

export interface TimelineBar {
  /** Percent of the bar width. */
  left: number;
  width: number;
  kind: ForecastClass;
  past: boolean;
  /** Time range printed inside the segment when it is wide enough. */
  label?: string;
}

export interface TimelineDay {
  key: DayKey;
  /** "Today" / "Tomorrow". */
  label: string;
  bars: TimelineBar[];
  /** Position of "now" in percent of the bar; today only. */
  nowPercent: number | undefined;
  /** True when the bar shows forecast classes rather than pure geometry. */
  usesForecast: boolean;
  /** One-line text summary in words. */
  summary: string;
  /** Text alternative for the bar. */
  ariaLabel: string;
}

export interface TimelineRow extends RowBase {
  status: Status;
  statusLabel: string;
  icon: string;
  days: TimelineDay[];
  ticks: TimelineTick[];
  legend: LegendItem[];
  nowLabel: string;
}

export interface MapModel extends RowBase {
  minMinute: number;
  maxMinute: number;
  step: number;
  initialMinute: number;
  dayStart: number;
  attribution?: string;
}

export type ViewModel =
  | { mode: "overview"; title: string; rows: OverviewRow[] }
  | { mode: "timeline"; title: string; rows: TimelineRow[] }
  | { mode: "map"; title: string; map: MapModel };

interface Context {
  hass: Hass;
  language: string | undefined;
  tz: string;
  dayStart: number;
  now: number;
}

const STATUS_ICON: Record<Status, string> = {
  sunny: "mdi:white-balance-sunny",
  shaded: "mdi:weather-sunny-off",
  sunny_cloudy: "mdi:weather-partly-cloudy",
  unavailable: "mdi:help-circle-outline",
};

const LEGEND_KEY: Record<ForecastClass | "geometry", StringKey> = {
  sunny: "legend_sunny",
  partly: "legend_partly",
  unlikely: "legend_unlikely",
  geometry: "legend_geometry",
};

export function languageOf(hass: Hass): string {
  return hass.locale?.language ?? hass.language ?? "en";
}

/** Display name of a spot: friendly name without the trailing "Sunny"/"Sonnig" entity name. */
export function spotName(state: HassEntityState | undefined, entityId: string): string {
  const friendly = attrString(state, "friendly_name");
  if (!friendly) return entityId;
  const stripped = friendly.replace(/\s+(sunny|sonnig)$/i, "").trim();
  return stripped === "" ? friendly : stripped;
}

function context(hass: Hass, now: Date): Context {
  const tz = hass.config.time_zone;
  return { hass, language: languageOf(hass), tz, dayStart: dayStartWall(now, tz), now: nowMinutes(now, tz) };
}

function minutesOf(ctx: Context, iso: unknown): number | undefined {
  return toWallMinutes(iso, ctx.tz, ctx.dayStart);
}

/** Parse `[startISO, endISO]` pairs or `{start, end}` objects into wall-minute ranges. */
function parseRanges(ctx: Context, raw: unknown): Range[] {
  if (!Array.isArray(raw)) return [];
  const result: Range[] = [];
  for (const item of raw as unknown[]) {
    const [from, to] = Array.isArray(item)
      ? [item[0], item[1]]
      : typeof item === "object" && item !== null
        ? [(item as Record<string, unknown>)["start"], (item as Record<string, unknown>)["end"]]
        : [undefined, undefined];
    const start = minutesOf(ctx, from);
    const end = minutesOf(ctx, to);
    if (start !== undefined && end !== undefined) result.push([start, end]);
  }
  return result;
}

function forecastWindows(ctx: Context, state: HassEntityState | undefined): ForecastWindow[] {
  const raw = state?.attributes["windows"];
  if (!Array.isArray(raw)) return [];
  const result: ForecastWindow[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const w = item as Record<string, unknown>;
    const start = minutesOf(ctx, w["start"]);
    const end = minutesOf(ctx, w["end"]);
    const kind = w["class"];
    if (start === undefined || end === undefined) continue;
    if (kind !== "sunny" && kind !== "partly" && kind !== "unlikely") continue;
    result.push({ start, end, kind, past: w["past"] === true });
  }
  return result;
}

function stateOf(ctx: Context, id: string | undefined): HassEntityState | undefined {
  return id === undefined ? undefined : ctx.hass.states[id];
}

function statusOf(main: HassEntityState | undefined, aware: HassEntityState | undefined): Status {
  if (isUnavailable(main)) return "unavailable";
  if (main?.state !== "on") return "shaded";
  if (aware && !isUnavailable(aware) && aware.state === "off") return "sunny_cloudy";
  return "sunny";
}

function statusInfo(ctx: Context, siblings: Siblings, main: HassEntityState | undefined) {
  const aware = stateOf(ctx, siblings.sunny_weather_aware);
  const status = statusOf(main, aware);
  return { aware, status, statusLabel: translate(ctx.language, status), icon: STATUS_ICON[status] };
}

function overviewRow(ctx: Context, siblings: Siblings, entityId: string): OverviewRow {
  const main = ctx.hass.states[entityId];
  const { aware, status, statusLabel, icon } = statusInfo(ctx, siblings, main);
  const t = (key: StringKey, vars?: Record<string, string | number>) => translate(ctx.language, key, vars);
  const row: OverviewRow = {
    entityId,
    name: spotName(main, entityId),
    status,
    statusLabel,
    icon,
    extras: [],
  };

  const next = minutesOf(ctx, stateOf(ctx, siblings.next_change)?.state);
  if (next !== undefined && status !== "unavailable") {
    row.boundary = formatBoundary(main?.state === "on" ? "until" : "from", next, ctx.language);
  }

  const forecast = stateOf(ctx, siblings.sun_forecast);
  if (forecast?.state === "sunny_later" || forecast?.state === "partly_later") {
    const best = forecast.attributes["best_window"];
    const start = typeof best === "object" && best !== null ? minutesOf(ctx, (best as { start?: unknown }).start) : undefined;
    if (start !== undefined) {
      row.forecastNote = formatBoundary(
        forecast.state === "sunny_later" ? "sun_expected_from" : "partly_expected_from",
        start,
        ctx.language,
      );
    }
  } else if (forecast?.state === "no_sun_today") {
    row.forecastNote = t("no_sun_today");
  }

  const hours = Number(stateOf(ctx, siblings.sun_hours_today)?.state);
  if (stateOf(ctx, siblings.sun_hours_today) && Number.isFinite(hours)) {
    row.extras.push(t("sun_hours_today", { hours: formatNumber(hours, ctx.language) }));
  }
  const cloud = attrNumber(aware, "cloud_coverage");
  if (cloud !== undefined && status !== "shaded" && status !== "unavailable") {
    row.extras.push(t("cloud_coverage", { percent: Math.round(cloud) }));
  }
  return row;
}

/** Grid line per full hour inside the window; hours on the tick step carry a label. */
function ticks(ctx: Context, startMin: number, endMin: number): TimelineTick[] {
  const result: TimelineTick[] = [];
  const step = tickStepMinutes(endMin - startMin);
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) {
    const percent = ((m - startMin) / (endMin - startMin)) * 100;
    result.push(m % step === 0 ? { percent, label: formatHourLabel(m, ctx.language) } : { percent });
  }
  return result;
}

/** Sun data of one day, in minutes since that day's own midnight. */
interface DayData {
  geometry: Range[];
  windows: ForecastWindow[];
  /** Start of the first (sunny, else partly sunny) window; tomorrow only. */
  firstSun: number | undefined;
}

function dayData(ctx: Context, siblings: Siblings, main: HassEntityState | undefined, day: DayKey): DayData {
  if (day === "today") {
    return {
      geometry: parseRanges(ctx, main?.attributes["intervals_today"]),
      windows: forecastWindows(ctx, stateOf(ctx, siblings.sun_forecast)),
      firstSun: undefined,
    };
  }
  const offset = DAY_OFFSET.tomorrow;
  const tomorrow = stateOf(ctx, siblings.sun_tomorrow);
  const own = main?.attributes["intervals_tomorrow"];
  const geometry = Array.isArray(own) ? parseRanges(ctx, own) : parseRanges(ctx, tomorrow?.attributes["intervals"]);
  const first = minutesOf(ctx, tomorrow?.state);
  return {
    geometry: shiftRanges(geometry, -offset),
    windows: forecastWindows(ctx, tomorrow).map((w) => ({ ...w, start: w.start - offset, end: w.end - offset })),
    firstSun: first === undefined ? undefined : first - offset,
  };
}

function timelineDay(
  ctx: Context,
  day: DayKey,
  data: DayData,
  windowStart: number,
  windowEnd: number,
  name: string,
): TimelineDay {
  const t = (key: StringKey, vars?: Record<string, string | number>) => translate(ctx.language, key, vars);
  const lang = ctx.language;
  const usesForecast = data.windows.length > 0;
  const model = computeTimeline({
    geometry: data.geometry,
    forecast: data.windows,
    windowStart,
    windowEnd,
    now: ctx.now - DAY_OFFSET[day],
  });
  const segments = usesForecast ? model.forecast : model.geometry;
  const span = windowEnd - windowStart;
  const bars = segments.map((s): TimelineBar => {
    const label = segmentLabel(s, windowStart, windowEnd, lang);
    return {
      left: ((s.start - windowStart) / span) * 100,
      width: ((s.end - s.start) / span) * 100,
      kind: s.kind,
      past: s.past,
      ...(label ? { label } : {}),
    };
  });

  const kindLabel = (kind: ForecastClass | "geometry") => t(LEGEND_KEY[kind]);
  const parts = segments.map((s) => `${kindLabel(usesForecast ? s.kind : "geometry")} ${formatRange(s.start, s.end, lang)}`);

  const windowRanges = (kind: ForecastClass): Range[] =>
    data.windows.filter((w) => w.kind === kind).map((w): Range => [w.start, w.end]);
  const sunny = usesForecast ? windowRanges("sunny") : data.geometry;
  const partlyOnly = usesForecast && sunny.length === 0;
  const text = daySummary(partlyOnly ? windowRanges("partly") : sunny, partlyOnly, lang);

  const dayLabel = t(day === "today" ? "day_today" : "day_tomorrow");
  return {
    key: day,
    label: dayLabel,
    bars,
    nowPercent: day === "today" ? model.nowPercent : undefined,
    usesForecast,
    summary: day === "tomorrow" ? withFirstSun(text, data.firstSun, lang) : text,
    ariaLabel: t("timeline_bar_alt", {
      name,
      day: dayLabel,
      summary: parts.length > 0 ? parts.join("; ") : t("timeline_none"),
    }),
  };
}

function timelineRow(ctx: Context, siblings: Siblings, entityId: string, config: CardConfig): TimelineRow {
  const main = ctx.hass.states[entityId];
  const name = spotName(main, entityId);
  const days = selectDays(config.showToday, config.showTomorrow).map((key) => ({ key, data: dayData(ctx, siblings, main, key) }));

  const visible = days.flatMap(({ data }) => [
    ...data.geometry,
    ...data.windows.map((w): Range => [w.start, w.end]),
  ]);
  const [startHour, endHour] = config.fullDay
    ? FULL_DAY_HOURS
    : resolveHourWindow(config.startHour, config.endHour, visible);
  const windowStart = startHour * 60;
  const windowEnd = endHour * 60;

  const shown = days.map(({ key, data }) => timelineDay(ctx, key, data, windowStart, windowEnd, name));
  const legendKinds: (ForecastClass | "geometry")[] = [];
  if (shown.some((d) => d.usesForecast)) legendKinds.push("sunny", "partly", "unlikely");
  if (shown.some((d) => !d.usesForecast && d.bars.length > 0)) legendKinds.push("geometry");

  const { status, statusLabel, icon } = statusInfo(ctx, siblings, main);
  return {
    entityId,
    name,
    status,
    statusLabel,
    icon,
    days: shown,
    ticks: ticks(ctx, windowStart, windowEnd),
    legend: legendKinds.map((kind) => ({ kind, label: translate(ctx.language, LEGEND_KEY[kind]) })),
    nowLabel: translate(ctx.language, "now"),
  };
}

function missing<T extends RowBase>(ctx: Context, entityId: string, rest: Omit<T, keyof RowBase>): T {
  return {
    entityId,
    name: entityId,
    error: translate(ctx.language, "entity_missing", { entity: entityId }),
    ...rest,
  } as T;
}

function fixedHour(setting: HourSetting, fallback: number): number {
  return typeof setting === "number" ? setting : fallback;
}

function mapModel(
  ctx: Context,
  siblings: Siblings | undefined,
  entityId: string,
  startHour: number,
  endHour: number,
): MapModel {
  const main = ctx.hass.states[entityId];
  const minMinute = startHour * 60;
  const maxMinute = endHour * 60;
  const snapped = Math.round(ctx.now / MAP_STEP_MINUTES) * MAP_STEP_MINUTES;
  const base = {
    minMinute,
    maxMinute,
    step: MAP_STEP_MINUTES,
    initialMinute: Math.min(maxMinute, Math.max(minMinute, snapped)),
    dayStart: ctx.dayStart,
  };
  if (!main || !siblings) return missing<MapModel>(ctx, entityId, base);
  const attribution = attrString(main, "attribution");
  return { entityId, name: spotName(main, entityId), ...base, ...(attribution ? { attribution } : {}) };
}

function lookupSiblings(hass: Hass, id: string): Siblings | undefined {
  return hass.states[id] ? findSiblings(hass, id) : undefined;
}

/** Everything `sunspots-shadow-card` needs besides the rendered image. */
export function buildShadowViewModel(hass: Hass, config: ShadowCardConfig, now: Date): { title: string; map: MapModel } {
  const ctx = context(hass, now);
  return {
    title: config.title ?? translate(ctx.language, "default_title"),
    map: mapModel(ctx, lookupSiblings(hass, config.entity), config.entity, config.startHour, config.endHour),
  };
}

/** Build everything the card needs to render, without touching the DOM. */
export function buildViewModel(hass: Hass, config: CardConfig, now: Date): ViewModel {
  const ctx = context(hass, now);
  const title = config.title ?? translate(ctx.language, "default_title");

  if (config.mode === "map") {
    const id = config.entities[0] as string;
    const start = fixedHour(config.startHour, MAP_HOURS[0]);
    const end = fixedHour(config.endHour, MAP_HOURS[1]);
    return { mode: "map", title, map: mapModel(ctx, lookupSiblings(hass, id), id, start, end) };
  }
  if (config.mode === "timeline") {
    const rows = config.entities.map((id) => {
      const siblings = lookupSiblings(hass, id);
      return siblings
        ? timelineRow(ctx, siblings, id, config)
        : missing<TimelineRow>(ctx, id, {
            status: "unavailable",
            statusLabel: "",
            icon: STATUS_ICON.unavailable,
            days: [],
            ticks: [],
            legend: [],
            nowLabel: "",
          });
    });
    return { mode: "timeline", title, rows };
  }
  const rows = config.entities.map((id) => {
    const siblings = lookupSiblings(hass, id);
    return siblings
      ? overviewRow(ctx, siblings, id)
      : missing<OverviewRow>(ctx, id, { status: "unavailable", statusLabel: "", icon: STATUS_ICON.unavailable, extras: [] });
  });
  return { mode: "overview", title, rows };
}
