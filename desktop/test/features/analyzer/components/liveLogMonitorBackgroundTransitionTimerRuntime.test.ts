import { describe, expect, it, vi } from "vitest";

import { applyBackgroundTransitionSchedule } from "../../../../src/features/analyzer/components/liveLogMonitorBackgroundTransitionTimerRuntime";

describe("liveLogMonitorBackgroundTransitionTimerRuntime", () => {
  it("clears transition state when scheduling is not possible", () => {
    const setBackgroundTransitionPlan = vi.fn();

    const timerId = applyBackgroundTransitionSchedule({
      schedulePlan: { action: "clear" },
      setBackgroundTransitionPlan,
      scheduleTimeout: vi.fn(() => 99),
      onStartTransition: vi.fn(),
    });

    expect(timerId).toBeNull();
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith(null);
  });

  it("arms the timeout and starts the requested transition", () => {
    const setBackgroundTransitionPlan = vi.fn();
    const onStartTransition = vi.fn();
    let scheduled: (() => void) | null = null;

    const timerId = applyBackgroundTransitionSchedule({
      schedulePlan: {
        action: "schedule",
        trackIndex: 1,
        transitionPlan: { nextTrackId: "track-2" } as never,
        delayMs: 25,
      },
      setBackgroundTransitionPlan,
      scheduleTimeout: (handler, _delayMs) => {
        scheduled = handler;
        return 25;
      },
      onStartTransition,
    });

    expect(timerId).toBe(25);
    expect(setBackgroundTransitionPlan).toHaveBeenCalledWith({ nextTrackId: "track-2" });
    scheduled?.();
    expect(onStartTransition).toHaveBeenCalledWith(1, { nextTrackId: "track-2" });
  });
});
