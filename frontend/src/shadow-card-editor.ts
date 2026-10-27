import { type EditorSpec, FormEditor } from "./editor-element";
import { normalizeShadowConfig, shadowFormData } from "./editor-config";
import { shadowSchema } from "./editor-schema";

const SPEC: EditorSpec = {
  schema: shadowSchema,
  hourScope: () => "slider",
  formData: shadowFormData,
  normalize: normalizeShadowConfig,
};

class SunspotsShadowCardEditor extends FormEditor {
  protected override readonly spec = SPEC;
}

customElements.define("sunspots-shadow-card-editor", SunspotsShadowCardEditor);
