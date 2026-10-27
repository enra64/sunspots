import { html, LitElement, nothing, type TemplateResult } from "lit";
import { configChangedEvent, toRecord } from "./editor-config";
import { editorHelper, editorLabel, type FormSchema, type HourScope, type RawConfig } from "./editor-schema";
import type { Hass } from "./types";
import { languageOf } from "./viewmodel";

/** What distinguishes one card's editor from another; all of it is pure and unit tested. */
export interface EditorSpec {
  schema(config: RawConfig, language: string): FormSchema;
  hourScope(config: RawConfig): HourScope;
  formData(config: RawConfig): RawConfig;
  normalize(value: RawConfig, prev: RawConfig): RawConfig;
}

/** Visual editor on top of Home Assistant's `ha-form` (provided by Home Assistant at runtime). */
export abstract class FormEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass: Hass | undefined;
  declare _config: RawConfig;

  protected abstract readonly spec: EditorSpec;

  constructor() {
    super();
    this._config = {};
  }

  setConfig(config: unknown): void {
    this._config = toRecord(config);
  }

  private onChange(event: CustomEvent<{ value?: unknown }>): void {
    event.stopPropagation();
    this._config = this.spec.normalize(toRecord(event.detail.value), this._config);
    this.dispatchEvent(configChangedEvent(this._config));
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const language = languageOf(this.hass);
    const scope = this.spec.hourScope(this._config);
    return html`<ha-form
      .hass=${this.hass}
      .data=${this.spec.formData(this._config)}
      .schema=${this.spec.schema(this._config, language)}
      .computeLabel=${(field: { name: string }) => editorLabel(field.name, language)}
      .computeHelper=${(field: { name: string }) => editorHelper(field.name, language, scope)}
      @value-changed=${(event: CustomEvent<{ value?: unknown }>) => this.onChange(event)}
    ></ha-form>`;
  }
}
