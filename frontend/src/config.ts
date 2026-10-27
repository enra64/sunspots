import type { CardConfig, CardMode } from "./types";

const MODES: readonly CardMode[] = ["overview", "timeline", "map"];
const ENTITY_ID = /^binary_sensor\.[a-z0-9_]+$/;

const DEFAULT_HOURS: Record<CardMode, readonly [number, number]> = {
  overview: [6, 22],
  timeline: [6, 22],
  map: [4, 23],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hourOption(raw: unknown, name: string, fallback: number): number {
  if (raw === undefined) return fallback;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw > 24) {
    throw new Error(`Invalid configuration: "${name}" must be an integer between 0 and 24`);
  }
  return raw;
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
  const startHour = hourOption(raw["start_hour"], "start_hour", defStart);
  const endHour = hourOption(raw["end_hour"], "end_hour", defEnd);
  if (startHour >= endHour) {
    throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');
  }

  const type = typeof raw["type"] === "string" ? raw["type"] : "custom:sunspots-card";
  return { type, mode, entities: ids, ...(title !== undefined ? { title } : {}), startHour, endHour };
}
