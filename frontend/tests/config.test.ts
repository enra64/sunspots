import { describe, expect, it } from "vitest";
import { clampRefreshMinutes, parseConfig, parseShadowConfig } from "../src/config";

describe("parseConfig", () => {
  it("defaults to overview with entities list", () => {
    const c = parseConfig({ type: "custom:sunspots-card", entities: ["binary_sensor.a_sunny"] });
    expect(c.mode).toBe("overview");
    expect(c.entities).toEqual(["binary_sensor.a_sunny"]);
    expect(c.startHour).toBe(6);
    expect(c.endHour).toBe(22);
    expect(c.day).toBe("both");
  });

  it("defaults the timeline to automatic hours and accepts auto per bound", () => {
    const c = parseConfig({ mode: "timeline", entity: "binary_sensor.a_sunny" });
    expect([c.startHour, c.endHour]).toEqual(["auto", "auto"]);
    const mixed = parseConfig({ mode: "timeline", entity: "binary_sensor.a_sunny", start_hour: 8, end_hour: "auto" });
    expect([mixed.startHour, mixed.endHour]).toEqual([8, "auto"]);
  });

  it.each(["today", "tomorrow", "both"])("accepts day %s", (day) => {
    expect(parseConfig({ mode: "timeline", entity: "binary_sensor.a_sunny", day }).day).toBe(day);
  });

  it("accepts a single entity and uses map hour defaults", () => {
    const c = parseConfig({ mode: "map", entity: "binary_sensor.a_sunny", title: "Hi" });
    expect(c.entities).toEqual(["binary_sensor.a_sunny"]);
    expect([c.startHour, c.endHour]).toEqual([4, 23]);
    expect(c.title).toBe("Hi");
  });

  it("honours start_hour and end_hour", () => {
    const c = parseConfig({ mode: "timeline", entity: "binary_sensor.a_sunny", start_hour: 8, end_hour: 20 });
    expect([c.startHour, c.endHour]).toEqual([8, 20]);
  });

  it.each([
    [null, /expected an object/],
    [{}, /required/],
    [{ entities: [] }, /required/],
    [{ entities: "binary_sensor.a_sunny" }, /list/],
    [{ entity: "sensor.a_sunny" }, /not a binary_sensor/],
    [{ entity: "binary_sensor.a_sunny", entities: ["binary_sensor.b_sunny"] }, /not both/],
    [{ entity: "binary_sensor.a_sunny", mode: "grid" }, /mode/],
    [{ entity: "binary_sensor.a_sunny", title: 5 }, /title/],
    [{ entity: "binary_sensor.a_sunny", start_hour: 10, end_hour: 9 }, /smaller/],
    [{ entity: "binary_sensor.a_sunny", start_hour: 1.5 }, /start_hour/],
    [{ entity: "binary_sensor.a_sunny", end_hour: 25 }, /end_hour/],
    [{ entity: "binary_sensor.a_sunny", day: "yesterday" }, /day/],
    [{ mode: "map", entity: "binary_sensor.a_sunny", start_hour: "auto" }, /start_hour/],
    [{ mode: "timeline", entity: "binary_sensor.a_sunny", end_hour: "late" }, /end_hour/],
  ])("rejects invalid config %#", (raw, message) => {
    expect(() => parseConfig(raw)).toThrow(message);
  });
});

describe("clampRefreshMinutes", () => {
  it("defaults to 5 and clamps to 1-60 whole minutes", () => {
    expect(clampRefreshMinutes(undefined)).toBe(5);
    expect(clampRefreshMinutes(0)).toBe(1);
    expect(clampRefreshMinutes(-4)).toBe(1);
    expect(clampRefreshMinutes(0.2)).toBe(1);
    expect(clampRefreshMinutes(2.6)).toBe(3);
    expect(clampRefreshMinutes(500)).toBe(60);
    expect(clampRefreshMinutes(15)).toBe(15);
  });

  it("rejects non-numbers", () => {
    expect(() => clampRefreshMinutes("5")).toThrow(/refresh_minutes/);
    expect(() => clampRefreshMinutes(Number.NaN)).toThrow(/refresh_minutes/);
  });
});

describe("parseShadowConfig", () => {
  const id = "binary_sensor.a_sunny";

  it("fills defaults", () => {
    expect(parseShadowConfig({ type: "custom:sunspots-shadow-card", entity: id })).toEqual({
      type: "custom:sunspots-shadow-card",
      entity: id,
      theme: "auto",
      refreshMinutes: 5,
      showSlider: false,
      startHour: 4,
      endHour: 23,
    });
  });

  it("uses the first of entities when entity is absent", () => {
    expect(parseShadowConfig({ entities: [id, "binary_sensor.b_sunny"] }).entity).toBe(id);
    expect(parseShadowConfig({ entity: id, entities: ["binary_sensor.b_sunny"] }).entity).toBe(id);
  });

  it("reads all options", () => {
    const c = parseShadowConfig({ entity: id, title: "Yard", theme: "dark", refresh_minutes: 99, show_slider: true, start_hour: 6, end_hour: 20 });
    expect(c).toMatchObject({ title: "Yard", theme: "dark", refreshMinutes: 60, showSlider: true, startHour: 6, endHour: 20 });
  });

  it.each([
    [null, /expected an object/],
    [{}, /entity/],
    [{ entities: [] }, /entity/],
    [{ entities: "x" }, /list/],
    [{ entity: "sensor.a" }, /binary_sensor/],
    [{ entity: id, theme: "blue" }, /theme/],
    [{ entity: id, show_slider: "yes" }, /show_slider/],
    [{ entity: id, title: 1 }, /title/],
    [{ entity: id, start_hour: 20, end_hour: 5 }, /smaller/],
    [{ entity: id, refresh_minutes: "5" }, /refresh_minutes/],
  ])("rejects invalid config %#", (raw, message) => {
    expect(() => parseShadowConfig(raw)).toThrow(message);
  });
});
