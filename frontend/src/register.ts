import { type StringKey, translate } from "./locale";

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
    CustomElementRegistryPolyfill?: unknown;
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

/**
 * Home Assistant loads its own bundle and every extra module with parallel `import()` calls. Its
 * bundle installs a scoped-custom-element-registry polyfill that replaces `customElements.define`
 * and `get`. When this module evaluates first, the element is defined natively and the polyfill's
 * `get` later reports it as missing, so HA shows "Custom element not found". Once the polyfill
 * is installed, define the element again through it (it adopts the native definition).
 */
export function repairAfterPolyfill(
  registry: ElementRegistry,
  win: { CustomElementRegistryPolyfill?: unknown },
  name: string,
  constructor: CustomElementConstructor,
  schedule: (fn: () => void, ms: number) => unknown = setTimeout,
  attemptsLeft = 400,
  intervalMs = 50,
): void {
  if (win.CustomElementRegistryPolyfill === undefined) {
    if (attemptsLeft > 0) {
      schedule(
        () => repairAfterPolyfill(registry, win, name, constructor, schedule, attemptsLeft - 1, intervalMs),
        intervalMs,
      );
    }
    return;
  }
  if (registry.get(name) !== undefined) return;
  try {
    registry.define(name, constructor);
  } catch {
    // Fall through to the check below.
  }
  if (registry.get(name) === undefined) {
    console.warn(
      `sunspots: <${name}> is defined but customElements.get("${name}") does not see it ` +
        "(another script may be replacing customElements). Reload the page; if this persists, " +
        "please report it with the output of customElements.get.toString().",
    );
  }
}

/** Define the element (once) and make sure the polyfill, if it shows up later, knows it too. */
export function defineElement(name: string, constructor: CustomElementConstructor): boolean {
  const defined = defineOnce(customElements, name, constructor);
  if (defined) repairAfterPolyfill(customElements, window, name, constructor);
  return defined;
}

/** Define the element and list it in the Lovelace card picker (once). */
export function registerCard(
  type: string,
  element: CustomElementConstructor,
  nameKey: StringKey,
  descriptionKey: StringKey,
): void {
  if (!defineElement(type, element)) return;
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type,
    name: translate(navigator.language, nameKey),
    description: translate(navigator.language, descriptionKey),
  });
}
