import { describe, expect, it } from "vitest";
import { checkSvgPayload, errorMessage, MAX_SVG_BYTES, parseRenderResponse, renderShadowMapMessage } from "../src/render";

const ID = "binary_sensor.garden_sunny";

describe("checkSvgPayload", () => {
  it("accepts a normal svg", () => {
    expect(checkSvgPayload("<svg/>")).toEqual({ ok: true, svg: "<svg/>" });
  });

  it("rejects non-strings and empty strings", () => {
    expect(checkSvgPayload(undefined)).toEqual({ ok: false, reason: "invalid" });
    expect(checkSvgPayload("")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects payloads above 300 KB", () => {
    expect(checkSvgPayload("a".repeat(MAX_SVG_BYTES))).toMatchObject({ ok: true });
    expect(checkSvgPayload("a".repeat(MAX_SVG_BYTES + 1))).toEqual({ ok: false, reason: "too_large" });
  });

  it("measures bytes, not characters, for multi-byte text", () => {
    expect(checkSvgPayload("€".repeat(MAX_SVG_BYTES / 3 + 1))).toEqual({ ok: false, reason: "too_large" });
  });
});

describe("parseRenderResponse", () => {
  it("extracts the map for the entity", () => {
    const parsed = parseRenderResponse(
      { context: {}, response: { [ID]: { svg: "<svg/>", time: "2026-10-27T11:00:00+01:00", sun_azimuth: 170.5, sun_elevation: 20, sun_below_horizon: false } } },
      ID,
    );
    expect(parsed).toEqual({
      ok: true,
      map: { svg: "<svg/>", time: "2026-10-27T11:00:00+01:00", sunAzimuth: 170.5, sunElevation: 20, sunBelowHorizon: false },
    });
  });

  it("flags missing entries and oversized svgs", () => {
    expect(parseRenderResponse({ response: {} }, ID)).toEqual({ ok: false, reason: "invalid" });
    expect(parseRenderResponse(null, ID)).toEqual({ ok: false, reason: "invalid" });
    expect(parseRenderResponse({ response: { [ID]: { svg: "x".repeat(MAX_SVG_BYTES + 1) } } }, ID)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });
});

describe("websocket helpers", () => {
  it("builds the call_service message", () => {
    expect(renderShadowMapMessage(ID, "2026-10-27T11:00:00")).toEqual({
      type: "call_service",
      domain: "sunspots",
      service: "render_shadow_map",
      service_data: { time: "2026-10-27T11:00:00" },
      target: { entity_id: ID },
      return_response: true,
    });
  });

  it("extracts error messages", () => {
    expect(errorMessage({ code: "service_validation_error", message: "bad time" })).toBe("bad time");
    expect(errorMessage(new Error("x"))).toBe("x");
    expect(errorMessage(42)).toBe("unknown error");
  });
});
