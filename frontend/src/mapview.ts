import { css, html, nothing, type TemplateResult } from "lit";
import { formatClock, formatDegrees, formatWhen } from "./format";
import { type StringKey, translate } from "./locale";
import type { MapState } from "./maploader";
import { toWallMinutes } from "./time";
import type { Hass } from "./types";
import type { MapModel } from "./viewmodel";

function translator(lang: string) {
  return (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

/** Time of the shown render in words; falls back to the slider time while nothing was rendered. */
export function renderedTimeLabel(state: MapState, map: MapModel, hass: Hass, lang: string, sliderMinute: number): string {
  const info = state.status === "ready" || state.status === "loading" ? state.map : undefined;
  if (!info?.time) return formatClock(sliderMinute, lang);
  const minute = toWallMinutes(info.time, hass.config.time_zone, map.dayStart);
  return minute !== undefined ? formatWhen(minute, lang) : info.time;
}

export const ZOOM_LEVELS = [1, 2, 4] as const;

/** The next level in `direction` (+1 closer, -1 farther), or the current one at either end. */
export function stepZoom(level: number, direction: 1 | -1): number {
  const index = ZOOM_LEVELS.findIndex((candidate) => candidate >= level);
  const current = index === -1 ? ZOOM_LEVELS.length - 1 : index;
  return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, current + direction))] ?? 1;
}

export interface ZoomControl {
  level: number;
  onChange: (level: number) => void;
}

function renderZoomButtons(zoom: ZoomControl, t: ReturnType<typeof translator>): TemplateResult {
  const first = Math.min(...ZOOM_LEVELS);
  const last = Math.max(...ZOOM_LEVELS);
  return html`<div class="zoom" role="group">
    <button
      type="button"
      title=${t("zoom_in")}
      aria-label=${t("zoom_in")}
      ?disabled=${zoom.level >= last}
      @click=${() => zoom.onChange(stepZoom(zoom.level, 1))}
    >
      <ha-icon icon="mdi:plus"></ha-icon>
    </button>
    <button
      type="button"
      title=${t("zoom_out")}
      aria-label=${t("zoom_out")}
      ?disabled=${zoom.level <= first}
      @click=${() => zoom.onChange(stepZoom(zoom.level, -1))}
    >
      <ha-icon icon="mdi:minus"></ha-icon>
    </button>
  </div>`;
}

/** The image (only ever as `<img src=blob:...>`), the loading overlay and the error message. */
export function renderMapBox(
  state: MapState,
  map: MapModel,
  time: string,
  lang: string,
  zoom?: ZoomControl,
): TemplateResult {
  const t = translator(lang);
  const url = state.status === "ready" || state.status === "loading" ? state.url : undefined;
  return html`<div class="mapbox" aria-busy=${state.status === "loading" ? "true" : "false"}>
    ${url ? html`<img src=${url} alt=${t("map_alt", { name: map.name, time })} />` : nothing}
    ${zoom && url ? renderZoomButtons(zoom, t) : nothing}
    ${state.status === "loading" ? html`<div class="overlay" role="status">${t("map_loading")}</div>` : nothing}
    ${state.status === "error" ? html`<div class="error" role="alert">${state.message}</div>` : nothing}
  </div>`;
}

export function renderSlider(
  map: MapModel,
  minute: number,
  lang: string,
  onInput: (event: Event) => void,
): TemplateResult {
  const time = formatClock(minute, lang);
  return html`<label class="slider">
    <span>${map.name} · <strong>${time}</strong></span>
    <input
      type="range"
      .min=${String(map.minMinute)}
      .max=${String(map.maxMinute)}
      .step=${String(map.step)}
      .value=${String(minute)}
      aria-valuetext=${time}
      @input=${onInput}
    />
  </label>`;
}

/** Render time, sun position and the data attribution below the image. */
export function renderCaption(state: MapState, map: MapModel, time: string, lang: string): TemplateResult {
  const t = translator(lang);
  const info = state.status === "ready" || state.status === "loading" ? state.map : undefined;
  return html`${info
    ? html`<div class="meta">
        <div>${t("map_time", { time })}</div>
        ${info.sunAzimuth !== undefined && info.sunElevation !== undefined
          ? html`<div>
              ${t("azimuth")}: ${formatDegrees(info.sunAzimuth, lang)} · ${t("elevation")}:
              ${formatDegrees(info.sunElevation, lang)}
            </div>`
          : nothing}
        ${info.sunBelowHorizon ? html`<div>${t("map_sun_below")}</div>` : nothing}
      </div>`
    : nothing}
  ${map.attribution ? html`<div class="attribution">${map.attribution}</div>` : nothing}`;
}

export const mapStyles = css`
  .content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--primary-text-color);
  }
  .error {
    color: var(--error-color, #db4437);
  }
  .mapbox {
    position: relative;
    min-height: 120px;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    overflow: hidden;
  }
  .mapbox img {
    display: block;
    width: 100%;
    height: auto;
  }
  .zoom {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .zoom button {
    width: 36px;
    height: 36px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--divider-color);
    border-radius: 50%;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .zoom button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .zoom button:not(:disabled):hover,
  .zoom button:focus-visible {
    background: var(--secondary-background-color);
  }
  .overlay,
  .mapbox .error {
    position: absolute;
    inset: auto 0 0 0;
    padding: 6px 10px;
    background: var(--card-background-color);
    font-size: 0.9em;
  }
  .mapbox .error {
    position: static;
  }
  .overlay {
    color: var(--secondary-text-color);
  }
  .slider {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .slider input {
    width: 100%;
    accent-color: var(--primary-color);
  }
  .meta,
  .attribution {
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }
`;
