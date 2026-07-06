import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";
import { buildMonitorLiveStreamSubscriptionListener } from "../../../src/features/simple/monitorLiveStreamSubscriptionControllerRuntime";

describe("monitorLiveStreamSubscriptionControllerRuntime", () => {
  it("builds a subscription listener that derives runtime input from refs and applies the result", () => {
    const applyUpdate = vi.fn(() => ({
      nextLiveSuggestedBpm: 126,
      nextAudioProbePlayed: true,
      nextLastCueAccentAtMs: 3000,
      shouldTrackStreamEventAt: true,
      nextLiveLines: [],
      nextWaveformAnomalies: [],
      nextSelectedAnomalyId: null,
      nextLogSignalBuffer: createMonitorSignalBuffer(),
    }));
    const applyResult = vi.fn();
    const now = vi.fn(() => 4_000);
    const input = {
      isListening: true,
      subscribe: vi.fn(),
      audioContextRef: { current: { state: "running" } as AudioContext },
      backgroundAudioRef: { current: { duration: 240, currentTime: 10 } as HTMLAudioElement },
      backgroundGraphRef: { current: {} },
      activeTrackRef: { current: { id: "track-1" } as never },
      deckDurationSecondsRef: { current: 240 },
      trackWaveProgressRef: { current: 0.25 },
      deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
      maxLiveLines: 8,
      liveSuggestedBpmRef: { current: 124 },
      liveLinesRef: { current: [] },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
      waveformAnomaliesRef: { current: [] },
      selectedAnomalyIdRef: { current: "selected-1" },
      audioProbePlayedRef: { current: false },
      lastCueAccentAtRef: { current: 1_000 },
      lastStreamEventAtRef: { current: 0 },
      ensureBackgroundGraph: vi.fn(),
      applyTrackMutation: vi.fn(),
      playTestTone: vi.fn(),
      playCueBatch: vi.fn(),
      setLiveSuggestedBpm: vi.fn(),
      setLiveLines: vi.fn(),
      setWaveformAnomalies: vi.fn(),
      setSelectedAnomalyId: vi.fn(),
      setLogSignalBuffer: vi.fn(),
    };

    const listener = buildMonitorLiveStreamSubscriptionListener({
      input,
      now,
      applyUpdate,
      applyResult,
    });

    const update = {
      sourcePath: "/tmp/live.log",
      fromOffset: 0,
      toOffset: 128,
      hasData: true,
      summary: "tail active",
      suggestedBpm: 126,
      confidence: 0.82,
      dominantLevel: "warn",
      lineCount: 2,
      anomalyCount: 1,
      levelCounts: { info: 1, warn: 1 },
      anomalyMarkers: [],
      topComponents: [],
      sonificationCues: [],
      parsedLines: [],
      warnings: [],
    };

    listener(update);

    expect(now).toHaveBeenCalledTimes(1);
    expect(applyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update,
        currentTrack: input.activeTrackRef.current,
        activeAudio: input.backgroundAudioRef.current,
        currentAudioContext: input.audioContextRef.current,
        nowMs: 4_000,
        hasBackgroundTrack: true,
      }),
    );
    expect(applyResult).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({ nextLiveSuggestedBpm: 126 }),
        nowMs: 4_000,
      }),
    );
  });
});
