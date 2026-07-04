import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";
import {
  buildMonitorLiveStreamSubscriptionApplyResultInput,
  buildMonitorLiveStreamSubscriptionUpdateInput,
} from "../../../src/features/simple/monitorLiveStreamSubscriptionRefRuntime";

function createSubscriptionInput() {
  return {
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
}

describe("monitorLiveStreamSubscriptionRefRuntime", () => {
  it("builds update input from subscription refs", () => {
    const subscription = createSubscriptionInput();
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

    const input = buildMonitorLiveStreamSubscriptionUpdateInput({
      subscription,
      update,
      nowMs: 4_000,
    });

    expect(input).toEqual(
      expect.objectContaining({
        update,
        currentTrack: subscription.activeTrackRef.current,
        activeAudio: subscription.backgroundAudioRef.current,
        currentAudioContext: subscription.audioContextRef.current,
        nowMs: 4_000,
        hasBackgroundTrack: true,
      }),
    );
  });

  it("builds apply-result input from subscription refs and setters", () => {
    const subscription = createSubscriptionInput();
    const result = {
      nextLiveSuggestedBpm: 126,
      nextAudioProbePlayed: true,
      nextLastCueAccentAtMs: 3000,
      shouldTrackStreamEventAt: true,
      nextLiveLines: [],
      nextWaveformAnomalies: [],
      nextSelectedAnomalyId: null,
      nextLogSignalBuffer: createMonitorSignalBuffer(),
    };

    const input = buildMonitorLiveStreamSubscriptionApplyResultInput({
      subscription,
      result,
      nowMs: 4_000,
    });

    expect(input).toEqual(
      expect.objectContaining({
        result,
        nowMs: 4_000,
        refs: expect.objectContaining({
          lastStreamEventAtRef: subscription.lastStreamEventAtRef,
          audioProbePlayedRef: subscription.audioProbePlayedRef,
        }),
        setters: expect.objectContaining({
          setLiveSuggestedBpm: subscription.setLiveSuggestedBpm,
          setLogSignalBuffer: subscription.setLogSignalBuffer,
        }),
      }),
    );
  });
});
