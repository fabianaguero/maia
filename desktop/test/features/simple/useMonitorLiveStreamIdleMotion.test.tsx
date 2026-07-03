import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";
import { useMonitorLiveStreamIdleMotion } from "../../../src/features/simple/useMonitorLiveStreamIdleMotion";

describe("useMonitorLiveStreamIdleMotion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances the signal buffer after the idle hold window", () => {
    const lastStreamEventAtRef = { current: 1_000 };
    const logSignalBufferRef = { current: createMonitorSignalBuffer() };
    const setLogSignalBuffer = vi.fn((updater) => {
      if (typeof updater === "function") {
        logSignalBufferRef.current = updater(logSignalBufferRef.current);
      }
    });
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(2_000);

    renderHook(() =>
      useMonitorLiveStreamIdleMotion({
        isListening: true,
        idleHoldMs: 300,
        trackBpm: 126,
        deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
        liveSuggestedBpmRef: { current: null },
        logSignalBufferRef,
        lastStreamEventAtRef,
        setLogSignalBuffer,
      }),
    );

    const before = logSignalBufferRef.current[60]?.val;
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(setLogSignalBuffer).toHaveBeenCalled();
    expect(logSignalBufferRef.current[60]?.val).not.toBe(before);
    dateNowSpy.mockRestore();
  });
});
