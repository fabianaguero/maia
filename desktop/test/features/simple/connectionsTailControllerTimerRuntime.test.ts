import { describe, expect, it, vi } from "vitest";

import {
  clearConnectionTailPollTimer,
  scheduleConnectionTailPollTimer,
} from "../../../src/features/simple/connectionsTailControllerTimerRuntime";

describe("connectionsTailControllerTimerRuntime", () => {
  it("clears active timers and normalizes the stored id back to null", () => {
    const clearTimeoutFn = vi.fn();
    expect(clearConnectionTailPollTimer(42, clearTimeoutFn)).toBeNull();
    expect(clearTimeoutFn).toHaveBeenCalledWith(42);
    expect(clearConnectionTailPollTimer(null, clearTimeoutFn)).toBeNull();
  });

  it("replaces an existing timer before scheduling a new one", () => {
    const clearTimeoutFn = vi.fn();
    const setTimeoutFn = vi.fn().mockReturnValue(77);
    const run = vi.fn();

    expect(
      scheduleConnectionTailPollTimer({
        currentTimerId: 21,
        delayMs: 150,
        run,
        setTimeoutFn,
        clearTimeoutFn,
      }),
    ).toBe(77);

    expect(clearTimeoutFn).toHaveBeenCalledWith(21);
    expect(setTimeoutFn).toHaveBeenCalledWith(run, 150);
  });
});
