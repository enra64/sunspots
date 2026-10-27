import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { debounce, type Debounced, LatestRunner, type Settled } from "./async";
import { parseConfig } from "./config";
import { pickStubEntity } from "./entities";
import { formatClock, formatDegrees, formatWhen } from "./format";
import { type StringKey, translate } from "./locale";
import { errorMessage, parseRenderResponse, renderShadowMapMessage, type ShadowMap } from "./render";
import { toWallMinutes, wallMinutesToIso } from "./time";
import type { CardConfig, Hass } from "./types";
import {
  buildViewModel,
  languageOf,
  type MapModel,
  type OverviewRow,
  type TimelineRow,
  type ViewModel,
} from "./viewmodel";

const DEBOUNCE_MS = 150;

type MapState =
  | { status: "idle" }
  | { status: "loading"; url?: string; map?: ShadowMap }
  | { status: "ready"; url: string; map: ShadowMap }
  | { status: "error"; message: string };

class SunspotsCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _mapState: { state: true },
    _minute: { state: true },
  };

  declare hass: Hass | undefined;
  declare _config: CardConfig | undefined;
  declare _mapState: MapState;
  declare _minute: number | undefined;

  private runner: LatestRunner<number, ShadowMap> | undefined;
  private readonly debouncer: Debounced<[number]> = debounce((minute: number) => {
    this.runner?.request(minute);
  }, DEBOUNCE_MS);
  private objectUrl: string | undefined;
  private mapEntity: string | undefined;
  private dayStart = 0;

  constructor() {
    super();
    this._mapState = { status: "idle" };
  }

  static getStubConfig(hass: Hass, entities: string[]): Record<string, unknown> {
    const entity = pickStubEntity(hass, entities);
    return { type: "custom:sunspots-card", mode: "overview", entities: entity ? [entity] : [] };
  }

  setConfig(config: unknown): void {
    this._config = parseConfig(config);
    this.resetMap();
  }

  getCardSize(): number {
    const config = this._config;
    if (!config) return 1;
    if (config.mode === "map") return 8;
    if (config.mode === "timeline") return 1 + config.entities.length * 2;
    return 1 + config.entities.length;
  }

  getGridOptions(): Record<string, unknown> {
    const mode = this._config?.mode ?? "overview";
    return { columns: 12, min_columns: 6, rows: mode === "map" ? 6 : "auto", min_rows: 1 };
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resetMap();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.ensureRunner();
  }

  override updated(): void {
    const config = this._config;
    if (!this.hass || config?.mode !== "map") return;
    const entity = config.entities[0];
    if (this._mapState.status === "idle" && entity && this.mapEntity !== entity) {
      this.mapEntity = entity;
      const model = this.currentModel();
      if (model?.mode === "map" && !model.map.error) {
        this.dayStart = model.map.dayStart;
        this._minute = model.map.initialMinute;
        this.startLoading();
        this.runner?.request(model.map.initialMinute);
      }
    }
  }

  private currentModel(): ViewModel | undefined {
    return this.hass && this._config ? buildViewModel(this.hass, this._config, new Date()) : undefined;
  }

  private ensureRunner(): void {
    if (this.runner) return;
    this.runner = new LatestRunner<number, ShadowMap>(
      (minute) => this.fetchMap(minute),
      (result) => this.onMapSettled(result),
    );
  }

  private resetMap(): void {
    this.debouncer.cancel();
    this.runner?.dispose();
    this.runner = undefined;
    this.revoke();
    this.mapEntity = undefined;
    this._mapState = { status: "idle" };
    this._minute = undefined;
    if (this.isConnected) this.ensureRunner();
  }

  private revoke(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }

  private async fetchMap(minute: number): Promise<ShadowMap> {
    const hass = this.hass;
    const entity = this.mapEntity;
    if (!hass || !entity) throw new Error("not ready");
    const raw = await hass.connection.sendMessagePromise<unknown>(
      renderShadowMapMessage(entity, wallMinutesToIso(minute, this.dayStart)),
    );
    const parsed = parseRenderResponse(raw, entity);
    if (!parsed.ok) throw new MapRejected(parsed.reason);
    return parsed.map;
  }

  private onMapSettled(result: Settled<ShadowMap>): void {
    const lang = this.hass ? languageOf(this.hass) : undefined;
    if (!result.ok) {
      const error = result.error;
      const message =
        error instanceof MapRejected
          ? translate(lang, error.reason === "too_large" ? "map_too_large" : "map_invalid")
          : translate(lang, "map_error", { message: errorMessage(error) });
      this.revoke();
      this._mapState = { status: "error", message };
      return;
    }
    this.revoke();
    this.objectUrl = URL.createObjectURL(new Blob([result.value.svg], { type: "image/svg+xml" }));
    this._mapState = { status: "ready", url: this.objectUrl, map: result.value };
  }

  private startLoading(): void {
    const previous = this._mapState;
    this._mapState =
      previous.status === "ready"
        ? { status: "loading", url: previous.url, map: previous.map }
        : { status: "loading" };
  }

  private onSlide(event: Event): void {
    const minute = Number((event.target as HTMLInputElement).value);
    this._minute = minute;
    this.startLoading();
    this.debouncer.call(minute);
  }

  protected override render(): TemplateResult {
    if (!this._config || !this.hass) return html`<ha-card></ha-card>`;
    const model = buildViewModel(this.hass, this._config, new Date());
    const lang = languageOf(this.hass);
    return html`<ha-card .header=${model.title}>
      <div class="content">
        ${model.mode === "overview"
          ? model.rows.map((row) => this.renderOverviewRow(row))
          : model.mode === "timeline"
            ? this.renderTimeline(model.rows)
            : this.renderMap(model.map, lang)}
      </div>
    </ha-card>`;
  }

  private renderOverviewRow(row: OverviewRow): TemplateResult {
    if (row.error) return html`<div class="row error">${row.error}</div>`;
    const details = [row.boundary, row.forecastNote, ...row.extras].filter((x): x is string => !!x);
    return html`<div class="row">
      <div class="name">${row.name}</div>
      <div class="chip ${row.status}">
        <ha-icon icon=${row.icon}></ha-icon><span>${row.statusLabel}</span>
      </div>
      ${details.length > 0 ? html`<div class="details">${details.join(" · ")}</div>` : nothing}
    </div>`;
  }

  private renderTimeline(rows: TimelineRow[]): TemplateResult[] {
    return rows.map((row) => {
      if (row.error) return html`<div class="row error">${row.error}</div>`;
      return html`<div class="timeline">
        <div class="name">${row.name}</div>
        <div class="bar" role="img" aria-label=${row.summary}>
          ${row.bars.map(
            (bar) => html`<div
              class="seg ${bar.kind} ${bar.past ? "past" : ""}"
              style="left:${bar.left}%;width:${bar.width}%"
            ></div>`,
          )}
          ${row.timeline.nowPercent !== undefined
            ? html`<div class="now" style="left:${row.timeline.nowPercent}%" title=${row.nowLabel}></div>`
            : nothing}
        </div>
        <div class="ticks" aria-hidden="true">
          ${row.ticks.map((tick) => html`<span style="left:${tick.percent}%">${tick.label}</span>`)}
        </div>
        <ul class="legend">
          ${row.legend.map(
            (item) => html`<li><span class="swatch seg ${item.kind === "geometry" ? "sunny" : item.kind}"></span>${item.label}</li>`,
          )}
        </ul>
      </div>`;
    });
  }

  private renderMap(map: MapModel, lang: string): TemplateResult {
    if (map.error) return html`<div class="row error">${map.error}</div>`;
    const t = (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
    const state = this._mapState;
    const minute = this._minute ?? map.initialMinute;
    const sliderTime = formatClock(minute, lang);
    const url = state.status === "ready" || state.status === "loading" ? state.url : undefined;
    const info = state.status === "ready" || state.status === "loading" ? state.map : undefined;
    const renderedMinute = info?.time ? toWallMinutes(info.time, this.hass?.config.time_zone ?? "UTC", map.dayStart) : undefined;
    const renderedTime = renderedMinute !== undefined ? formatWhen(renderedMinute, lang) : (info?.time ?? sliderTime);

    return html`
      <div class="mapbox" aria-busy=${state.status === "loading" ? "true" : "false"}>
        ${url
          ? html`<img src=${url} alt=${t("map_alt", { name: map.name, time: renderedTime })} />`
          : nothing}
        ${state.status === "loading" ? html`<div class="overlay" role="status">${t("map_loading")}</div>` : nothing}
        ${state.status === "error" ? html`<div class="error" role="alert">${state.message}</div>` : nothing}
      </div>
      <label class="slider">
        <span>${map.name} · <strong>${sliderTime}</strong></span>
        <input
          type="range"
          .min=${String(map.minMinute)}
          .max=${String(map.maxMinute)}
          .step=${String(map.step)}
          .value=${String(minute)}
          aria-valuetext=${sliderTime}
          @input=${this.onSlide}
        />
      </label>
      ${info
        ? html`<div class="meta">
            <div>${t("map_time", { time: renderedTime })}</div>
            ${info.sunAzimuth !== undefined && info.sunElevation !== undefined
              ? html`<div>
                  ${t("azimuth")}: ${formatDegrees(info.sunAzimuth, lang)} · ${t("elevation")}:
                  ${formatDegrees(info.sunElevation, lang)}
                </div>`
              : nothing}
            ${info.sunBelowHorizon ? html`<div>${t("map_sun_below")}</div>` : nothing}
          </div>`
        : nothing}
      ${map.attribution ? html`<div class="attribution">${map.attribution}</div>` : nothing}
    `;
  }

  static override styles = css`
    :host {
      --sunspots-sun: var(--amber-color, var(--warning-color, #f5a623));
    }
    .content {
      padding: 0 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: var(--primary-text-color);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 12px;
    }
    .row .name {
      flex: 1 1 8em;
      font-weight: 500;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .details {
      flex: 1 1 100%;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px 2px 6px;
      border-radius: 16px;
      border: 1px solid var(--divider-color);
      font-size: 0.9em;
      white-space: nowrap;
    }
    .chip.sunny {
      border-color: var(--sunspots-sun);
      background: color-mix(in srgb, var(--sunspots-sun) 18%, transparent);
    }
    .chip.sunny_cloudy {
      border-color: var(--sunspots-sun);
      border-style: dashed;
    }
    .chip ha-icon {
      --mdc-icon-size: 18px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .timeline .name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .bar {
      position: relative;
      height: 22px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color, transparent);
      overflow: hidden;
    }
    .seg {
      position: absolute;
      top: 0;
      bottom: 0;
    }
    .seg.sunny {
      background: var(--sunspots-sun);
    }
    .seg.partly {
      background: repeating-linear-gradient(
        45deg,
        var(--sunspots-sun) 0 4px,
        transparent 4px 8px
      );
      border-left: 1px solid var(--sunspots-sun);
      border-right: 1px solid var(--sunspots-sun);
    }
    .seg.unlikely {
      background: color-mix(in srgb, var(--sunspots-sun) 22%, transparent);
      border-top: 2px dotted var(--sunspots-sun);
      border-bottom: 2px dotted var(--sunspots-sun);
      box-sizing: border-box;
    }
    .seg.past:not(.swatch) {
      opacity: 0.55;
    }
    .now {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      margin-left: -1px;
      background: var(--primary-text-color);
    }
    .ticks {
      position: relative;
      height: 1.2em;
      font-size: 0.75em;
      color: var(--secondary-text-color);
    }
    .ticks span {
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    .legend {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .swatch {
      position: static;
      display: inline-block;
      width: 24px;
      height: 12px;
      border: 1px solid var(--divider-color);
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
}

class MapRejected extends Error {
  constructor(readonly reason: "invalid" | "too_large") {
    super(reason);
  }
}

customElements.define("sunspots-card", SunspotsCard);

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "sunspots-card",
  name: translate(navigator.language, "card_name"),
  description: translate(navigator.language, "card_description"),
});
