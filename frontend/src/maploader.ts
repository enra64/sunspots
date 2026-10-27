import { LatestRunner, type Settled } from "./async";
import { translate } from "./locale";
import { errorMessage, parseRenderResponse, renderShadowMapMessage, type ShadowMap } from "./render";
import type { Hass, Theme } from "./types";
import { languageOf } from "./viewmodel";

export type MapState =
  | { status: "idle" }
  | { status: "loading"; url?: string; map?: ShadowMap }
  | { status: "ready"; url: string; map: ShadowMap }
  | { status: "error"; message: string };

export interface MapRequest {
  entityId: string;
  /** Local ISO time; omitted for "now". */
  isoTime: string | undefined;
  theme: Theme;
}

class MapRejected extends Error {
  constructor(readonly reason: "invalid" | "too_large") {
    super(reason);
  }
}

/**
 * Loads shadow-map renders for a card: one request in flight (latest wins),
 * the SVG exposed only as a blob object URL that is revoked when replaced.
 */
export class MapLoader {
  private runner: LatestRunner<MapRequest, ShadowMap> | undefined;
  private objectUrl: string | undefined;
  private current: MapState = { status: "idle" };

  constructor(
    private readonly getHass: () => Hass | undefined,
    private readonly onChange: (state: MapState) => void,
  ) {}

  get state(): MapState {
    return this.current;
  }

  request(request: MapRequest): void {
    const previous = this.current;
    this.setState(
      previous.status === "ready" || previous.status === "loading"
        ? { status: "loading", ...(previous.url ? { url: previous.url } : {}), ...(previous.map ? { map: previous.map } : {}) }
        : { status: "loading" },
    );
    this.runner ??= new LatestRunner<MapRequest, ShadowMap>(
      (req) => this.fetch(req),
      (result) => this.settled(result),
    );
    this.runner.request(request);
  }

  /** Drop pending work and the current image. */
  reset(): void {
    this.runner?.dispose();
    this.runner = undefined;
    this.revoke();
    this.setState({ status: "idle" });
  }

  private setState(state: MapState): void {
    this.current = state;
    this.onChange(state);
  }

  private revoke(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }

  private async fetch(request: MapRequest): Promise<ShadowMap> {
    const hass = this.getHass();
    if (!hass) throw new Error("not ready");
    const raw = await hass.connection.sendMessagePromise<unknown>(
      renderShadowMapMessage(request.entityId, request.isoTime, request.theme),
    );
    const parsed = parseRenderResponse(raw, request.entityId);
    if (!parsed.ok) throw new MapRejected(parsed.reason);
    return parsed.map;
  }

  private settled(result: Settled<ShadowMap>): void {
    this.revoke();
    if (!result.ok) {
      const hass = this.getHass();
      const lang = hass ? languageOf(hass) : undefined;
      const error = result.error;
      const message =
        error instanceof MapRejected
          ? translate(lang, error.reason === "too_large" ? "map_too_large" : "map_invalid")
          : translate(lang, "map_error", { message: errorMessage(error) });
      this.setState({ status: "error", message });
      return;
    }
    this.objectUrl = URL.createObjectURL(new Blob([result.value.svg], { type: "image/svg+xml" }));
    this.setState({ status: "ready", url: this.objectUrl, map: result.value });
  }
}
