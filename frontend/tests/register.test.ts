import { describe, expect, it, vi } from "vitest";
import { defineOnce, repairAfterPolyfill } from "../src/register";

class Fake {}

describe("defineOnce", () => {
  it("defines a new name and skips one that is already taken", () => {
    const defined = new Map<string, unknown>();
    const registry = {
      get: (name: string) => defined.get(name),
      define: (name: string, ctor: unknown) => {
        if (defined.has(name)) throw new Error("already defined");
        defined.set(name, ctor);
      },
    };
    const ctor = Fake as unknown as CustomElementConstructor;
    expect(defineOnce(registry, "sunspots-card", ctor)).toBe(true);
    expect(defineOnce(registry, "sunspots-card", ctor)).toBe(false);
    expect(defined.size).toBe(1);
  });
});

describe("repairAfterPolyfill", () => {
  const ctor = Fake as unknown as CustomElementConstructor;

  function setup() {
    const defined = new Map<string, unknown>();
    const registry = {
      get: (name: string) => defined.get(name),
      define: (name: string, c: unknown) => {
        defined.set(name, c);
      },
    };
    const queue: (() => void)[] = [];
    const schedule = (fn: () => void) => queue.push(fn);
    return { defined, registry, queue, schedule };
  }

  it("waits for the polyfill, then redefines an element it does not know", () => {
    const { defined, registry, queue, schedule } = setup();
    const win: { CustomElementRegistryPolyfill?: unknown } = {};
    repairAfterPolyfill(registry, win, "sunspots-card", ctor, schedule);
    expect(queue).toHaveLength(1);
    queue.shift()?.();
    expect(queue).toHaveLength(1);
    expect(defined.size).toBe(0);
    win.CustomElementRegistryPolyfill = {};
    queue.shift()?.();
    expect(defined.get("sunspots-card")).toBe(ctor);
    expect(queue).toHaveLength(0);
  });

  it("does nothing when the element is already visible", () => {
    const { registry, schedule } = setup();
    let defines = 0;
    registry.define = () => {
      defines += 1;
    };
    registry.get = () => ctor;
    repairAfterPolyfill(registry, { CustomElementRegistryPolyfill: {} }, "sunspots-card", ctor, schedule);
    expect(defines).toBe(0);
  });

  it("stops polling after the attempts run out and swallows define errors", () => {
    const { registry, queue, schedule } = setup();
    repairAfterPolyfill(registry, {}, "sunspots-card", ctor, schedule, 1);
    queue.shift()?.();
    expect(queue).toHaveLength(0);
    registry.define = () => {
      throw new Error("already defined");
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      repairAfterPolyfill(registry, { CustomElementRegistryPolyfill: {} }, "sunspots-card", ctor, schedule),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
