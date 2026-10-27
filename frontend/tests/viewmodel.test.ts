import { describe, expect, it } from "vitest";
import { parseConfig } from "../src/config";
import { buildViewModel } from "../src/viewmodel";
import { hassWith, NOW, spot } from "./fixtures";

const ids = ["binary_sensor.garden_sunny", "binary_sensor.terrace_sunny"];

function overview(hass = hassWith([]), entities = ids) {
  const vm = buildViewModel(hass, parseConfig({ entities }), NOW);
  if (vm.mode !== "overview") throw new Error("mode");
  return vm.rows;
}

describe("overview view-model", () => {
  const hass = hassWith([
    spot("garden", { sunny: "on", nextChange: "2026-10-27T13:30:00+00:00", hours: "4.25" }),
    spot("terrace", {
      sunny: "off",
      nextChange: "2026-10-27T13:00:00+00:00",
      forecast: {
        state: "sunny_later",
        attributes: { best_window: { start: "2026-10-27T15:00:00+01:00", end: "2026-10-27T16:00:00+01:00", class: "sunny" } },
      },
    }),
  ]);

  it("shows status with icon+text and until/from", () => {
    const [garden, terrace] = overview(hass);
    expect(garden).toMatchObject({ name: "garden", status: "sunny", statusLabel: "Sunny", boundary: "until 14:30" });
    expect(garden?.extras).toEqual(["4.3 h of sun today"]);
    expect(garden?.icon).not.toBe(terrace?.icon);
    expect(terrace).toMatchObject({
      status: "shaded",
      statusLabel: "Shaded",
      boundary: "from 14:00",
      forecastNote: "sun expected from 15:00",
    });
  });

  it("reports sun but cloudy when the weather-aware sibling is off", () => {
    const h = hassWith([spot("garden", { sunny: "on", aware: "off", cloud: 85 })]);
    const [row] = overview(h, [ids[0] as string]);
    expect(row).toMatchObject({ status: "sunny_cloudy", statusLabel: "Sun, but cloudy" });
    expect(row?.extras).toContain("85% clouds");
  });

  it("localises to German", () => {
    const h = hassWith([spot("garden", { sunny: "off", nextChange: "2026-10-27T13:00:00+00:00" })], "de");
    const [row] = overview(h, [ids[0] as string]);
    expect(row).toMatchObject({ statusLabel: "Schatten", boundary: "ab 14:00" });
  });

  it("flags missing and unavailable entities", () => {
    const h = hassWith([spot("garden", { sunny: "on" })]);
    h.states["binary_sensor.garden_sunny"] = { entity_id: "binary_sensor.garden_sunny", state: "unavailable", attributes: {} };
    const [garden, ghost] = overview(h);
    expect(garden?.status).toBe("unavailable");
    expect(ghost?.error).toContain("binary_sensor.terrace_sunny");
  });
});

describe("timeline view-model", () => {
  const intervals: [string, string][] = [
    ["2026-10-27T08:00:00+01:00", "2026-10-27T10:00:00+01:00"],
    ["2026-10-27T14:00:00+01:00", "2026-10-27T23:30:00+01:00"],
  ];

  it("degrades to geometry only with a text alternative", () => {
    const hass = hassWith([spot("garden", { intervals })]);
    const vm = buildViewModel(hass, parseConfig({ mode: "timeline", entity: ids[0] }), NOW);
    if (vm.mode !== "timeline") throw new Error("mode");
    const [row] = vm.rows;
    expect(row?.usesForecast).toBe(false);
    expect(row?.bars).toHaveLength(2);
    expect(row?.bars[1]?.width).toBeCloseTo(((22 - 14) / 16) * 100);
    expect(row?.summary).toBe("garden: Sun (no weather forecast) 08:00–10:00; Sun (no weather forecast) 14:00–22:00");
    expect(row?.timeline.nowPercent).toBeCloseTo((5 / 16) * 100);
    expect(row?.legend.map((l) => l.kind)).toEqual(["geometry"]);
  });

  it("draws forecast classes when windows exist", () => {
    const hass = hassWith([
      spot("garden", {
        intervals,
        forecast: {
          state: "partly",
          attributes: {
            windows: [
              { start: "2026-10-27T08:00:00+01:00", end: "2026-10-27T10:00:00+01:00", class: "partly", past: true },
              { start: "2026-10-27T14:00:00+01:00", end: "2026-10-27T16:00:00+01:00", class: "sunny", past: false },
              { start: "2026-10-27T16:00:00+01:00", end: "2026-10-27T18:00:00+01:00", class: "bogus", past: false },
            ],
          },
        },
      }),
    ]);
    const vm = buildViewModel(hass, parseConfig({ mode: "timeline", entity: ids[0] }), NOW);
    if (vm.mode !== "timeline") throw new Error("mode");
    const [row] = vm.rows;
    expect(row?.usesForecast).toBe(true);
    expect(row?.bars.map((b) => b.kind)).toEqual(["partly", "sunny"]);
    expect(row?.legend.map((l) => l.kind)).toEqual(["sunny", "partly", "unlikely"]);
    expect(row?.summary).toContain("Partly sunny 08:00–10:00");
  });
});

describe("map view-model", () => {
  it("defaults the slider to now, snapped and clamped", () => {
    const hass = hassWith([spot("garden")]);
    const vm = buildViewModel(hass, parseConfig({ mode: "map", entity: ids[0] }), NOW);
    if (vm.mode !== "map") throw new Error("mode");
    expect(vm.map).toMatchObject({ minMinute: 240, maxMinute: 1380, step: 10, initialMinute: 660, attribution: "Data by Example" });
    const early = buildViewModel(hass, parseConfig({ mode: "map", entity: ids[0], start_hour: 12 }), NOW);
    if (early.mode !== "map") throw new Error("mode");
    expect(early.map.initialMinute).toBe(720);
  });

  it("reports an unknown entity", () => {
    const vm = buildViewModel(hassWith([]), parseConfig({ mode: "map", entity: ids[0] }), NOW);
    if (vm.mode !== "map") throw new Error("mode");
    expect(vm.map.error).toBeDefined();
  });
});
