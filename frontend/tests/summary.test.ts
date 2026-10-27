import { describe, expect, it } from "vitest";
import { daySummary, segmentLabel, totalMinutes, withFirstSun } from "../src/summary";
import type { Segment } from "../src/types";

const seg = (start: number, end: number, kind: Segment["kind"] = "sunny"): Segment => ({ start, end, kind, past: false });

describe("segmentLabel", () => {
  it("prints the range inside wide sunny segments", () => {
    expect(segmentLabel(seg(660, 870), 360, 1320, "en-GB")).toBe("11:00–14:30");
  });

  it("omits it for short or narrow segments", () => {
    expect(segmentLabel(seg(660, 740), 360, 1320, "en-GB")).toBeUndefined();
    // 150 minutes but only 15.6 % of a 16 h bar
    expect(segmentLabel(seg(660, 810), 360, 1320, "en-GB")).toBeUndefined();
    // 120 minutes but only 8 % of a 24 h bar
    expect(segmentLabel(seg(660, 780), 0, 1440, "en-GB")).toBeUndefined();
  });

  it("omits it for forecast classes other than sunny", () => {
    expect(segmentLabel(seg(500, 900, "partly"), 360, 1320, "en-GB")).toBeUndefined();
  });
});

describe("daySummary", () => {
  it("lists ranges and total hours", () => {
    expect(daySummary([[660, 810], [900, 1040]], false, "en-GB")).toBe("Sun: 11:00–13:30, 15:00–17:20 · 4.8 h");
  });

  it("merges overlaps, localises and switches to partly sunny wording", () => {
    expect(daySummary([[600, 660], [630, 720]], false, "de")).toBe("Sonne: 10:00–12:00 · 2 Std.");
    expect(daySummary([[600, 720]], true, "en-GB")).toBe("Partly sunny: 10:00–12:00 · 2 h");
  });

  it("says so when there is no sun", () => {
    expect(daySummary([], false, "en-GB")).toBe("No direct sun");
    expect(daySummary([], false, "de")).toBe("Keine direkte Sonne");
    expect(daySummary([[900, 900]], false, "en-GB")).toBe("No direct sun");
  });

  it("clips ranges that run past midnight", () => {
    expect(daySummary([[1380, 1500]], false, "en-GB")).toBe("Sun: 23:00–00:00 · 1 h");
    expect(daySummary([[-60, 30]], false, "en-GB")).toBe("Sun: 00:00–00:30 · 0.5 h");
  });
});

describe("withFirstSun", () => {
  it("appends the first sun time only when known", () => {
    expect(withFirstSun("Sun: 09:40–11:00 · 1.3 h", 580, "en-GB")).toBe("Sun: 09:40–11:00 · 1.3 h · first sun 09:40");
    expect(withFirstSun("No direct sun", undefined, "en-GB")).toBe("No direct sun");
    expect(withFirstSun("x", 580, "de")).toBe("x · erste Sonne 09:40");
  });
});

describe("totalMinutes", () => {
  it("sums the range lengths", () => {
    expect(totalMinutes([[0, 30], [60, 120]])).toBe(90);
  });
});
