import { attrNumber, attrString, findSiblings, isUnavailable, type Siblings } from "./entities";
import { formatBoundary, formatClock } from "./format";
import { computeTimeline, type ForecastWindow, type Range, type TimelineModel } from "./intervals";
import { type StringKey, translate } from "./locale";
import { dayStartWall, nowMinutes, toWallMinutes } from "./time";
import type { CardConfig, ForecastClass, Hass, HassEntityState } from "./types";

export const MAP_STEP_MINUTES = 10;

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
  label: string;
}

export interface TimelineBar {
  /** Percent of the bar width. */
  left: number;
  width: number;
  kind: ForecastClass;
  past: boolean;
}

export interface TimelineRow extends RowBase {
  timeline: TimelineModel;
  bars: TimelineBar[];
  /** True when the bar shows forecast classes rather than pure geometry. */
  usesForecast: boolean;
  legend: LegendItem[];
  ticks: TimelineTick[];
  /** Text alternative for the bar. */
  summary: string;
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

function intervalsToday(ctx: Context, state: HassEntityState | undefined): Range[] {
  const raw = state?.attributes["intervals_today"];
  if (!Array.isArray(raw)) return [];
  const result: Range[] = [];
  for (const pair of raw as unknown[]) {
    if (!Array.isArray(pair)) continue;
    const start = minutesOf(ctx, pair[0]);
    const end = minutesOf(ctx, pair[1]);
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

function overviewStatus(main: HassEntityState | undefined, aware: HassEntityState | undefined): Status {
  if (isUnavailable(main)) return "unavailable";
  if (main?.state !== "on") return "shaded";
  if (aware && !isUnavailable(aware) && aware.state === "off") return "sunny_cloudy";
  return "sunny";
}

function overviewRow(ctx: Context, siblings: Siblings, entityId: string): OverviewRow {
  const main = ctx.hass.states[entityId];
  const aware = stateOf(ctx, siblings.sunny_weather_aware);
  const status = overviewStatus(main, aware);
  const t = (key: StringKey, vars?: Record<string, string | number>) => translate(ctx.language, key, vars);
  const row: OverviewRow = {
    entityId,
    name: spotName(main, entityId),
    status,
    statusLabel: t(status),
    icon: STATUS_ICON[status],
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
    row.extras.push(t("sun_hours_today", { hours: new Intl.NumberFormat(ctx.language ?? "en", { maximumFractionDigits: 1 }).format(hours) }));
  }
  const cloud = attrNumber(aware, "cloud_coverage");
  if (cloud !== undefined && status !== "shaded" && status !== "unavailable") {
    row.extras.push(t("cloud_coverage", { percent: Math.round(cloud) }));
  }
  return row;
}

function ticks(ctx: Context, startMin: number, endMin: number): TimelineTick[] {
  const step = (endMin - startMin) / 60 <= 10 ? 60 : 120;
  const result: TimelineTick[] = [];
  for (let m = Math.ceil(startMin / step) * step; m <= endMin; m += step) {
    result.push({ percent: ((m - startMin) / (endMin - startMin)) * 100, label: formatClock(m, ctx.language) });
  }
  return result;
}

function timelineRow(ctx: Context, siblings: Siblings, entityId: string, config: CardConfig): TimelineRow {
  const main = ctx.hass.states[entityId];
  const startMin = config.startHour * 60;
  const endMin = config.endHour * 60;
  const windows = forecastWindows(ctx, stateOf(ctx, siblings.sun_forecast));
  const timeline = computeTimeline({
    geometry: intervalsToday(ctx, main),
    forecast: windows,
    windowStart: startMin,
    windowEnd: endMin,
    now: ctx.now,
  });
  const usesForecast = timeline.forecast.length > 0;
  const segments = usesForecast ? timeline.forecast : timeline.geometry;
  const t = (key: StringKey, vars?: Record<string, string | number>) => translate(ctx.language, key, vars);

  const label = (kind: ForecastClass | "geometry") => t(LEGEND_KEY[kind]);
  const parts = segments.map(
    (s) =>
      `${label(usesForecast ? s.kind : "geometry")} ${formatClock(s.start, ctx.language)}–${formatClock(s.end, ctx.language)}`,
  );
  const name = spotName(main, entityId);
  const legendKinds: (ForecastClass | "geometry")[] = usesForecast ? ["sunny", "partly", "unlikely"] : ["geometry"];

  const span = endMin - startMin;
  const bars = segments.map(
    (s): TimelineBar => ({
      left: ((s.start - startMin) / span) * 100,
      width: ((s.end - s.start) / span) * 100,
      kind: s.kind,
      past: s.past,
    }),
  );

  return {
    entityId,
    name,
    timeline,
    bars,
    usesForecast,
    legend: legendKinds.map((kind) => ({ kind, label: label(kind) })),
    ticks: ticks(ctx, startMin, endMin),
    summary: t("timeline_alt", { name, summary: parts.length > 0 ? parts.join("; ") : t("timeline_none") }),
    nowLabel: t("now"),
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

function mapModel(ctx: Context, siblings: Siblings | undefined, entityId: string, config: CardConfig): MapModel {
  const main = ctx.hass.states[entityId];
  const minMinute = config.startHour * 60;
  const maxMinute = config.endHour * 60;
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

/** Build everything the card needs to render, without touching the DOM. */
export function buildViewModel(hass: Hass, config: CardConfig, now: Date): ViewModel {
  const ctx = context(hass, now);
  const title = config.title ?? translate(ctx.language, "default_title");
  const lookup = (id: string) => (hass.states[id] ? findSiblings(hass, id) : undefined);

  if (config.mode === "map") {
    const id = config.entities[0] as string;
    return { mode: "map", title, map: mapModel(ctx, lookup(id), id, config) };
  }
  if (config.mode === "timeline") {
    const rows = config.entities.map((id) => {
      const siblings = lookup(id);
      return siblings
        ? timelineRow(ctx, siblings, id, config)
        : missing<TimelineRow>(ctx, id, {
            timeline: { geometry: [], forecast: [], nowPercent: undefined },
            bars: [],
            usesForecast: false,
            legend: [],
            ticks: [],
            summary: "",
            nowLabel: "",
          });
    });
    return { mode: "timeline", title, rows };
  }
  const rows = config.entities.map((id) => {
    const siblings = lookup(id);
    return siblings
      ? overviewRow(ctx, siblings, id)
      : missing<OverviewRow>(ctx, id, { status: "unavailable", statusLabel: "", icon: STATUS_ICON.unavailable, extras: [] });
  });
  return { mode: "overview", title, rows };
}
