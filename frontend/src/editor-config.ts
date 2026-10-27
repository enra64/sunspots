import { DEFAULT_REFRESH_MINUTES, DEFAULT_HOURS, MAP_HOURS, MAX_REFRESH_MINUTES, MIN_REFRESH_MINUTES } from "./config";
import { modeOf, type RawConfig } from "./editor-schema";

const CARD_TYPE = "custom:sunspots-card";
const SHADOW_TYPE = "custom:sunspots-shadow-card";

/** Keys the editors manage, in the order they are written; everything else is kept untouched. */
const CARD_KEYS = ["type", "mode", "entities", "entity", "title", "show_today", "show_tomorrow", "full_day", "start_hour", "end_hour"];
const SHADOW_KEYS = ["type", "entity", "entities", "title", "theme", "refresh_minutes", "show_slider", "start_hour", "end_hour"];

/** Any value as a config object: partial, invalid or missing configs become `{}`. */
export function toRecord(config: unknown): RawConfig {
  return typeof config === "object" && config !== null && !Array.isArray(config) ? { ...(config as RawConfig) } : {};
}

function entityList(raw: unknown): string[] {
  const list = Array.isArray(raw) ? (raw as unknown[]) : [raw];
  return list.filter((item): item is string => typeof item === "string" && item !== "");
}

/** `entities` when it holds anything, else the single `entity`. */
function entitiesOf(config: RawConfig): string[] {
  const list = entityList(config["entities"]);
  return list.length > 0 ? list : entityList(config["entity"]);
}

function number(raw: unknown): number | undefined {
  const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Integer hour 0-24, or undefined for empty, "auto", invalid or default values. */
function hour(raw: unknown, defaultHour: number | undefined): number | undefined {
  const value = number(raw);
  if (value === undefined) return undefined;
  const rounded = Math.min(24, Math.max(0, Math.round(value)));
  return rounded === defaultHour ? undefined : rounded;
}

function nonBlank(raw: unknown): string | undefined {
  return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
}

function assemble(known: readonly string[], managed: RawConfig, value: RawConfig, prev: RawConfig): RawConfig {
  const out: RawConfig = {};
  for (const key of known) {
    if (managed[key] !== undefined) out[key] = managed[key];
  }
  for (const source of [prev, value]) {
    for (const [key, item] of Object.entries(source)) {
      if (!known.includes(key) && item !== undefined) out[key] = item;
    }
  }
  return out;
}

/** The values `ha-form` displays for a card config: defaults filled in, `entity` folded into `entities`. */
export function cardFormData(config: RawConfig): RawConfig {
  const { entity: _entity, ...rest } = config;
  const mode = modeOf(config);
  return {
    ...rest,
    mode,
    entities: entitiesOf(config),
    show_today: config["show_today"] !== false,
    show_tomorrow: config["show_tomorrow"] !== false,
    full_day: config["full_day"] === true,
    ...(mode === "map"
      ? { start_hour: number(config["start_hour"]) ?? MAP_HOURS[0], end_hour: number(config["end_hour"]) ?? MAP_HOURS[1] }
      : {}),
  };
}

/**
 * Turn the data emitted by `ha-form` into a tidy card config: defaults and empty values are
 * dropped (`type` stays), `entity` becomes `entities`, unknown keys of `prev` and `value` survive.
 */
export function normalizeCardConfig(value: RawConfig, prev: RawConfig = {}): RawConfig {
  const mode = modeOf(value);
  const [defStart, defEnd] = DEFAULT_HOURS[mode];
  const numeric = (setting: unknown) => (typeof setting === "number" ? setting : undefined);
  const managed: RawConfig = {
    type: typeof value["type"] === "string" ? value["type"] : (nonBlank(prev["type"]) ?? CARD_TYPE),
    mode: mode === "overview" ? undefined : mode,
    entities: entitiesOf(value),
    title: nonBlank(value["title"]),
    show_today: value["show_today"] === false ? false : undefined,
    show_tomorrow: value["show_tomorrow"] === false ? false : undefined,
    full_day: value["full_day"] === true ? true : undefined,
    start_hour: hour(value["start_hour"], numeric(defStart)),
    end_hour: hour(value["end_hour"], numeric(defEnd)),
  };
  return assemble(CARD_KEYS, managed, value, prev);
}

/** The values `ha-form` displays for a shadow card config. */
export function shadowFormData(config: RawConfig): RawConfig {
  const { entities, ...rest } = config;
  return {
    ...rest,
    entity: nonBlank(config["entity"]) ?? entityList(entities)[0] ?? "",
    theme: config["theme"] ?? "auto",
    refresh_minutes: number(config["refresh_minutes"]) ?? DEFAULT_REFRESH_MINUTES,
    show_slider: config["show_slider"] === true,
    start_hour: number(config["start_hour"]) ?? MAP_HOURS[0],
    end_hour: number(config["end_hour"]) ?? MAP_HOURS[1],
  };
}

/** Like `normalizeCardConfig`, for `custom:sunspots-shadow-card`. */
export function normalizeShadowConfig(value: RawConfig, prev: RawConfig = {}): RawConfig {
  const refresh = number(value["refresh_minutes"]);
  const clamped = refresh === undefined ? undefined : Math.min(MAX_REFRESH_MINUTES, Math.max(MIN_REFRESH_MINUTES, Math.round(refresh)));
  const theme = value["theme"];
  const managed: RawConfig = {
    type: typeof value["type"] === "string" ? value["type"] : (nonBlank(prev["type"]) ?? SHADOW_TYPE),
    entity: nonBlank(value["entity"]) ?? entityList(value["entities"])[0] ?? "",
    title: nonBlank(value["title"]),
    theme: theme === "light" || theme === "dark" ? theme : undefined,
    refresh_minutes: clamped === DEFAULT_REFRESH_MINUTES ? undefined : clamped,
    show_slider: value["show_slider"] === true ? true : undefined,
    start_hour: hour(value["start_hour"], MAP_HOURS[0]),
    end_hour: hour(value["end_hour"], MAP_HOURS[1]),
  };
  return assemble(SHADOW_KEYS, managed, value, prev);
}

/** The standard Lovelace editor event carrying the new config. */
export function configChangedEvent(config: RawConfig): CustomEvent<{ config: RawConfig }> {
  return new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true });
}
