import { describe, expect, it } from "vitest";
import { findSiblings, pickStubEntity } from "../src/entities";
import { hassWith, spot } from "./fixtures";

describe("findSiblings", () => {
  it("maps translation keys of the same device only", () => {
    const hass = hassWith([
      spot("garden", { aware: "on", nextChange: "2026-10-27T12:00:00+00:00" }),
      spot("terrace", { forecast: { state: "partly" } }),
    ]);
    const s = findSiblings(hass, "binary_sensor.garden_sunny");
    expect(s).toEqual({
      sunny: "binary_sensor.garden_sunny",
      sunny_weather_aware: "binary_sensor.garden_sunny_weather_aware",
      next_change: "sensor.garden_next_change",
    });
  });

  it("returns undefined for unknown entities or entities without device", () => {
    const hass = hassWith([spot("garden")]);
    expect(findSiblings(hass, "binary_sensor.nope")).toBeUndefined();
    hass.entities["binary_sensor.garden_sunny"] = { entity_id: "binary_sensor.garden_sunny" };
    expect(findSiblings(hass, "binary_sensor.garden_sunny")).toBeUndefined();
  });
});

describe("pickStubEntity", () => {
  it("picks the first sunspots sunny binary sensor", () => {
    const hass = hassWith([spot("a", { forecast: { state: "partly" } }), spot("b")]);
    hass.entities["binary_sensor.other"] = { entity_id: "binary_sensor.other", platform: "other", translation_key: "sunny" };
    expect(pickStubEntity(hass, [])).toBe("binary_sensor.a_sunny");
    expect(pickStubEntity(hass, ["binary_sensor.other", "binary_sensor.b_sunny"])).toBe("binary_sensor.b_sunny");
  });

  it("returns undefined when nothing matches", () => {
    expect(pickStubEntity(hassWith([]), [])).toBeUndefined();
  });
});
