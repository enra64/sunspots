import { describe, expect, it } from "vitest";
import { clipAndMerge, computeTimeline } from "../src/intervals";

describe("clipAndMerge", () => {
  it("clips to the window and drops empty ranges", () => {
    expect(clipAndMerge([[0, 100], [900, 1000], [200, 300]], 360, 1320)).toEqual([[900, 1000]]);
  });

  it("merges overlapping and touching ranges, sorted", () => {
    expect(clipAndMerge([[600, 700], [400, 500], [500, 550], [690, 800]], 360, 1320)).toEqual([
      [400, 550],
      [600, 800],
    ]);
  });

  it("clips ranges extending past midnight", () => {
    expect(clipAndMerge([[1200, 1500]], 360, 1320)).toEqual([[1200, 1320]]);
  });

  it("returns nothing for empty input", () => {
    expect(clipAndMerge([], 0, 1440)).toEqual([]);
  });
});

describe("computeTimeline", () => {
  const base = { windowStart: 360, windowEnd: 1320, now: 660 };

  it("builds geometry segments and the now marker", () => {
    const t = computeTimeline({ ...base, geometry: [[480, 600], [700, 900]], forecast: [] });
    expect(t.geometry.map((s) => [s.start, s.end, s.past])).toEqual([
      [480, 600, true],
      [700, 900, false],
    ]);
    expect(t.forecast).toEqual([]);
    expect(t.nowPercent).toBeCloseTo(31.25);
  });

  it("hides the now marker outside the window", () => {
    const t = computeTimeline({ ...base, now: 100, geometry: [], forecast: [] });
    expect(t.nowPercent).toBeUndefined();
  });

  it("keeps forecast classes separate and sorted", () => {
    const t = computeTimeline({
      ...base,
      geometry: [],
      forecast: [
        { start: 700, end: 800, kind: "partly", past: false },
        { start: 480, end: 600, kind: "sunny", past: true },
        { start: 800, end: 900, kind: "unlikely", past: false },
        { start: 750, end: 850, kind: "partly", past: false },
      ],
    });
    expect(t.forecast.map((s) => [s.kind, s.start, s.end])).toEqual([
      ["sunny", 480, 600],
      ["partly", 700, 850],
      ["unlikely", 800, 900],
    ]);
  });
});
