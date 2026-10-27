import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { debounce, type Debounced } from "./async";
import { parseConfig } from "./config";
import { selectDays } from "./days";
import { pickStubEntity } from "./entities";
import { MapLoader, type MapState } from "./maploader";
import { mapStyles, renderCaption, renderMapBox, renderSlider, renderedTimeLabel } from "./mapview";
import { registerCard } from "./register";
import { wallMinutesToIso } from "./time";
import { resolveTheme } from "./theme";
import type { CardConfig, Hass } from "./types";
import {
  buildViewModel,
  languageOf,
  type MapModel,
  type OverviewRow,
  type TimelineDay,
  type TimelineRow,
  type ViewModel,
} from "./viewmodel";

const DEBOUNCE_MS = 150;

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

  private readonly loader = new MapLoader(
    () => this.hass,
    (state) => {
      this._mapState = state;
    },
  );
  private readonly debouncer: Debounced<[]> = debounce(() => this.loadMap(), DEBOUNCE_MS);
  /** `entity|theme` of the last map load, to reload when the theme flips. */
  private mapKey: string | undefined;
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
    if (config.mode === "timeline") return 1 + config.entities.length * (1 + selectDays(config.day).length * 2);
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

  override updated(): void {
    const config = this._config;
    const hass = this.hass;
    const entity = config?.entities[0];
    if (!hass || config?.mode !== "map" || !entity) return;
    const key = `${entity}|${resolveTheme("auto", hass)}`;
    if (this.mapKey === key) return;
    const model = this.currentModel();
    if (model?.mode === "map" && !model.map.error) {
      this.mapKey = key;
      this.mapEntity = entity;
      this.dayStart = model.map.dayStart;
      this._minute ??= model.map.initialMinute;
      this.loadMap();
    }
  }

  private currentModel(): ViewModel | undefined {
    return this.hass && this._config ? buildViewModel(this.hass, this._config, new Date()) : undefined;
  }

  private loadMap(): void {
    const hass = this.hass;
    const entityId = this.mapEntity;
    if (!hass || !entityId || this._minute === undefined) return;
    this.loader.request({
      entityId,
      isoTime: wallMinutesToIso(this._minute, this.dayStart),
      theme: resolveTheme("auto", hass),
    });
  }

  private resetMap(): void {
    this.debouncer.cancel();
    this.loader.reset();
    this.mapKey = undefined;
    this.mapEntity = undefined;
    this._minute = undefined;
  }

  private onSlide(event: Event): void {
    this._minute = Number((event.target as HTMLInputElement).value);
    this.debouncer.call();
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
            : this.renderMap(model.map, this.hass, lang)}
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
        <div class="head">
          <div class="name">${row.name}</div>
          <div class="chip ${row.status}">
            <ha-icon icon=${row.icon}></ha-icon><span>${row.statusLabel}</span>
          </div>
        </div>
        ${row.days.map((day) => this.renderDay(row, day))}
        <ul class="legend">
          ${row.legend.map(
            (item) => html`<li><span class="swatch seg ${item.kind === "geometry" ? "sunny" : item.kind}"></span>${item.label}</li>`,
          )}
        </ul>
      </div>`;
    });
  }

  private renderDay(row: TimelineRow, day: TimelineDay): TemplateResult {
    return html`<div class="day ${day.key}">
      <div class="daylabel">${day.label}</div>
      <div class="daybody">
        <div class="barwrap">
          <div class="bar" role="img" aria-label=${day.ariaLabel}>
            ${row.ticks.map((tick) => html`<div class="grid" style="left:${tick.percent}%"></div>`)}
            ${day.bars.map(
              (bar) => html`<div
                class="seg ${bar.kind} ${bar.past ? "past" : ""}"
                style="left:${bar.left}%;width:${bar.width}%"
              >
                ${bar.label ? html`<span class="seglabel">${bar.label}</span>` : nothing}
              </div>`,
            )}
          </div>
          ${day.nowPercent !== undefined
            ? html`<div class="now" style="left:${day.nowPercent}%"></div>
                <div class="nowlabel" style="left:${day.nowPercent}%" aria-hidden="true">${row.nowLabel}</div>`
            : nothing}
        </div>
        <div class="ticks" aria-hidden="true">
          ${row.ticks.map((tick) =>
            tick.label ? html`<span style="left:${tick.percent}%">${tick.label}</span>` : nothing,
          )}
        </div>
        <div class="summary">${day.summary}</div>
      </div>
    </div>`;
  }

  private renderMap(map: MapModel, hass: Hass, lang: string): TemplateResult {
    if (map.error) return html`<div class="row error">${map.error}</div>`;
    const state = this._mapState;
    const minute = this._minute ?? map.initialMinute;
    const time = renderedTimeLabel(state, map, hass, lang, minute);
    return html`${renderMapBox(state, map, time, lang)}
    ${renderSlider(map, minute, lang, (event) => this.onSlide(event))}
    ${renderCaption(state, map, time, lang)}`;
  }

  static override styles = [
    mapStyles,
    css`
      :host {
        --sunspots-sun: var(--amber-color, var(--warning-color, #f5a623));
        --sunspots-on-sun: #1c1c1c;
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
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 4px 12px;
      }
      .head .name {
        font-weight: 500;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .day {
        display: grid;
        grid-template-columns: 4.5em minmax(0, 1fr);
        column-gap: 8px;
      }
      .day.today {
        padding-top: 16px;
      }
      .daylabel {
        line-height: 28px;
        font-size: 0.9em;
        font-weight: 500;
      }
      .barwrap {
        position: relative;
      }
      .bar {
        position: relative;
        height: 28px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
        background: var(--secondary-background-color, transparent);
        overflow: hidden;
      }
      .grid {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--divider-color);
        opacity: 0.6;
      }
      .seg {
        position: absolute;
        top: 0;
        bottom: 0;
      }
      .seg.sunny {
        background: var(--sunspots-sun);
        color: var(--sunspots-on-sun);
      }
      .seg.partly {
        background: repeating-linear-gradient(45deg, var(--sunspots-sun) 0 4px, transparent 4px 8px);
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
      .seglabel {
        display: block;
        padding: 0 4px;
        line-height: 28px;
        font-size: 0.8em;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .now {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 3px;
        margin-left: -1.5px;
        border-radius: 2px;
        background: var(--primary-text-color);
        box-shadow: 0 0 0 1px var(--card-background-color, transparent);
      }
      .nowlabel {
        position: absolute;
        bottom: calc(100% + 4px);
        transform: translateX(-50%);
        font-size: 0.75em;
        font-weight: 600;
        line-height: 1;
        color: var(--primary-text-color);
      }
      .ticks {
        position: relative;
        height: 1.2em;
        margin-top: 2px;
        font-size: 0.7em;
        color: var(--secondary-text-color);
      }
      .ticks span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .summary {
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }
      .legend {
        list-style: none;
        margin: 0;
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
    `,
  ];
}

registerCard("sunspots-card", SunspotsCard, "card_name", "card_description");
