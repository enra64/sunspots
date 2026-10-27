import { cardFormData, normalizeCardConfig } from "./editor-config";
import { type EditorSpec, FormEditor } from "./editor-element";
import { cardSchema, modeOf } from "./editor-schema";
import { defineOnce } from "./register";

const SPEC: EditorSpec = {
  schema: cardSchema,
  hourScope: (config) => (modeOf(config) === "timeline" ? "timeline" : "slider"),
  formData: cardFormData,
  normalize: normalizeCardConfig,
};

class SunspotsCardEditor extends FormEditor {
  protected override readonly spec = SPEC;
}

defineOnce(customElements, "sunspots-card-editor", SunspotsCardEditor);
