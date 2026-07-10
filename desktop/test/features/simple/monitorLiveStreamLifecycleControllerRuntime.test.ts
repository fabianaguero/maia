import { describe, expect, it, vi } from "vitest";

import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";
import { applyMonitorLiveStreamLifecycleState } from "../../../src/features/simple/monitorLiveStreamLifecycleControllerRuntime";

describe("monitorLiveStreamLifecycleControllerRuntime", () => {
  it("bootstraps the live tail when listening starts", () => {
    const refs = {
      liveLinesRef: { current: [] as Array<{ id: string; message: string }> },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
      waveformAnomaliesRef: { current: [] as never[] },
      selectedAnomalyIdRef: { current: null as string | null },
      lastStreamEventAtRef: { current: 0 },
      audioProbePlayedRef: { current: false },
    };
    const setters = {
      setLiveLines: vi.fn(),
      setLogSignalBuffer: vi.fn(),
      setLiveSuggestedBpm: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
    };

    applyMonitorLiveStreamLifecycleState({
      isListening: true,
      sessionSourcePath: "/logs/app.log",
      streamAdapterLabel: "FILE_TAIL",
      refs: refs as never,
      setters,
      nowMs: 1234,
      nowDate: new Date("2026-07-02T20:00:00Z"),
    });

    expect(refs.lastStreamEventAtRef.current).toBe(1234);
    expect(refs.liveLinesRef.current[0]?.message).toContain("MAIA_MONITOR_INITIALIZED");
    expect(setters.setLiveLines).toHaveBeenCalledWith(refs.liveLinesRef.current);
  });

  it("resets live stream state when listening stops", () => {
    const refs = {
      liveLinesRef: { current: [{ id: "line-1" }] as never[] },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
      waveformAnomaliesRef: { current: [{ id: "anomaly-1" }] as never[] },
      selectedAnomalyIdRef: { current: "anomaly-1" as string | null },
      lastStreamEventAtRef: { current: 10 },
      audioProbePlayedRef: { current: true },
    };
    const setters = {
      setLiveLines: vi.fn(),
      setLogSignalBuffer: vi.fn(),
      setLiveSuggestedBpm: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
    };

    applyMonitorLiveStreamLifecycleState({
      isListening: false,
      sessionSourcePath: "/logs/app.log",
      streamAdapterLabel: "FILE_TAIL",
      refs: refs as never,
      setters,
      nowMs: 4567,
    });

    expect(refs.liveLinesRef.current).toEqual([]);
    expect(refs.selectedAnomalyIdRef.current).toBeNull();
    expect(refs.audioProbePlayedRef.current).toBe(false);
    expect(refs.lastStreamEventAtRef.current).toBe(4567);
    expect(setters.setLiveSuggestedBpm).toHaveBeenCalledWith(null);
    expect(setters.setLogSignalBuffer).toHaveBeenCalledTimes(1);
  });

  it("does not replace replay lines with bootstrap while already listening", () => {
    const existingLine = {
      id: "line-1",
      timestamp: "20:00:00",
      level: "info",
      message: "real replay log line",
      isAnomaly: false,
      anomalyId: null,
    };
    const refs = {
      liveLinesRef: { current: [existingLine] },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
      waveformAnomaliesRef: { current: [] as never[] },
      selectedAnomalyIdRef: { current: null as string | null },
      lastStreamEventAtRef: { current: 0 },
      audioProbePlayedRef: { current: false },
    };
    const setters = {
      setLiveLines: vi.fn(),
      setLogSignalBuffer: vi.fn(),
      setLiveSuggestedBpm: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
    };

    applyMonitorLiveStreamLifecycleState({
      isListening: true,
      sessionSourcePath: "/logs/app.log",
      streamAdapterLabel: "FILE_TAIL",
      refs: refs as never,
      setters,
      nowMs: 7890,
    });

    expect(refs.liveLinesRef.current).toEqual([existingLine]);
    expect(setters.setLiveLines).not.toHaveBeenCalled();
  });
});
