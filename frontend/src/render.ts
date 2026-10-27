import type { Theme } from "./types";

export const MAX_SVG_BYTES = 300 * 1024;

export type SvgCheck = { ok: true; svg: string } | { ok: false; reason: "invalid" | "too_large" };

/** Reject non-strings and oversized payloads before they are turned into a Blob. */
export function checkSvgPayload(svg: unknown, maxBytes: number = MAX_SVG_BYTES): SvgCheck {
  if (typeof svg !== "string" || svg.length === 0) return { ok: false, reason: "invalid" };
  // UTF-8 needs at most 3 bytes per UTF-16 unit, so only measure when it could matter.
  if (svg.length > maxBytes) return { ok: false, reason: "too_large" };
  if (svg.length * 3 > maxBytes && new TextEncoder().encode(svg).length > maxBytes) {
    return { ok: false, reason: "too_large" };
  }
  return { ok: true, svg };
}

export interface ShadowMap {
  svg: string;
  time: string | undefined;
  sunAzimuth: number | undefined;
  sunElevation: number | undefined;
  sunBelowHorizon: boolean;
}

export type MapParse =
  | { ok: true; map: ShadowMap }
  | { ok: false; reason: "invalid" | "too_large" };

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Validate the websocket result of `sunspots.render_shadow_map` for one entity. */
export function parseRenderResponse(raw: unknown, entityId: string): MapParse {
  const response = (raw as { response?: Record<string, unknown> } | null | undefined)?.response;
  const entry = response?.[entityId];
  if (typeof entry !== "object" || entry === null) return { ok: false, reason: "invalid" };
  const data = entry as Record<string, unknown>;
  const check = checkSvgPayload(data["svg"]);
  if (!check.ok) return check;
  return {
    ok: true,
    map: {
      svg: check.svg,
      time: typeof data["time"] === "string" ? data["time"] : undefined,
      sunAzimuth: num(data["sun_azimuth"]),
      sunElevation: num(data["sun_elevation"]),
      sunBelowHorizon: data["sun_below_horizon"] === true,
    },
  };
}

/** Service call for one entity; without `isoTime` the integration renders the current moment. */
export function renderShadowMapMessage(
  entityId: string,
  isoTime: string | undefined,
  theme: Theme,
): Record<string, unknown> {
  return {
    type: "call_service",
    domain: "sunspots",
    service: "render_shadow_map",
    service_data: isoTime === undefined ? { theme } : { time: isoTime, theme },
    target: { entity_id: entityId },
    return_response: true,
  };
}

/** Human readable message from a websocket error ({code, message}) or Error. */
export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message !== "") return message;
  }
  return "unknown error";
}
