import { type StringKey, translate } from "./locale";

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
  }
}

/** Define the element and list it in the Lovelace card picker. */
export function registerCard(
  type: string,
  element: CustomElementConstructor,
  nameKey: StringKey,
  descriptionKey: StringKey,
): void {
  customElements.define(type, element);
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type,
    name: translate(navigator.language, nameKey),
    description: translate(navigator.language, descriptionKey),
  });
}
