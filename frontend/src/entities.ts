import type { Hass, HassEntityState } from "./types";

export const SIBLING_KEYS = [
  "sunny",
  "sunny_weather_aware",
  "next_change",
  "sun_remaining",
  "sun_hours_today",
  "sun_forecast",
] as const;

export type SiblingKey = (typeof SIBLING_KEYS)[number];
export type Siblings = Partial<Record<SiblingKey, string>>;

function isSiblingKey(key: string | null | undefined): key is SiblingKey {
  return SIBLING_KEYS.some((k) => k === key);
}

/** Find all entities of the same device as `entityId`, keyed by translation_key. */
export function findSiblings(hass: Hass, entityId: string): Siblings | undefined {
  const main = hass.entities[entityId];
  if (!main?.device_id) return undefined;
  const result: Siblings = {};
  for (const [id, entry] of Object.entries(hass.entities)) {
    if (!entry || entry.device_id !== main.device_id || entry.platform !== main.platform) continue;
    if (isSiblingKey(entry.translation_key) && result[entry.translation_key] === undefined) {
      result[entry.translation_key] = id;
    }
  }
  result.sunny = entityId;
  return result;
}

/** First Sunspots "sunny" binary_sensor, preferring the candidate list when given. */
export function pickStubEntity(hass: Hass, candidates: readonly string[]): string | undefined {
  const pool = candidates.length > 0 ? candidates : Object.keys(hass.entities);
  return pool.find((id) => {
    const entry = hass.entities[id];
    return (
      id.startsWith("binary_sensor.") &&
      entry?.platform === "sunspots" &&
      entry.translation_key === "sunny"
    );
  });
}

export function isUnavailable(state: HassEntityState | undefined): boolean {
  return !state || state.state === "unavailable" || state.state === "unknown";
}

export function attrString(state: HassEntityState | undefined, name: string): string | undefined {
  const value = state?.attributes[name];
  return typeof value === "string" && value !== "" ? value : undefined;
}

export function attrNumber(state: HassEntityState | undefined, name: string): number | undefined {
  const value = state?.attributes[name];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
