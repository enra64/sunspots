import { type EditorSpec, FormEditor } from "./editor-element";
import { normalizeShadowConfig, shadowFormData } from "./editor-config";
import { shadowSchema } from "./editor-schema";
import { defineElement } from "./register";

const SPEC: EditorSpec = {
  schema: shadowSchema,
  hourScope: () => "slider",
  formData: shadowFormData,
  normalize: normalizeShadowConfig,
};

class SunspotsShadowCardEditor extends FormEditor {
  protected override readonly spec = SPEC;
}

defineElement("sunspots-shadow-card-editor", SunspotsShadowCardEditor);
