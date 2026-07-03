import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorLiveStreamControllerRefs,
  buildMonitorLiveStreamControllerSetters,
  buildMonitorLiveStreamControllerStateHookState,
  createMonitorLiveStreamSimulateLogHandler,
} from "../../../src/features/simple/monitorLiveStreamControllerStateHookRuntime";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";

describe("monitorLiveStreamControllerStateHookRuntime", () => {
  it("builds grouped refs and setters without reshaping values", () => {
    const refs = buildMonitorLiveStreamControllerRefs({
      liveSuggestedBpmRef: { current: 126 },
      liveLinesRef: { current: [] },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
      waveformAnomaliesRef: { current: [] },
      selectedAnomalyIdRef: { current: "anomaly-1" },
      audioProbePlayedRef: { current: false },
      lastCueAccentAtRef: { current: 0 },
      lastStreamEventAtRef: { current: 1000 },
    });
    const setters = buildMonitorLiveStreamControllerSetters({
      setLiveLines: vi.fn(),
      setLogSignalBuffer: vi.fn(),
      setLiveSuggestedBpm: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
    });

    expect(refs.liveSuggestedBpmRef.current).toBe(126);
    expect(refs.selectedAnomalyIdRef.current).toBe("anomaly-1");
    expect(setters.setLiveLines).toBeTypeOf("function");
    expect(setters.setSelectedAnomalyId).toBeTypeOf("function");
  });

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

  it("builds the hook state bundle without reshaping values", () => {
    const refs = buildMonitorLiveStreamControllerRefs({
      liveSuggestedBpmRef: { current: 126 },
      liveLinesRef: { current: [] },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
      waveformAnomaliesRef: { current: [] },
      selectedAnomalyIdRef: { current: null },
      audioProbePlayedRef: { current: false },
      lastCueAccentAtRef: { current: 0 },
      lastStreamEventAtRef: { current: 1000 },
    });
    const setters = buildMonitorLiveStreamControllerSetters({
      setLiveLines: vi.fn(),
      setLogSignalBuffer: vi.fn(),
      setLiveSuggestedBpm: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
    });
    const hookState = buildMonitorLiveStreamControllerStateHookState({
      liveLines: [],
      logSignalBuffer: createMonitorSignalBuffer(),
      liveSuggestedBpm: 126,
      waveformAnomalies: [],
      selectedAnomalyId: null,
      setSelectedAnomalyId: setters.setSelectedAnomalyId,
      refs,
      setters,
      simulateLog: vi.fn(),
    });

    expect(hookState.refs).toBe(refs);
    expect(hookState.setters).toBe(setters);
    expect(hookState.liveSuggestedBpm).toBe(126);
  });
});
