import { describe, expect, it, vi } from "vitest";

import { applyMonitorLiveStreamSubscriptionResult } from "../../../src/features/simple/monitorLiveStreamSubscriptionApplyRuntime";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";

describe("monitorLiveStreamSubscriptionApplyRuntime", () => {
  it("writes bpm, refs and setters when the update carries real visual state", () => {
    const refs = {
      lastStreamEventAtRef: { current: 0 },
      audioProbePlayedRef: { current: false },
      lastCueAccentAtRef: { current: 0 },
      liveLinesRef: { current: [] as never[] },
      waveformAnomaliesRef: { current: [] as never[] },
      selectedAnomalyIdRef: { current: null as string | null },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
    };
    const setters = {
      setLiveSuggestedBpm: vi.fn(),
      setLiveLines: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
      setLogSignalBuffer: vi.fn(),
    };

    applyMonitorLiveStreamSubscriptionResult({
      result: {
        nextLiveSuggestedBpm: 126,
        nextAudioProbePlayed: true,
        nextLastCueAccentAtMs: 2000,
        shouldTrackStreamEventAt: true,
        nextLiveLines: [
          {
            id: "line-1",
            timestamp: "10:00:00",
            level: "error",
            message: "boom",
            isAnomaly: true,
            anomalyId: "anomaly-1",
          },
        ],
        nextWaveformAnomalies: [
          {
            id: "anomaly-1",
            lineId: "line-1",
            timestamp: "10:00:00",
            message: "boom",
            severity: 1,
            progress: 0.4,
          },
        ],
        nextSelectedAnomalyId: "anomaly-1",
        nextLogSignalBuffer: createMonitorSignalBuffer(),
      },
      nowMs: 3000,
      refs,
      setters,
    });

    expect(refs.lastStreamEventAtRef.current).toBe(3000);
    expect(refs.audioProbePlayedRef.current).toBe(true);
    expect(refs.lastCueAccentAtRef.current).toBe(2000);
    expect(refs.selectedAnomalyIdRef.current).toBe("anomaly-1");
    expect(setters.setLiveSuggestedBpm).toHaveBeenCalledWith(126);
    expect(setters.setLiveLines).toHaveBeenCalledTimes(1);
    expect(setters.setLogSignalBuffer).toHaveBeenCalledTimes(1);
  });

  it("only updates lightweight state when there are no real lines to publish", () => {
    const refs = {
      lastStreamEventAtRef: { current: 0 },
      audioProbePlayedRef: { current: false },
      lastCueAccentAtRef: { current: 0 },
      liveLinesRef: { current: [] as never[] },
      waveformAnomaliesRef: { current: [] as never[] },
      selectedAnomalyIdRef: { current: null as string | null },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
    };
    const setters = {
      setLiveSuggestedBpm: vi.fn(),
      setLiveLines: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
      setLogSignalBuffer: vi.fn(),
    };

    applyMonitorLiveStreamSubscriptionResult({
      result: {
        nextLiveSuggestedBpm: null,
        nextAudioProbePlayed: false,
        nextLastCueAccentAtMs: 1000,
        shouldTrackStreamEventAt: false,
        nextLiveLines: null,
        nextWaveformAnomalies: null,
        nextSelectedAnomalyId: "keep",
        nextLogSignalBuffer: null,
      },
      nowMs: 3000,
      refs,
      setters,
    });

    expect(refs.lastStreamEventAtRef.current).toBe(0);
    expect(refs.selectedAnomalyIdRef.current).toBeNull();
    expect(setters.setLiveSuggestedBpm).toHaveBeenCalledWith(null);
    expect(setters.setLiveLines).not.toHaveBeenCalled();
    expect(setters.setLogSignalBuffer).not.toHaveBeenCalled();
  });
});
