export interface Strings {
  sunny: string;
  shaded: string;
  sunny_cloudy: string;
  unavailable: string;
  until: string;
  from: string;
  tomorrow: string;
  sun_expected_from: string;
  partly_expected_from: string;
  no_sun_today: string;
  sun_hours_today: string;
  cloud_coverage: string;
  legend_sunny: string;
  legend_partly: string;
  legend_unlikely: string;
  legend_geometry: string;
  now: string;
  timeline_alt: string;
  timeline_none: string;
  map_time: string;
  map_alt: string;
  map_loading: string;
  map_error: string;
  map_too_large: string;
  map_invalid: string;
  map_sun_below: string;
  azimuth: string;
  elevation: string;
  entity_missing: string;
  default_title: string;
  card_name: string;
  card_description: string;
}

export type StringKey = keyof Strings;
export type Dictionary = Partial<Record<StringKey, string>>;
export type Dictionaries = Record<string, Dictionary | undefined>;

const en: Strings = {
  sunny: "Sunny",
  shaded: "Shaded",
  sunny_cloudy: "Sun, but cloudy",
  unavailable: "Unavailable",
  until: "until {time}",
  from: "from {time}",
  tomorrow: "tomorrow",
  sun_expected_from: "sun expected from {time}",
  partly_expected_from: "partly sunny from {time}",
  no_sun_today: "no sun today",
  sun_hours_today: "{hours} h of sun today",
  cloud_coverage: "{percent}% clouds",
  legend_sunny: "Sunny",
  legend_partly: "Partly sunny",
  legend_unlikely: "Sun unlikely",
  legend_geometry: "Sun (no weather forecast)",
  now: "Now",
  timeline_alt: "{name}: {summary}",
  timeline_none: "no sun in this period",
  map_time: "Shown for {time}",
  map_alt: "Shadow map of {name} at {time}",
  map_loading: "Loading map…",
  map_error: "The map could not be loaded: {message}",
  map_too_large: "The map is too large to display.",
  map_invalid: "The map response was invalid.",
  map_sun_below: "The sun is below the horizon.",
  azimuth: "Azimuth",
  elevation: "Elevation",
  entity_missing: "Entity not found: {entity}",
  default_title: "Sunspots",
  card_name: "Sunspots",
  card_description: "Sun and shade status, timeline and shadow map for your spots",
};

const de: Strings = {
  sunny: "Sonnig",
  shaded: "Schatten",
  sunny_cloudy: "Sonne, aber bewölkt",
  unavailable: "Nicht verfügbar",
  until: "bis {time}",
  from: "ab {time}",
  tomorrow: "morgen",
  sun_expected_from: "Sonne erwartet ab {time}",
  partly_expected_from: "teils sonnig ab {time}",
  no_sun_today: "heute keine Sonne",
  sun_hours_today: "{hours} Std. Sonne heute",
  cloud_coverage: "{percent} % Wolken",
  legend_sunny: "Sonnig",
  legend_partly: "Teils sonnig",
  legend_unlikely: "Sonne unwahrscheinlich",
  legend_geometry: "Sonne (ohne Wettervorhersage)",
  now: "Jetzt",
  timeline_alt: "{name}: {summary}",
  timeline_none: "keine Sonne in diesem Zeitraum",
  map_time: "Dargestellt für {time}",
  map_alt: "Schattenkarte von {name} um {time}",
  map_loading: "Karte wird geladen …",
  map_error: "Die Karte konnte nicht geladen werden: {message}",
  map_too_large: "Die Karte ist zu groß für die Anzeige.",
  map_invalid: "Die Antwort für die Karte war ungültig.",
  map_sun_below: "Die Sonne steht unter dem Horizont.",
  azimuth: "Azimut",
  elevation: "Höhe",
  entity_missing: "Entität nicht gefunden: {entity}",
  default_title: "Sunspots",
  card_name: "Sunspots",
  card_description: "Sonnen- und Schattenstatus, Zeitleiste und Schattenkarte für deine Orte",
};

export const DICTIONARIES: Dictionaries = { en, de };

/** Reduce "de-AT" / "DE" to a lowercase primary subtag. */
export function normalizeLanguage(language: string | undefined): string {
  return (language ?? "en").toLowerCase().split(/[-_]/)[0] || "en";
}

/** Look up a UI string; falls back to English, then to the key itself. */
export function translate(
  language: string | undefined,
  key: StringKey,
  vars: Record<string, string | number> = {},
  dictionaries: Dictionaries = DICTIONARIES,
): string {
  const template = dictionaries[normalizeLanguage(language)]?.[key] ?? dictionaries["en"]?.[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
