import { describe, expect, it } from "vitest";
import { resolveTheme } from "../src/theme";
import { makeHass } from "./fixtures";

describe("resolveTheme", () => {
  it("follows the Home Assistant dark mode when auto", () => {
    expect(resolveTheme("auto", makeHass([], [], "en", true))).toBe("dark");
    expect(resolveTheme("auto", makeHass([], [], "en", false))).toBe("light");
    expect(resolveTheme("auto", makeHass([], []))).toBe("light");
  });

  it("lets an explicit choice win", () => {
    expect(resolveTheme("light", makeHass([], [], "en", true))).toBe("light");
    expect(resolveTheme("dark", makeHass([], [], "en", false))).toBe("dark");
  });
});
