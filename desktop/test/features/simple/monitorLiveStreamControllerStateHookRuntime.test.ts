import { describe, expect, it, vi } from "vitest";

import { createMonitorLiveStreamSimulateLogHandler } from "../../../src/features/simple/monitorLiveStreamControllerStateHookRuntime";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";

describe("monitorLiveStreamControllerStateHookRuntime", () => {
  it("creates a simulate-log handler from ref state and utilities", () => {
    const refs = {
      liveLinesRef: { current: [] as Array<{ id: string }> },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
    };
    const setLiveLines = vi.fn();
    const setLogSignalBuffer = vi.fn();

    const simulateLog = createMonitorLiveStreamSimulateLogHandler({
      refs,
      setLiveLines,
      setLogSignalBuffer,
      now: () => 2000,
      random: () => 0.7,
      maxLiveLines: 8,
    });

    const nextState = simulateLog();

    expect(nextState.mock.id).toContain("sim-");
    expect(setLiveLines).toHaveBeenCalledWith(nextState.nextLiveLines);
    expect(setLogSignalBuffer).toHaveBeenCalledWith(nextState.nextLogSignalBuffer);
  });
});
