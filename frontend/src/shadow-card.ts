import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { debounce, type Debounced } from "./async";
import { parseShadowConfig } from "./config";
import { pickStubEntity } from "./entities";
import { translate } from "./locale";
import { MapLoader, type MapState } from "./maploader";
import { mapStyles, renderCaption, renderMapBox, renderSlider, renderedTimeLabel } from "./mapview";
import { registerCard } from "./register";
import { resolveTheme } from "./theme";
import { wallMinutesToIso } from "./time";
import type { Hass, ShadowCardConfig } from "./types";
import { buildShadowViewModel, languageOf } from "./viewmodel";

const DEBOUNCE_MS = 150;

class SunspotsShadowCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _mapState: { state: true },
    _minute: { state: true },
  };

  declare hass: Hass | undefined;
  declare _config: ShadowCardConfig | undefined;
  declare _mapState: MapState;
  /** Slider position; undefined shows the current moment. */
  declare _minute: number | undefined;

  private readonly loader = new MapLoader(
    () => this.hass,
    (state) => {
      this._mapState = state;
    },
  );
  private readonly debouncer: Debounced<[]> = debounce(() => this.load(), DEBOUNCE_MS);
  private timer: ReturnType<typeof setInterval> | undefined;
  /** `entity|theme` of the last load, to render once and again when the theme flips. */
  private loadedKey: string | undefined;

  constructor() {
    super();
    this._mapState = { status: "idle" };
  }

  static getStubConfig(hass: Hass, entities: string[]): Record<string, unknown> {
    return { type: "custom:sunspots-shadow-card", entity: pickStubEntity(hass, entities) ?? "" };
  }

  setConfig(config: unknown): void {
    this._config = parseShadowConfig(config);
    this.stop();
    this.loader.reset();
    this._minute = undefined;
    this.loadedKey = undefined;
    if (this.isConnected) this.arm();
  }

  getCardSize(): number {
    return this._config?.showSlider ? 8 : 6;
  }

  getGridOptions(): Record<string, unknown> {
    return { columns: 12, min_columns: 6, rows: this._config?.showSlider ? 6 : 5, min_rows: 2 };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.arm();
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stop();
    this.loader.reset();
    this.loadedKey = undefined;
  }

  override updated(): void {
    const config = this._config;
    const hass = this.hass;
    if (!config || !hass || !this.isConnected) return;
    const key = `${config.entity}|${resolveTheme(config.theme, hass)}`;
    if (this.loadedKey === key) return;
    const { map } = buildShadowViewModel(hass, config, new Date());
    if (map.error) return;
    this.loadedKey = key;
    this.load();
  }

  private arm(): void {
    this.stop();
    const minutes = this._config?.refreshMinutes;
    if (minutes !== undefined) this.timer = setInterval(() => this.load(), minutes * 60_000);
  }

  private stop(): void {
    this.debouncer.cancel();
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Render the slider time, or the current moment when the slider was not used. */
  private load(): void {
    const config = this._config;
    const hass = this.hass;
    if (!config || !hass) return;
    const { dayStart } = buildShadowViewModel(hass, config, new Date()).map;
    this.loader.request({
      entityId: config.entity,
      isoTime: this._minute === undefined ? undefined : wallMinutesToIso(this._minute, dayStart),
      theme: resolveTheme(config.theme, hass),
    });
  }

  private onRefresh(): void {
    this._minute = undefined;
    this.load();
  }

  private onSlide(event: Event): void {
    this._minute = Number((event.target as HTMLInputElement).value);
    this.debouncer.call();
  }

  protected override render(): TemplateResult {
    const config = this._config;
    const hass = this.hass;
    if (!config || !hass) return html`<ha-card></ha-card>`;
    const { title, map } = buildShadowViewModel(hass, config, new Date());
    const lang = languageOf(hass);
    if (map.error) {
      return html`<ha-card .header=${title}><div class="content error">${map.error}</div></ha-card>`;
    }
    const state = this._mapState;
    const minute = this._minute ?? map.initialMinute;
    const time = renderedTimeLabel(state, map, hass, lang, minute);
    return html`<ha-card .header=${title}>
      <div class="content">
        ${renderMapBox(state, map, time, lang)}
        ${config.showSlider ? renderSlider(map, minute, lang, (event) => this.onSlide(event)) : nothing}
        <div class="footer">
          <div class="caption">${renderCaption(state, map, time, lang)}</div>
          <button
            class="refresh"
            type="button"
            title=${translate(lang, "refresh")}
            aria-label=${translate(lang, "refresh")}
            @click=${() => this.onRefresh()}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
          </button>
        </div>
      </div>
    </ha-card>`;
  }

  static override styles = [
    mapStyles,
    css`
      .footer {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .caption {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .refresh {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .refresh:hover,
      .refresh:focus-visible {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }
    `,
  ];
}

registerCard("sunspots-shadow-card", SunspotsShadowCard, "shadow_card_name", "shadow_card_description");
