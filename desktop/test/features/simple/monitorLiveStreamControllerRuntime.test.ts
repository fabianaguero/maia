import { describe, expect, it, vi } from "vitest";

import { simulateMonitorLiveStreamLogState } from "../../../src/features/simple/monitorLiveStreamControllerRuntime";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";

describe("monitorLiveStreamControllerRuntime", () => {
  it("simulates monitor log state and updates refs plus setters", () => {
    const refs = {
      liveLinesRef: { current: [] as Array<{ id: string }> },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
    };
    const setLiveLines = vi.fn();
    const setLogSignalBuffer = vi.fn();

    const nextState = simulateMonitorLiveStreamLogState({
      nowMs: 2000,
      previousLiveLines: refs.liveLinesRef.current,
      previousLogSignalBuffer: refs.logSignalBufferRef.current,
      setLiveLines,
      setLogSignalBuffer,
      refs,
      randomValue: 0.7,
      maxLiveLines: 8,
    });

    expect(nextState.mock.id).toContain("sim-");
    expect(refs.liveLinesRef.current[0]?.id).toBe(nextState.mock.id);
    expect(setLiveLines).toHaveBeenCalledWith(nextState.nextLiveLines);
    expect(setLogSignalBuffer).toHaveBeenCalledWith(nextState.nextLogSignalBuffer);
  });
});
