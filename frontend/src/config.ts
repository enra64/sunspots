import type { CardConfig, CardMode, HourSetting, ShadowCardConfig, ThemeOption } from "./types";

const MODES: readonly CardMode[] = ["overview", "timeline", "map"];
const ENTITY_ID = /^binary_sensor\.[a-z0-9_]+$/;

const THEMES: readonly ThemeOption[] = ["auto", "light", "dark"];

export const DEFAULT_REFRESH_MINUTES = 5;
export const MIN_REFRESH_MINUTES = 1;
export const MAX_REFRESH_MINUTES = 60;

/** Default visible hours; the timeline derives them from the sun intervals. */
export const DEFAULT_HOURS: Record<CardMode, readonly [HourSetting, HourSetting]> = {
  overview: [6, 22],
  timeline: ["auto", "auto"],
  map: [4, 23],
};

export const MAP_HOURS: readonly [number, number] = [4, 23];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fixedHour(raw: unknown, name: string, fallback: number): number {
  if (raw === undefined) return fallback;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw > 24) {
    throw new Error(`Invalid configuration: "${name}" must be an integer between 0 and 24`);
  }
  return raw;
}

function hourOption(raw: unknown, name: string, fallback: HourSetting, allowAuto: boolean): HourSetting {
  if (raw === undefined) return fallback;
  if (allowAuto && raw === "auto") return raw;
  return fixedHour(raw, name, 0);
}

function entityId(raw: unknown): string {
  if (typeof raw !== "string" || !ENTITY_ID.test(raw)) {
    throw new Error(
      `Invalid configuration: "${String(raw)}" is not a binary_sensor entity id (use the spot's "..._sunny" entity)`,
    );
  }
  return raw;
}

/** Validate a raw Lovelace config and fill in defaults. Throws a descriptive Error. */
export function parseConfig(raw: unknown): CardConfig {
  if (!isRecord(raw)) throw new Error("Invalid configuration: expected an object");

  const mode: CardMode = (() => {
    if (raw["mode"] === undefined) return "overview";
    const found = MODES.find((m) => m === raw["mode"]);
    if (!found) {
      throw new Error(`Invalid configuration: "mode" must be one of ${MODES.join(", ")}`);
    }
    return found;
  })();

  const { entities, entity } = raw;
  if (entities !== undefined && entity !== undefined) {
    throw new Error('Invalid configuration: use either "entity" or "entities", not both');
  }
  let ids: string[];
  if (entities !== undefined) {
    if (!Array.isArray(entities)) {
      throw new Error('Invalid configuration: "entities" must be a list of entity ids');
    }
    ids = entities.map(entityId);
  } else if (entity !== undefined) {
    ids = [entityId(entity)];
  } else {
    ids = [];
  }
  if (ids.length === 0) {
    throw new Error('Invalid configuration: "entity" or "entities" is required');
  }

  const title = raw["title"];
  if (title !== undefined && typeof title !== "string") {
    throw new Error('Invalid configuration: "title" must be a string');
  }

  const [defStart, defEnd] = DEFAULT_HOURS[mode];
  const allowAuto = mode === "timeline";
  const startHour = hourOption(raw["start_hour"], "start_hour", defStart, allowAuto);
  const endHour = hourOption(raw["end_hour"], "end_hour", defEnd, allowAuto);
  if (typeof startHour === "number" && typeof endHour === "number" && startHour >= endHour) {
    throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');
  }

  const showToday = flag(raw["show_today"], "show_today", true);
  const showTomorrow = flag(raw["show_tomorrow"], "show_tomorrow", true);
  if (mode === "timeline" && !showToday && !showTomorrow) {
    throw new Error('Invalid configuration: "show_today" and "show_tomorrow" cannot both be false, show at least one day');
  }
  const fullDay = flag(raw["full_day"], "full_day", false);

  const type = typeof raw["type"] === "string" ? raw["type"] : "custom:sunspots-card";
  return { type, mode, entities: ids, ...(title !== undefined ? { title } : {}), startHour, endHour, showToday, showTomorrow, fullDay };
}

function flag(raw: unknown, name: string, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  if (typeof raw !== "boolean") throw new Error(`Invalid configuration: "${name}" must be true or false`);
  return raw;
}

function choice<T extends string>(raw: unknown, allowed: readonly T[], fallback: T, name: string): T {
  if (raw === undefined) return fallback;
  const found = allowed.find((a) => a === raw);
  if (!found) throw new Error(`Invalid configuration: "${name}" must be one of ${allowed.join(", ")}`);
  return found;
}

/** Refresh interval in whole minutes, clamped to 1-60. */
export function clampRefreshMinutes(raw: unknown): number {
  if (raw === undefined) return DEFAULT_REFRESH_MINUTES;
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new Error('Invalid configuration: "refresh_minutes" must be a number');
  }
  return Math.min(MAX_REFRESH_MINUTES, Math.max(MIN_REFRESH_MINUTES, Math.round(raw)));
}

/** Validate the config of `custom:sunspots-shadow-card`. */
export function parseShadowConfig(raw: unknown): ShadowCardConfig {
  if (!isRecord(raw)) throw new Error("Invalid configuration: expected an object");

  const { entity, entities } = raw;
  let first: unknown = entity;
  if (first === undefined) {
    if (entities !== undefined && !Array.isArray(entities)) {
      throw new Error('Invalid configuration: "entities" must be a list of entity ids');
    }
    first = (entities as unknown[] | undefined)?.[0];
  }
  if (first === undefined) throw new Error('Invalid configuration: "entity" is required');

  const title = raw["title"];
  if (title !== undefined && typeof title !== "string") {
    throw new Error('Invalid configuration: "title" must be a string');
  }
  const showSlider = flag(raw["show_slider"], "show_slider", false);

  const startHour = fixedHour(raw["start_hour"], "start_hour", MAP_HOURS[0]);
  const endHour = fixedHour(raw["end_hour"], "end_hour", MAP_HOURS[1]);
  if (startHour >= endHour) {
    throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');
  }

  return {
    type: typeof raw["type"] === "string" ? raw["type"] : "custom:sunspots-shadow-card",
    entity: entityId(first),
    ...(title !== undefined ? { title } : {}),
    theme: choice(raw["theme"], THEMES, "auto", "theme"),
    refreshMinutes: clampRefreshMinutes(raw["refresh_minutes"]),
    showSlider,
    startHour,
    endHour,
  };
}
