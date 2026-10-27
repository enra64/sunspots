import { describe, expect, it } from "vitest";
import { parseConfig, parseShadowConfig } from "../src/config";
import { buildShadowViewModel, buildViewModel } from "../src/viewmodel";
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

function timeline(hass: ReturnType<typeof hassWith>, raw: Record<string, unknown> = {}) {
  const vm = buildViewModel(hass, parseConfig({ mode: "timeline", entity: ids[0], ...raw }), NOW);
  if (vm.mode !== "timeline") throw new Error("mode");
  const [row] = vm.rows;
  if (!row) throw new Error("row");
  return row;
}

describe("timeline view-model", () => {
  const today: [string, string][] = [
    ["2026-10-27T11:00:00+01:00", "2026-10-27T13:30:00+01:00"],
    ["2026-10-27T15:00:00+01:00", "2026-10-27T17:20:00+01:00"],
  ];
  const tomorrow: [string, string][] = [["2026-10-28T09:40:00+01:00", "2026-10-28T12:00:00+01:00"]];

  it("shows today and tomorrow by default with header chip and auto hours", () => {
    const row = timeline(hassWith([spot("garden", { intervals: today, intervalsTomorrow: tomorrow })]));
    expect(row).toMatchObject({ name: "garden", status: "sunny", statusLabel: "Sunny", nowLabel: "Now" });
    expect(row.days.map((d) => d.label)).toEqual(["Today", "Tomorrow"]);
    // auto window 9-18: ticks 9..18, labels on even hours only
    expect(row.ticks).toHaveLength(10);
    expect(row.ticks.filter((t) => t.label).map((t) => t.label)).toEqual(["10", "12", "14", "16", "18"]);
    expect(row.ticks[0]).toEqual({ percent: 0 });
  });

  it("builds geometry bars with labels, summary and the now marker on today only", () => {
    const row = timeline(hassWith([spot("garden", { intervals: today, intervalsTomorrow: tomorrow })]));
    const [d0, d1] = row.days;
    expect(d0?.usesForecast).toBe(false);
    expect(d0?.bars.map((b) => b.label)).toEqual(["11:00–13:30", "15:00–17:20"]);
    expect(d0?.bars[0]?.left).toBeCloseTo((2 / 9) * 100);
    expect(d0?.nowPercent).toBeCloseTo((2 / 9) * 100);
    expect(d0?.summary).toBe("Sun: 11:00–13:30, 15:00–17:20 · 4.8 h");
    expect(d0?.ariaLabel).toBe(
      "garden, Today: Sun (no weather forecast) 11:00–13:30; Sun (no weather forecast) 15:00–17:20",
    );
    expect(d1?.nowPercent).toBeUndefined();
    expect(d1?.bars).toHaveLength(1);
    expect(d1?.summary).toBe("Sun: 09:40–12:00 · 2.3 h");
    expect(row.legend.map((l) => l.kind)).toEqual(["geometry"]);
  });

  it("selects the day and honours numeric hours", () => {
    const hass = hassWith([spot("garden", { intervals: today, intervalsTomorrow: tomorrow })]);
    const only = timeline(hass, { day: "tomorrow", start_hour: 6, end_hour: 22 });
    expect(only.days.map((d) => d.key)).toEqual(["tomorrow"]);
    expect(only.days[0]?.nowPercent).toBeUndefined();
    expect(only.days[0]?.bars[0]?.left).toBeCloseTo(((9 * 60 + 40 - 360) / 960) * 100);
    // 2h20 of a 16h bar is 14.6 %: too narrow for an inside label, still in the text summary
    expect(only.days[0]?.bars[0]?.label).toBeUndefined();
    expect(only.days[0]?.summary).toContain("09:40–12:00");
  });

  it("falls back to 6-22 and 'No direct sun' when there is no sun", () => {
    const row = timeline(hassWith([spot("garden")]));
    expect(row.ticks[0]).toEqual({ percent: 0, label: "06" });
    expect(row.days.map((d) => d.summary)).toEqual(["No direct sun", "No direct sun"]);
    expect(row.days[0]?.ariaLabel).toBe("garden, Today: no sun in this period");
    expect(row.legend).toEqual([]);
  });

  it("uses forecast windows for each day and adds first sun for tomorrow", () => {
    const hass = hassWith([
      spot("garden", {
        intervals: today,
        intervalsTomorrow: tomorrow,
        forecast: {
          state: "partly",
          attributes: {
            windows: [
              { start: "2026-10-27T11:00:00+01:00", end: "2026-10-27T13:30:00+01:00", class: "partly", past: false },
              { start: "2026-10-27T15:00:00+01:00", end: "2026-10-27T17:20:00+01:00", class: "sunny", past: false },
              { start: "2026-10-27T16:00:00+01:00", end: "2026-10-27T18:00:00+01:00", class: "bogus", past: false },
            ],
          },
        },
        tomorrow: {
          state: "2026-10-28T08:40:00+00:00",
          attributes: {
            windows: [{ start: "2026-10-28T09:40:00+01:00", end: "2026-10-28T12:00:00+01:00", class: "sunny", past: false }],
          },
        },
      }),
    ]);
    const row = timeline(hass);
    const [d0, d1] = row.days;
    expect(d0?.usesForecast).toBe(true);
    expect(d0?.bars.map((b) => b.kind)).toEqual(["partly", "sunny"]);
    expect(d0?.ariaLabel).toContain("Partly sunny 11:00–13:30");
    expect(d0?.summary).toBe("Sun: 15:00–17:20 · 2.3 h");
    expect(d1?.usesForecast).toBe(true);
    expect(d1?.summary).toBe("Sun: 09:40–12:00 · 2.3 h · first sun 09:40");
    expect(row.legend.map((l) => l.kind)).toEqual(["sunny", "partly", "unlikely"]);
  });

  it("describes a partly-sunny-only day in words", () => {
    const hass = hassWith([
      spot("garden", {
        forecast: {
          state: "partly",
          attributes: { windows: [{ start: "2026-10-27T11:00:00+01:00", end: "2026-10-27T13:00:00+01:00", class: "partly", past: false }] },
        },
      }),
    ]);
    expect(timeline(hass, { day: "today" }).days[0]?.summary).toBe("Partly sunny: 11:00–13:00 · 2 h");
  });

  it("copes with missing sibling entities and an unknown sun_tomorrow", () => {
    const missingSibling = timeline(hassWith([spot("garden", { intervalsTomorrow: tomorrow })]), { day: "tomorrow" });
    expect(missingSibling.days[0]?.usesForecast).toBe(false);
    expect(missingSibling.days[0]?.summary).toBe("Sun: 09:40–12:00 · 2.3 h");

    const unknown = timeline(hassWith([spot("garden", { tomorrow: { state: "unknown" } })]), { day: "tomorrow" });
    expect(unknown.days[0]?.summary).toBe("No direct sun");

    const unavailable = timeline(
      hassWith([spot("garden", { intervalsTomorrow: tomorrow, tomorrow: { state: "unavailable" } })]),
      { day: "tomorrow" },
    );
    expect(unavailable.days[0]?.summary).toBe("Sun: 09:40–12:00 · 2.3 h");
  });

  it("falls back to the sun_tomorrow intervals when the binary sensor lacks them", () => {
    const hass = hassWith([
      spot("garden", {
        tomorrow: {
          state: "2026-10-28T08:40:00+00:00",
          attributes: { intervals: [{ start: "2026-10-28T09:40:00+01:00", end: "2026-10-28T10:40:00+01:00" }], sun_hours: 1 },
        },
      }),
    ]);
    const day = timeline(hass, { day: "tomorrow" }).days[0];
    expect(day?.bars).toHaveLength(1);
    expect(day?.summary).toBe("Sun: 09:40–10:40 · 1 h · first sun 09:40");
  });

  it("handles intervals crossing midnight and 12 h locales", () => {
    const hass = hassWith(
      [
        spot("garden", {
          intervals: [["2026-10-27T22:00:00+01:00", "2026-10-28T01:00:00+01:00"]],
          intervalsTomorrow: [["2026-10-27T23:00:00+01:00", "2026-10-28T02:00:00+01:00"]],
        }),
      ],
      "en-US",
    );
    const row = timeline(hass);
    expect(row.ticks.at(-1)).toEqual({ percent: 100, label: "12 AM" });
    expect(row.days[0]?.summary).toBe("Sun: 10:00 PM–12:00 AM · 2 h");
    expect(row.days[1]?.summary).toBe("Sun: 12:00 AM–02:00 AM · 2 h");
  });

  it("reports an unknown entity", () => {
    const vm = buildViewModel(hassWith([]), parseConfig({ mode: "timeline", entity: ids[0] }), NOW);
    if (vm.mode !== "timeline") throw new Error("mode");
    expect(vm.rows[0]?.error).toContain(ids[0]);
  });

  it("localises to German", () => {
    const row = timeline(hassWith([spot("garden", { intervals: today })], "de"));
    expect(row.days.map((d) => d.label)).toEqual(["Heute", "Morgen"]);
    expect(row.days[0]?.summary).toBe("Sonne: 11:00–13:30, 15:00–17:20 · 4,8 Std.");
    expect(row.days[1]?.summary).toBe("Keine direkte Sonne");
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

describe("shadow card view-model", () => {
  it("builds the slider model and title for one spot", () => {
    const hass = hassWith([spot("garden")]);
    const { title, map } = buildShadowViewModel(hass, parseShadowConfig({ entity: ids[0], title: "Yard" }), NOW);
    expect(title).toBe("Yard");
    expect(map).toMatchObject({ name: "garden", minMinute: 240, maxMinute: 1380, initialMinute: 660, attribution: "Data by Example" });
    expect(buildShadowViewModel(hass, parseShadowConfig({ entity: ids[0] }), NOW).title).toBe("Sunspots");
  });

  it("reports an unknown entity", () => {
    const { map } = buildShadowViewModel(hassWith([]), parseShadowConfig({ entity: ids[0] }), NOW);
    expect(map.error).toContain(ids[0]);
  });
});
