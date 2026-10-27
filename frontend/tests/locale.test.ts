import { describe, expect, it } from "vitest";
import { formatBoundary, formatClock, formatWhen } from "../src/format";
import { DICTIONARIES, normalizeLanguage, translate } from "../src/locale";
import { dayStartWall, nowMinutes, toWallMinutes, wallMinutesToIso } from "../src/time";
import { NOW, TZ } from "./fixtures";

describe("translate", () => {
  it("uses the language and interpolates", () => {
    expect(translate("de", "until", { time: "12:00" })).toBe("bis 12:00");
    expect(translate("en", "until", { time: "12:00" })).toBe("until 12:00");
  });

  it("reduces regional variants and falls back to English", () => {
    expect(normalizeLanguage("de-AT")).toBe("de");
    expect(translate("fr", "shaded")).toBe("Shaded");
    expect(translate(undefined, "shaded")).toBe("Shaded");
  });

  it("falls back to English for a key missing in the language", () => {
    const dicts = { en: { shaded: "Shaded" }, de: {} };
    expect(translate("de", "shaded", {}, dicts)).toBe("Shaded");
    expect(translate("de", "sunny", {}, dicts)).toBe("sunny");
  });

  it("has the same keys in every dictionary", () => {
    expect(Object.keys(DICTIONARIES["de"] ?? {}).sort()).toEqual(Object.keys(DICTIONARIES["en"] ?? {}).sort());
  });
});

describe("time helpers", () => {
  const dayStart = dayStartWall(NOW, TZ);

  it("computes wall minutes in the HA time zone", () => {
    expect(nowMinutes(NOW, TZ)).toBe(11 * 60);
    expect(toWallMinutes("2026-10-27T12:30:00+00:00", TZ, dayStart)).toBe(13 * 60 + 30);
    expect(toWallMinutes("2026-10-27T06:15:00+02:00", TZ, dayStart)).toBe(5 * 60 + 15);
  });

  it("treats strings without offset as local wall time and rejects garbage", () => {
    expect(toWallMinutes("2026-10-27T08:05:00", TZ, dayStart)).toBe(8 * 60 + 5);
    expect(toWallMinutes("soon", TZ, dayStart)).toBeUndefined();
    expect(toWallMinutes(null, TZ, dayStart)).toBeUndefined();
  });

  it("handles the next day and round-trips to ISO", () => {
    expect(toWallMinutes("2026-10-28T06:00:00+01:00", TZ, dayStart)).toBe(1440 + 360);
    expect(wallMinutesToIso(11 * 60 + 10, dayStart)).toBe("2026-10-27T11:10:00");
  });
});

describe("text formatting", () => {
  it("formats until/from with the language", () => {
    expect(formatBoundary("until", 14 * 60 + 30, "de")).toBe("bis 14:30");
    expect(formatBoundary("from", 6 * 60 + 12, "en-GB")).toBe("from 06:12");
  });

  it("marks times on the next day", () => {
    expect(formatWhen(1440 + 7 * 60, "en-GB")).toBe("tomorrow 07:00");
    expect(formatClock(1440 + 7 * 60, "en-GB")).toBe("07:00");
  });
});
