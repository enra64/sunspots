import { describe, expect, it } from "vitest";
import { defineOnce } from "../src/register";

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
