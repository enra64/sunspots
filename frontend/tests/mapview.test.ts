import { describe, expect, it } from "vitest";
import { stepZoom } from "../src/mapview";

describe("stepZoom", () => {
  it("steps through the levels and stops at both ends", () => {
    expect(stepZoom(1, 1)).toBe(2);
    expect(stepZoom(2, 1)).toBe(4);
    expect(stepZoom(4, 1)).toBe(4);
    expect(stepZoom(4, -1)).toBe(2);
    expect(stepZoom(1, -1)).toBe(1);
  });
});
