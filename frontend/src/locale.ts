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
  timeline_bar_alt: string;
  timeline_none: string;
  day_today: string;
  day_tomorrow: string;
  sun_summary: string;
  partly_summary: string;
  no_direct_sun: string;
  first_sun: string;
  hours_short: string;
  refresh: string;
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
  shadow_card_name: string;
  shadow_card_description: string;
  editor_mode: string;
  editor_mode_overview: string;
  editor_mode_timeline: string;
  editor_mode_map: string;
  editor_entities: string;
  editor_entities_helper: string;
  editor_entity: string;
  editor_entity_helper: string;
  editor_title: string;
  editor_show_today: string;
  editor_show_tomorrow: string;
  editor_full_day: string;
  editor_full_day_helper: string;
  editor_start_hour: string;
  editor_end_hour: string;
  editor_hours_helper_timeline: string;
  editor_hours_helper_slider: string;
  editor_theme: string;
  editor_theme_helper: string;
  editor_theme_auto: string;
  editor_theme_light: string;
  editor_theme_dark: string;
  editor_refresh_minutes: string;
  editor_refresh_minutes_helper: string;
  editor_show_slider: string;
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
  timeline_bar_alt: "{name}, {day}: {summary}",
  timeline_none: "no sun in this period",
  day_today: "Today",
  day_tomorrow: "Tomorrow",
  sun_summary: "Sun: {ranges} · {hours}",
  partly_summary: "Partly sunny: {ranges} · {hours}",
  no_direct_sun: "No direct sun",
  first_sun: "first sun {time}",
  hours_short: "{hours} h",
  refresh: "Refresh",
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
  shadow_card_name: "Sunspots shadow map",
  shadow_card_description: "Current shadow map of one spot, refreshed automatically, with dark mode",
  editor_mode: "Card view",
  editor_mode_overview: "Overview",
  editor_mode_timeline: "Timeline",
  editor_mode_map: "Shadow map",
  editor_entities: "Spots",
  editor_entities_helper: "Sunny sensors (binary_sensor.<spot>_sunny) of the Sunspots integration",
  editor_entity: "Spot",
  editor_entity_helper: "The spot's sunny sensor (binary_sensor.<spot>_sunny)",
  editor_title: "Title",
  editor_show_today: "Show today",
  editor_show_tomorrow: "Show tomorrow",
  editor_full_day: "Full day (0-24 h)",
  editor_full_day_helper: "Always shows the whole day, ignoring start and end hour",
  editor_start_hour: "Start hour",
  editor_end_hour: "End hour",
  editor_hours_helper_timeline: "Hour 0-24; empty means automatic",
  editor_hours_helper_slider: "Hour 0-24 for the time slider range",
  editor_theme: "Theme of the map",
  editor_theme_helper: "Automatic follows the Home Assistant dark mode",
  editor_theme_auto: "Automatic",
  editor_theme_light: "Light",
  editor_theme_dark: "Dark",
  editor_refresh_minutes: "Refresh interval (minutes)",
  editor_refresh_minutes_helper: "1 to 60 minutes",
  editor_show_slider: "Show time slider",
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
  timeline_bar_alt: "{name}, {day}: {summary}",
  timeline_none: "keine Sonne in diesem Zeitraum",
  day_today: "Heute",
  day_tomorrow: "Morgen",
  sun_summary: "Sonne: {ranges} · {hours}",
  partly_summary: "Teils sonnig: {ranges} · {hours}",
  no_direct_sun: "Keine direkte Sonne",
  first_sun: "erste Sonne {time}",
  hours_short: "{hours} Std.",
  refresh: "Aktualisieren",
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
  shadow_card_name: "Sunspots Schattenkarte",
  shadow_card_description: "Aktuelle Schattenkarte eines Ortes, automatisch aktualisiert, mit Dunkelmodus",
  editor_mode: "Ansicht",
  editor_mode_overview: "Übersicht",
  editor_mode_timeline: "Zeitleiste",
  editor_mode_map: "Schattenkarte",
  editor_entities: "Orte",
  editor_entities_helper: "Sonnig-Sensoren (binary_sensor.<ort>_sunny) der Sunspots-Integration",
  editor_entity: "Ort",
  editor_entity_helper: "Der Sonnig-Sensor des Ortes (binary_sensor.<ort>_sunny)",
  editor_title: "Titel",
  editor_show_today: "Heute anzeigen",
  editor_show_tomorrow: "Morgen anzeigen",
  editor_full_day: "Ganzer Tag (0-24 Uhr)",
  editor_full_day_helper: "Zeigt immer den ganzen Tag, Start- und Endstunde werden ignoriert",
  editor_start_hour: "Startstunde",
  editor_end_hour: "Endstunde",
  editor_hours_helper_timeline: "Stunde 0-24; leer bedeutet automatisch",
  editor_hours_helper_slider: "Stunde 0-24 für den Bereich des Zeitreglers",
  editor_theme: "Darstellung der Karte",
  editor_theme_helper: "Automatisch folgt dem Dunkelmodus von Home Assistant",
  editor_theme_auto: "Automatisch",
  editor_theme_light: "Hell",
  editor_theme_dark: "Dunkel",
  editor_refresh_minutes: "Aktualisierung (Minuten)",
  editor_refresh_minutes_helper: "1 bis 60 Minuten",
  editor_show_slider: "Zeitregler anzeigen",
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
