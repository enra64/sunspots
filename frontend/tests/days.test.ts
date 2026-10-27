import { describe, expect, it } from "vitest";
import { autoHourWindow, FALLBACK_HOURS, resolveHourWindow, selectDays, shiftRanges } from "../src/days";

describe("selectDays", () => {
  it("maps the option to the shown days", () => {
    expect(selectDays("today")).toEqual(["today"]);
    expect(selectDays("tomorrow")).toEqual(["tomorrow"]);
    expect(selectDays("both")).toEqual(["today", "tomorrow"]);
  });
});

describe("shiftRanges", () => {
  it("moves ranges by an offset", () => {
    expect(shiftRanges([[1500, 1600]], -1440)).toEqual([[60, 160]]);
  });
});

describe("autoHourWindow", () => {
  it("rounds outward to whole hours", () => {
    expect(autoHourWindow([[11 * 60 + 5, 13 * 60 + 30], [15 * 60, 17 * 60 + 20]])).toEqual([11, 18]);
  });

  it("keeps exact hour boundaries", () => {
    expect(autoHourWindow([[480, 600]])).toEqual([8, 10]);
  });

  it("falls back to 6-22 without sun", () => {
    expect(autoHourWindow([])).toEqual(FALLBACK_HOURS);
    expect(autoHourWindow([[500, 500]])).toEqual([6, 22]);
  });

  it("clamps overnight and out-of-day ranges to 0-24", () => {
    expect(autoHourWindow([[-120, 30]])).toEqual([0, 1]);
    expect(autoHourWindow([[1400, 1600]])).toEqual([23, 24]);
    expect(autoHourWindow([[-60, 2000]])).toEqual([0, 24]);
  });
});

describe("resolveHourWindow", () => {
  const ranges: [number, number][] = [[600, 700]];

  it("derives auto bounds and lets numbers override", () => {
    expect(resolveHourWindow("auto", "auto", ranges)).toEqual([10, 12]);
    expect(resolveHourWindow(8, "auto", ranges)).toEqual([8, 12]);
    expect(resolveHourWindow("auto", 20, ranges)).toEqual([10, 20]);
    expect(resolveHourWindow(7, 21, ranges)).toEqual([7, 21]);
  });

  it("always spans at least one hour", () => {
    expect(resolveHourWindow(14, "auto", ranges)).toEqual([14, 15]);
    expect(resolveHourWindow(24, "auto", [])).toEqual([23, 24]);
  });
});
