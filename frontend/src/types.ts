/** Minimal subset of the Home Assistant frontend types used by the card. */

export interface HassEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface HassEntityRegistryDisplay {
  entity_id: string;
  device_id?: string | null;
  platform?: string;
  translation_key?: string | null;
}

export interface Hass {
  states: Record<string, HassEntityState | undefined>;
  entities: Record<string, HassEntityRegistryDisplay | undefined>;
  locale?: { language?: string };
  language?: string;
  config: { time_zone: string };
  connection: {
    sendMessagePromise<T>(message: Record<string, unknown>): Promise<T>;
  };
}

export type CardMode = "overview" | "timeline" | "map";

export interface CardConfig {
  type: string;
  mode: CardMode;
  entities: string[];
  title?: string;
  startHour: number;
  endHour: number;
}

export type ForecastClass = "sunny" | "partly" | "unlikely";

export interface Segment {
  /** Minutes since local midnight today, clipped to the visible window. */
  start: number;
  end: number;
  kind: ForecastClass;
  past: boolean;
}
