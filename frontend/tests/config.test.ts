import { describe, expect, it } from "vitest";
import { parseConfig } from "../src/config";

describe("parseConfig", () => {
  it("defaults to overview with entities list", () => {
    const c = parseConfig({ type: "custom:sunspots-card", entities: ["binary_sensor.a_sunny"] });
    expect(c.mode).toBe("overview");
    expect(c.entities).toEqual(["binary_sensor.a_sunny"]);
    expect(c.startHour).toBe(6);
    expect(c.endHour).toBe(22);
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
  ])("rejects invalid config %#", (raw, message) => {
    expect(() => parseConfig(raw)).toThrow(message);
  });
});
