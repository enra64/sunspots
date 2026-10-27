import { describe, expect, it } from "vitest";
import {
  cardFormData, configChangedEvent, normalizeCardConfig, normalizeShadowConfig, shadowFormData, toRecord,
} from "../src/editor-config";

const A = "binary_sensor.a_sunny";
const B = "binary_sensor.b_sunny";

describe("toRecord", () => {
  it("copes with partial and invalid configs", () => {
    expect(toRecord(undefined)).toEqual({});
    expect(toRecord(null)).toEqual({});
    expect(toRecord("x")).toEqual({});
    expect(toRecord([1])).toEqual({});
    const original = { a: 1 };
    expect(toRecord(original)).toEqual(original);
    expect(toRecord(original)).not.toBe(original);
  });
});

describe("cardFormData", () => {
  it("fills in the defaults shown by the form", () => {
    expect(cardFormData({ type: "custom:sunspots-card", entities: [A] })).toEqual({
      type: "custom:sunspots-card", mode: "overview", entities: [A], show_today: true, show_tomorrow: true, full_day: false,
    });
  });

  it("folds a single entity into the list and survives garbage", () => {
    expect(cardFormData({ entity: A }).entities).toEqual([A]);
    expect(cardFormData({ entity: A })).not.toHaveProperty("entity");
    expect(cardFormData({ entities: "nope" }).entities).toEqual(["nope"]);
    expect(cardFormData({ entities: [1, null, A] }).entities).toEqual([A]);
    expect(cardFormData({ mode: 7 }).mode).toBe("overview");
  });

  it("shows the default slider range for the map but nothing for the timeline", () => {
    expect(cardFormData({ mode: "map" })).toMatchObject({ start_hour: 4, end_hour: 23 });
    expect(cardFormData({ mode: "map", start_hour: 7 })).toMatchObject({ start_hour: 7, end_hour: 23 });
    expect(cardFormData({ mode: "timeline" })).not.toHaveProperty("start_hour");
  });
});

describe("normalizeCardConfig", () => {
  it("drops defaults and keeps type", () => {
    const value = { type: "custom:sunspots-card", mode: "overview", entities: [A], title: "", show_today: true, show_tomorrow: true, full_day: false };
    expect(normalizeCardConfig(value)).toEqual({ type: "custom:sunspots-card", entities: [A] });
  });

  it("keeps non-default timeline options in a stable order", () => {
    const out = normalizeCardConfig({ mode: "timeline", title: "Sun", entities: [A, B], full_day: true, show_today: false, show_tomorrow: true });
    expect(Object.keys(out)).toEqual(["type", "mode", "entities", "title", "show_today", "full_day"]);
    expect(out).toMatchObject({ type: "custom:sunspots-card", mode: "timeline", show_today: false, full_day: true });
  });

  it("drops empty hour fields and 'auto' so the timeline stays automatic", () => {
    const out = normalizeCardConfig({ mode: "timeline", entities: [A], start_hour: undefined, end_hour: null });
    expect(out).not.toHaveProperty("start_hour");
    expect(out).not.toHaveProperty("end_hour");
    for (const empty of ["", "  ", "auto", Number.NaN]) {
      expect(normalizeCardConfig({ mode: "timeline", entities: [A], start_hour: empty })).not.toHaveProperty("start_hour");
    }
  });

  it("keeps timeline hours, rounded and clamped, including 0", () => {
    const out = normalizeCardConfig({ mode: "timeline", entities: [A], start_hour: 0, end_hour: "30" });
    expect(out).toMatchObject({ start_hour: 0, end_hour: 24 });
    expect(normalizeCardConfig({ mode: "timeline", entities: [A], start_hour: 6.6 })).toMatchObject({ start_hour: 7 });
    expect(normalizeCardConfig({ mode: "timeline", entities: [A], start_hour: -3 })).toMatchObject({ start_hour: 0 });
  });

  it("drops map hours equal to the map defaults only", () => {
    expect(normalizeCardConfig({ mode: "map", entities: [A], start_hour: 4, end_hour: 23 })).toEqual({ type: "custom:sunspots-card", mode: "map", entities: [A] });
    expect(normalizeCardConfig({ mode: "map", entities: [A], start_hour: 5, end_hour: 23 })).toMatchObject({ start_hour: 5 });
  });

  it("migrates entity to entities", () => {
    const out = normalizeCardConfig({ entity: A, entities: [] });
    expect(out["entities"]).toEqual([A]);
    expect(out).not.toHaveProperty("entity");
  });

  it("preserves unknown keys from the form value and from the previous config", () => {
    const prev = { type: "custom:sunspots-card", entities: [A], grid_options: { rows: 4 }, visibility: [{ condition: "x" }] };
    const out = normalizeCardConfig({ entities: [A, B], extra: true }, prev);
    expect(out).toMatchObject({ entities: [A, B], grid_options: { rows: 4 }, visibility: [{ condition: "x" }], extra: true });
  });

  it("keeps hidden timeline values and does not mutate its input", () => {
    const value = { mode: "timeline", entities: [A], full_day: true, start_hour: 8, end_hour: 12 };
    const copy = JSON.parse(JSON.stringify(value));
    expect(normalizeCardConfig(value)).toMatchObject({ full_day: true, start_hour: 8, end_hour: 12 });
    expect(value).toEqual(copy);
  });

  it("falls back to the previous type, then to the card type, and copes with garbage", () => {
    expect(normalizeCardConfig({}, { type: "custom:sunspots-card" })["type"]).toBe("custom:sunspots-card");
    expect(normalizeCardConfig({})).toEqual({ type: "custom:sunspots-card", entities: [] });
    expect(normalizeCardConfig({ mode: "grid", entities: 5, title: 3, show_today: "no" })).toEqual({ type: "custom:sunspots-card", entities: [] });
  });
});

describe("shadow editor data", () => {
  it("shows defaults and takes the entity from entities", () => {
    expect(shadowFormData({ entities: [A, B] })).toEqual({
      entity: A, theme: "auto", refresh_minutes: 5, show_slider: false, start_hour: 4, end_hour: 23,
    });
    expect(shadowFormData({})["entity"]).toBe("");
    expect(shadowFormData({ entity: B, entities: [A] })["entity"]).toBe(B);
  });

  it("drops defaults and empty values but keeps entity and type", () => {
    const out = normalizeShadowConfig({
      type: "custom:sunspots-shadow-card", entity: A, title: " ", theme: "auto", refresh_minutes: 5, show_slider: false, start_hour: 4, end_hour: 23,
    });
    expect(out).toEqual({ type: "custom:sunspots-shadow-card", entity: A });
  });

  it("keeps changed options in a stable order and clamps the refresh interval", () => {
    const out = normalizeShadowConfig({ entity: A, title: "Yard", theme: "dark", refresh_minutes: 900, show_slider: true, start_hour: 6, end_hour: 20 });
    expect(Object.keys(out)).toEqual(["type", "entity", "title", "theme", "refresh_minutes", "show_slider", "start_hour", "end_hour"]);
    expect(out).toMatchObject({ refresh_minutes: 60, theme: "dark", start_hour: 6, end_hour: 20 });
    expect(normalizeShadowConfig({ entity: A, refresh_minutes: 0 })).toMatchObject({ refresh_minutes: 1 });
    expect(normalizeShadowConfig({ entity: A, refresh_minutes: "x" })).not.toHaveProperty("refresh_minutes");
    expect(normalizeShadowConfig({ entity: A, theme: "blue" })).not.toHaveProperty("theme");
  });

  it("replaces entities by entity, keeps unknown keys and survives partial configs", () => {
    const prev = { type: "custom:sunspots-shadow-card", entities: [A], grid_options: { columns: 6 } };
    const out = normalizeShadowConfig({ entity: A }, prev);
    expect(out).toEqual({ type: "custom:sunspots-shadow-card", entity: A, grid_options: { columns: 6 } });
    expect(normalizeShadowConfig({})).toEqual({ type: "custom:sunspots-shadow-card", entity: "" });
    expect(normalizeShadowConfig({ entity: 4, entities: [B] })["entity"]).toBe(B);
  });
});

describe("configChangedEvent", () => {
  it("is the standard bubbling, composed config-changed event", () => {
    const config = { type: "custom:sunspots-card", entities: [A] };
    const event = configChangedEvent(config);
    expect(event.type).toBe("config-changed");
    expect(event.detail).toEqual({ config });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});
