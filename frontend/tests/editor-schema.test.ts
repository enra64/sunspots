import { describe, expect, it } from "vitest";
import { cardSchema, editorHelper, editorLabel, modeOf, shadowSchema, type FormSchema } from "../src/editor-schema";
import { DICTIONARIES } from "../src/locale";

const names = (schema: FormSchema) => schema.map((f) => f.name);

describe("cardSchema", () => {
  it("offers mode, entities and title for the overview", () => {
    expect(names(cardSchema({}, "en"))).toEqual(["mode", "entities", "title"]);
    expect(names(cardSchema({ mode: "overview" }, "en"))).toEqual(["mode", "entities", "title"]);
  });

  it("treats unknown or invalid modes as overview", () => {
    expect(modeOf({ mode: "grid" })).toBe("overview");
    expect(modeOf({ mode: 3 })).toBe("overview");
    expect(names(cardSchema({ mode: "grid" }, "en"))).toEqual(["mode", "entities", "title"]);
  });

  it("adds days, full day and the optional hours for the timeline", () => {
    expect(names(cardSchema({ mode: "timeline" }, "en"))).toEqual([
      "mode", "entities", "title", "show_today", "show_tomorrow", "full_day", "start_hour", "end_hour",
    ]);
  });

  it("hides the hours while full_day is on", () => {
    expect(names(cardSchema({ mode: "timeline", full_day: true }, "en"))).toEqual([
      "mode", "entities", "title", "show_today", "show_tomorrow", "full_day",
    ]);
    expect(names(cardSchema({ mode: "timeline", full_day: false }, "en"))).toContain("start_hour");
  });

  it("offers only the hours for the map and ignores timeline-only options", () => {
    expect(names(cardSchema({ mode: "map", full_day: true }, "en"))).toEqual(["mode", "entities", "title", "start_hour", "end_hour"]);
  });

  it("uses a multiple entity selector limited to the sunspots binary sensors", () => {
    const entities = cardSchema({}, "en").find((f) => f.name === "entities");
    expect(entities?.selector).toEqual({ entity: { multiple: true, integration: "sunspots", domain: "binary_sensor" } });
  });

  it("makes hours optional numbers in box mode", () => {
    const start = cardSchema({ mode: "timeline" }, "en").find((f) => f.name === "start_hour");
    expect(start?.required).toBeUndefined();
    expect(start?.selector).toEqual({ number: { min: 0, max: 24, step: 1, mode: "box" } });
  });

  it("localizes the mode options", () => {
    const mode = (language: string) => cardSchema({}, language)[0]?.selector["select"];
    expect(mode("en")).toMatchObject({ options: [{ value: "overview", label: "Overview" }, { value: "timeline", label: "Timeline" }, { value: "map", label: "Shadow map" }] });
    expect(mode("de")).toMatchObject({ options: [{ label: "Übersicht" }, { label: "Zeitleiste" }, { label: "Schattenkarte" }] });
  });
});

describe("shadowSchema", () => {
  it("has a single entity selector and no slider range by default", () => {
    const schema = shadowSchema({}, "en");
    expect(names(schema)).toEqual(["entity", "title", "theme", "refresh_minutes", "show_slider"]);
    expect(schema[0]?.selector).toEqual({ entity: { integration: "sunspots", domain: "binary_sensor" } });
    expect(schema[0]?.required).toBe(true);
  });

  it("adds the slider range only while show_slider is on", () => {
    expect(names(shadowSchema({ show_slider: true }, "en")).slice(-2)).toEqual(["start_hour", "end_hour"]);
    expect(names(shadowSchema({ show_slider: false }, "en"))).not.toContain("start_hour");
    expect(names(shadowSchema({ show_slider: "yes" }, "en"))).not.toContain("start_hour");
  });

  it("offers the three themes and a 1-60 refresh number", () => {
    const schema = shadowSchema({}, "de");
    expect(schema.find((f) => f.name === "theme")?.selector["select"]).toMatchObject({
      options: [{ value: "auto", label: "Automatisch" }, { value: "light", label: "Hell" }, { value: "dark", label: "Dunkel" }],
    });
    expect(schema.find((f) => f.name === "refresh_minutes")?.selector).toEqual({ number: { min: 1, max: 60, step: 1, mode: "box" } });
  });
});

describe("labels and helpers", () => {
  const configs = [
    {}, { mode: "timeline" }, { mode: "timeline", full_day: true }, { mode: "map" },
  ];
  const fields = new Set([
    ...configs.flatMap((c) => names(cardSchema(c, "en"))),
    ...names(shadowSchema({ show_slider: true }, "en")),
  ]);

  it.each(["en", "de"])("labels every schema field in %s", (language) => {
    expect(fields.size).toBeGreaterThanOrEqual(12);
    for (const name of fields) {
      const label = editorLabel(name, language);
      expect(label, name).not.toBe(name);
      expect(label.length).toBeGreaterThan(2);
    }
  });

  it("gives de different texts than en for every field", () => {
    for (const name of fields) expect(editorLabel(name, "de"), name).not.toBe(editorLabel(name, "en"));
  });

  it.each(["en", "de"])("has helper texts for the fields that need them in %s", (language) => {
    for (const name of ["entities", "entity", "full_day", "theme", "refresh_minutes", "start_hour", "end_hour"]) {
      expect(editorHelper(name, language, "timeline"), name).not.toBe("");
    }
    for (const name of ["mode", "title", "show_today", "show_tomorrow", "show_slider"]) {
      expect(editorHelper(name, language, "timeline"), name).toBe("");
    }
  });

  it("explains empty hours only in the timeline", () => {
    expect(editorHelper("start_hour", "en", "timeline")).toContain("automatic");
    expect(editorHelper("start_hour", "en", "slider")).not.toContain("automatic");
  });

  it("falls back to the field name for unknown fields", () => {
    expect(editorLabel("other", "en")).toBe("other");
    expect(editorHelper("other", "en", "slider")).toBe("");
  });

  it("keeps every editor string in both dictionaries", () => {
    const editorKeys = (language: string) => Object.keys(DICTIONARIES[language] ?? {}).filter((k) => k.startsWith("editor_")).sort();
    expect(editorKeys("en").length).toBeGreaterThan(20);
    expect(editorKeys("de")).toEqual(editorKeys("en"));
  });
});
