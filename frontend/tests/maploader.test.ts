import { afterEach, describe, expect, it, vi } from "vitest";
import { MapLoader, type MapState } from "../src/maploader";
import { MAX_SVG_BYTES } from "../src/render";
import { makeHass } from "./fixtures";

const ID = "binary_sensor.garden_sunny";

function setup(send: (message: Record<string, unknown>) => Promise<unknown>, language = "en-GB") {
  const hass = makeHass([], [], language);
  hass.connection.sendMessagePromise = <T,>(message: Record<string, unknown>) => send(message) as Promise<T>;
  const states: MapState[] = [];
  const loader = new MapLoader(() => hass, (s) => states.push(s));
  return { loader, states };
}

const ok = (svg = "<svg/>") => ({ response: { [ID]: { svg, time: "2026-10-27T11:00:00+01:00", sun_azimuth: 170, sun_elevation: 20 } } });

afterEach(() => vi.restoreAllMocks());

describe("MapLoader", () => {
  it("sends the theme and time, then exposes a blob url", async () => {
    const sent: Record<string, unknown>[] = [];
    const { loader, states } = setup((m) => {
      sent.push(m);
      return Promise.resolve(ok());
    });
    loader.request({ entityId: ID, isoTime: undefined, theme: "dark" });
    expect(states[0]).toEqual({ status: "loading" });
    await vi.waitFor(() => expect(loader.state.status).toBe("ready"));
    expect(sent[0]?.["service_data"]).toEqual({ theme: "dark" });
    const state = loader.state;
    if (state.status !== "ready") throw new Error("state");
    expect(state.url.startsWith("blob:")).toBe(true);
    expect(state.map.sunAzimuth).toBe(170);
  });

  it("revokes the previous url when a new render arrives and on reset", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { loader } = setup(() => Promise.resolve(ok()));
    loader.request({ entityId: ID, isoTime: "2026-10-27T11:00:00", theme: "light" });
    await vi.waitFor(() => expect(loader.state.status).toBe("ready"));
    const first = loader.state.status === "ready" ? loader.state.url : "";
    loader.request({ entityId: ID, isoTime: "2026-10-27T11:10:00", theme: "light" });
    expect(loader.state).toMatchObject({ status: "loading", url: first });
    await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith(first));
    await vi.waitFor(() => expect(loader.state.status).toBe("ready"));
    const second = loader.state.status === "ready" ? loader.state.url : "";
    loader.reset();
    expect(revoke).toHaveBeenCalledWith(second);
    expect(loader.state).toEqual({ status: "idle" });
  });

  it("reports oversized and invalid payloads", async () => {
    const { loader } = setup(() => Promise.resolve(ok("x".repeat(MAX_SVG_BYTES + 1))));
    loader.request({ entityId: ID, isoTime: undefined, theme: "light" });
    await vi.waitFor(() => expect(loader.state).toEqual({ status: "error", message: "The map is too large to display." }));
    const bad = setup(() => Promise.resolve({ response: {} }), "de");
    bad.loader.request({ entityId: ID, isoTime: undefined, theme: "light" });
    await vi.waitFor(() => expect(bad.loader.state).toEqual({ status: "error", message: "Die Antwort für die Karte war ungültig." }));
  });

  it("reports service errors", async () => {
    const { loader } = setup(() => Promise.reject({ code: "x", message: "boom" }));
    loader.request({ entityId: ID, isoTime: undefined, theme: "light" });
    await vi.waitFor(() => expect(loader.state).toEqual({ status: "error", message: "The map could not be loaded: boom" }));
  });

  it("keeps one request in flight and drops superseded results", async () => {
    const resolvers: ((v: unknown) => void)[] = [];
    const times: unknown[] = [];
    const { loader } = setup((m) => {
      times.push((m["service_data"] as { time?: string }).time);
      return new Promise((resolve) => resolvers.push(resolve));
    });
    for (const t of ["a", "b", "c"]) loader.request({ entityId: ID, isoTime: t, theme: "light" });
    expect(times).toEqual(["a"]);
    resolvers[0]?.(ok());
    await vi.waitFor(() => expect(times).toEqual(["a", "c"]));
    expect(loader.state.status).toBe("loading");
    resolvers[1]?.(ok());
    await vi.waitFor(() => expect(loader.state.status).toBe("ready"));
  });

  it("delivers nothing after reset", async () => {
    let resolve: (v: unknown) => void = () => undefined;
    const { loader } = setup(() => new Promise((r) => (resolve = r)));
    loader.request({ entityId: ID, isoTime: undefined, theme: "light" });
    loader.reset();
    resolve(ok());
    await new Promise((r) => setTimeout(r, 0));
    expect(loader.state).toEqual({ status: "idle" });
  });
});
