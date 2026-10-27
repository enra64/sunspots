import type { Hass, HassEntityRegistryDisplay, HassEntityState } from "../src/types";

/** 2026-10-27 11:00 in Europe/Berlin (UTC+1). */
export const NOW = new Date("2026-10-27T10:00:00Z");
export const TZ = "Europe/Berlin";

export function makeHass(
  states: HassEntityState[],
  entities: HassEntityRegistryDisplay[],
  language = "en-GB",
  darkMode?: boolean,
): Hass {
  return {
    states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
    entities: Object.fromEntries(entities.map((e) => [e.entity_id, e])),
    locale: { language },
    config: { time_zone: TZ },
    ...(darkMode === undefined ? {} : { themes: { darkMode } }),
    connection: {
      sendMessagePromise: () => Promise.reject(new Error("not used")),
    },
  };
}

function reg(id: string, device: string, key: string, platform = "sunspots"): HassEntityRegistryDisplay {
  return { entity_id: id, device_id: device, platform, translation_key: key };
}

export interface SpotOptions {
  sunny?: "on" | "off";
  aware?: "on" | "off";
  cloud?: number;
  nextChange?: string;
  forecast?: { state: string; attributes?: Record<string, unknown> };
  intervals?: [string, string][];
  /** Set to emit `intervals_tomorrow` on the binary sensor. */
  intervalsTomorrow?: [string, string][];
  tomorrow?: { state: string; attributes?: Record<string, unknown> };
  hours?: string;
}

/** Entities + states for one spot "garden" (device d1). */
export function spot(slug: string, opts: SpotOptions = {}) {
  const device = `dev_${slug}`;
  const states: HassEntityState[] = [];
  const entities: HassEntityRegistryDisplay[] = [];
  const add = (domain: string, key: string, state: string, attributes: Record<string, unknown> = {}) => {
    const id = `${domain}.${slug}_${key}`;
    entities.push(reg(id, device, key));
    states.push({ entity_id: id, state, attributes });
  };
  add("binary_sensor", "sunny", opts.sunny ?? "on", {
    friendly_name: `${slug} Sunny`,
    attribution: "Data by Example",
    intervals_today: opts.intervals ?? [],
    ...(opts.intervalsTomorrow ? { intervals_tomorrow: opts.intervalsTomorrow } : {}),
  });
  if (opts.aware) {
    add("binary_sensor", "sunny_weather_aware", opts.aware, { cloud_coverage: opts.cloud ?? null, cloud_known: opts.cloud !== undefined });
  }
  if (opts.nextChange) add("sensor", "next_change", opts.nextChange);
  if (opts.hours) add("sensor", "sun_hours_today", opts.hours);
  if (opts.forecast) add("sensor", "sun_forecast", opts.forecast.state, opts.forecast.attributes ?? {});
  if (opts.tomorrow) add("sensor", "sun_tomorrow", opts.tomorrow.state, opts.tomorrow.attributes ?? {});
  return { states, entities };
}

export function hassWith(spots: ReturnType<typeof spot>[], language = "en-GB"): Hass {
  return makeHass(
    spots.flatMap((s) => s.states),
    spots.flatMap((s) => s.entities),
    language,
  );
}
