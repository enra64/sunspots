import type { Hass, Theme, ThemeOption } from "./types";

/** "auto" follows the Home Assistant theme mode. */
export function resolveTheme(option: ThemeOption, hass: Hass): Theme {
  if (option === "auto") return hass.themes?.darkMode === true ? "dark" : "light";
  return option;
}
