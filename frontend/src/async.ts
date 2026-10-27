/** Debounce: only the last call within `delayMs` runs. */
export interface Debounced<A extends unknown[]> {
  call(...args: A): void;
  cancel(): void;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, delayMs: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    call(...args: A) {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        fn(...args);
      }, delayMs);
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

/** Hands out increasing ids; only the most recent one is "current". */
export class SequenceGuard {
  private latest = 0;

  next(): number {
    this.latest += 1;
    return this.latest;
  }

  isCurrent(id: number): boolean {
    return id === this.latest;
  }
}

export type Settled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/**
 * Runs `task` with at most one call in flight. Requests made while busy replace
 * each other (latest wins); results of superseded requests are dropped.
 */
export class LatestRunner<A, R> {
  private readonly guard = new SequenceGuard();
  private busy = false;
  private pending: { arg: A; id: number } | undefined;
  private disposed = false;

  constructor(
    private readonly task: (arg: A) => Promise<R>,
    private readonly onSettled: (result: Settled<R>) => void,
  ) {}

  request(arg: A): void {
    if (this.disposed) return;
    this.pending = { arg, id: this.guard.next() };
    if (!this.busy) void this.drain();
  }

  dispose(): void {
    this.disposed = true;
    this.pending = undefined;
  }

  private async drain(): Promise<void> {
    this.busy = true;
    while (this.pending && !this.disposed) {
      const { arg, id } = this.pending;
      this.pending = undefined;
      let result: Settled<R>;
      try {
        result = { ok: true, value: await this.task(arg) };
      } catch (error) {
        result = { ok: false, error };
      }
      if (!this.disposed && this.guard.isCurrent(id)) this.onSettled(result);
    }
    this.busy = false;
  }
}
