import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce, LatestRunner, SequenceGuard, type Settled } from "../src/async";

describe("debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once with the last arguments", () => {
    const fn = vi.fn();
    const d = debounce(fn, 150);
    d.call(1);
    vi.advanceTimersByTime(100);
    d.call(2);
    vi.advanceTimersByTime(149);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it("can be cancelled", () => {
    const fn = vi.fn();
    const d = debounce(fn, 150);
    d.call();
    d.cancel();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("SequenceGuard", () => {
  it("only the latest id is current", () => {
    const g = new SequenceGuard();
    const a = g.next();
    const b = g.next();
    expect(g.isCurrent(a)).toBe(false);
    expect(g.isCurrent(b)).toBe(true);
  });
});

describe("LatestRunner", () => {
  function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it("runs one task at a time and drops stale results", async () => {
    const calls: { arg: number; d: ReturnType<typeof deferred<string>> }[] = [];
    let running = 0;
    let maxRunning = 0;
    const results: Settled<string>[] = [];
    const runner = new LatestRunner<number, string>(
      (arg) => {
        const d = deferred<string>();
        calls.push({ arg, d });
        running += 1;
        maxRunning = Math.max(maxRunning, running);
        return d.promise.finally(() => (running -= 1));
      },
      (r) => results.push(r),
    );
    runner.request(1);
    runner.request(2);
    runner.request(3);
    expect(calls.map((c) => c.arg)).toEqual([1]);
    calls[0]?.d.resolve("one");
    await vi.waitFor(() => expect(calls.length).toBe(2));
    expect(calls[1]?.arg).toBe(3);
    calls[1]?.d.resolve("three");
    await vi.waitFor(() => expect(results.length).toBe(1));
    expect(results).toEqual([{ ok: true, value: "three" }]);
    expect(maxRunning).toBe(1);
  });

  it("reports errors of the current request", async () => {
    const results: Settled<string>[] = [];
    const runner = new LatestRunner<number, string>(
      () => Promise.reject(new Error("boom")),
      (r) => results.push(r),
    );
    runner.request(1);
    await vi.waitFor(() => expect(results.length).toBe(1));
    expect(results[0]?.ok).toBe(false);
  });

  it("delivers nothing after dispose", async () => {
    const d = deferred<string>();
    const results: Settled<string>[] = [];
    const runner = new LatestRunner<number, string>(() => d.promise, (r) => results.push(r));
    runner.request(1);
    runner.dispose();
    d.resolve("late");
    await Promise.resolve();
    await Promise.resolve();
    expect(results).toEqual([]);
  });
});
