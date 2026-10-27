import { type StringKey, translate } from "./locale";

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
  }
}

export interface ElementRegistry {
  get(name: string): unknown;
  define(name: string, constructor: CustomElementConstructor): void;
}

/**
 * Define an element unless the name is taken. The bundle can be loaded twice (the integration
 * adds it to every dashboard, and users may also list it as a dashboard resource); a second
 * `define` would throw and break the page's other cards.
 */
export function defineOnce(registry: ElementRegistry, name: string, constructor: CustomElementConstructor): boolean {
  if (registry.get(name) !== undefined) return false;
  registry.define(name, constructor);
  return true;
}

/** Define the element and list it in the Lovelace card picker (once). */
export function registerCard(
  type: string,
  element: CustomElementConstructor,
  nameKey: StringKey,
  descriptionKey: StringKey,
): void {
  if (!defineOnce(customElements, type, element)) return;
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type,
    name: translate(navigator.language, nameKey),
    description: translate(navigator.language, descriptionKey),
  });
}
