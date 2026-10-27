import { type StringKey, translate } from "./locale";

/** One `ha-form` schema entry; the selectors are those of Home Assistant's UI. */
export interface FormField {
  name: string;
  required?: boolean;
  selector: Record<string, unknown>;
}

export type FormSchema = FormField[];
export type RawConfig = Record<string, unknown>;

const LABEL_KEYS: Record<string, StringKey> = {
  mode: "editor_mode",
  entities: "editor_entities",
  entity: "editor_entity",
  title: "editor_title",
  show_today: "editor_show_today",
  show_tomorrow: "editor_show_tomorrow",
  full_day: "editor_full_day",
  start_hour: "editor_start_hour",
  end_hour: "editor_end_hour",
  theme: "editor_theme",
  refresh_minutes: "editor_refresh_minutes",
  show_slider: "editor_show_slider",
};

const HELPER_KEYS: Record<string, StringKey> = {
  entities: "editor_entities_helper",
  entity: "editor_entity_helper",
  full_day: "editor_full_day_helper",
  theme: "editor_theme_helper",
  refresh_minutes: "editor_refresh_minutes_helper",
};

const MODE_KEYS = {
  overview: "editor_mode_overview",
  timeline: "editor_mode_timeline",
  map: "editor_mode_map",
} as const satisfies Record<string, StringKey>;

const THEME_KEYS = {
  auto: "editor_theme_auto",
  light: "editor_theme_light",
  dark: "editor_theme_dark",
} as const satisfies Record<string, StringKey>;

export type EditorMode = keyof typeof MODE_KEYS;

const HOUR_SELECTOR = { number: { min: 0, max: 24, step: 1, mode: "box" } };

/** Mode of a (possibly partial or invalid) card config; unknown values count as overview. */
export function modeOf(config: RawConfig): EditorMode {
  const mode = config["mode"];
  return mode === "timeline" || mode === "map" ? mode : "overview";
}

function options<K extends string>(keys: Record<K, StringKey>, language: string): { value: K; label: string }[] {
  return (Object.keys(keys) as K[]).map((value) => ({ value, label: translate(language, keys[value]) }));
}

/** Form fields of `custom:sunspots-card`, depending on the mode and on `full_day`. */
export function cardSchema(config: RawConfig, language: string): FormSchema {
  const mode = modeOf(config);
  const schema: FormSchema = [
    { name: "mode", selector: { select: { mode: "dropdown", options: options(MODE_KEYS, language) } } },
    {
      name: "entities",
      required: true,
      selector: { entity: { multiple: true, integration: "sunspots", domain: "binary_sensor" } },
    },
    { name: "title", selector: { text: {} } },
  ];
  if (mode === "timeline") {
    schema.push(
      { name: "show_today", selector: { boolean: {} } },
      { name: "show_tomorrow", selector: { boolean: {} } },
      { name: "full_day", selector: { boolean: {} } },
    );
    if (config["full_day"] !== true) {
      schema.push({ name: "start_hour", selector: HOUR_SELECTOR }, { name: "end_hour", selector: HOUR_SELECTOR });
    }
  } else if (mode === "map") {
    schema.push({ name: "start_hour", selector: HOUR_SELECTOR }, { name: "end_hour", selector: HOUR_SELECTOR });
  }
  return schema;
}

/** Form fields of `custom:sunspots-shadow-card`; the slider range only while the slider is on. */
export function shadowSchema(config: RawConfig, language: string): FormSchema {
  const schema: FormSchema = [
    { name: "entity", required: true, selector: { entity: { integration: "sunspots", domain: "binary_sensor" } } },
    { name: "title", selector: { text: {} } },
    { name: "theme", selector: { select: { mode: "dropdown", options: options(THEME_KEYS, language) } } },
    { name: "refresh_minutes", selector: { number: { min: 1, max: 60, step: 1, mode: "box" } } },
    { name: "show_slider", selector: { boolean: {} } },
  ];
  if (config["show_slider"] === true) {
    schema.push({ name: "start_hour", selector: HOUR_SELECTOR }, { name: "end_hour", selector: HOUR_SELECTOR });
  }
  return schema;
}

export function editorLabel(name: string, language: string): string {
  const key = LABEL_KEYS[name];
  return key ? translate(language, key) : name;
}

/** Where the hour fields appear: the timeline (empty = auto) or a slider range. */
export type HourScope = "timeline" | "slider";

/** Helper text below a field; empty when the field has none. */
export function editorHelper(name: string, language: string, hours: HourScope): string {
  if (name === "start_hour" || name === "end_hour") {
    return translate(language, hours === "timeline" ? "editor_hours_helper_timeline" : "editor_hours_helper_slider");
  }
  const key = HELPER_KEYS[name];
  return key ? translate(language, key) : "";
}
