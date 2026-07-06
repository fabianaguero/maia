import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";
import { applyMonitorLiveStreamSubscriptionUpdate } from "../../../src/features/simple/monitorLiveStreamSubscriptionRuntime";

describe("monitorLiveStreamSubscriptionRuntime", () => {
  it("applies meaningful updates and triggers audio hooks when the context is running", () => {
    const ensureBackgroundGraph = vi.fn();
    const applyTrackMutation = vi.fn();
    const playTestTone = vi.fn();
    const playCueBatch = vi.fn();

    const result = applyMonitorLiveStreamSubscriptionUpdate({
      update: {
        sourcePath: "/tmp/live.log",
        fromOffset: 0,
        toOffset: 10,
        hasData: true,
        lineCount: 1,
        anomalyCount: 1,
        suggestedBpm: 126,
        summary: "1 line",
        confidence: 0.8,
        dominantLevel: "error",
        levelCounts: { error: 1 },
        anomalyMarkers: [
          {
            eventIndex: 1,
            level: "error",
            component: "api",
            excerpt: "boom",
          },
        ],
        topComponents: [],
        sonificationCues: [
          {
            id: "cue-1",
            eventIndex: 1,
            level: "error",
            component: "api",
            excerpt: "boom",
            noteHz: 220,
            gain: 0.2,
            durationMs: 120,
            waveform: "triangle",
            accent: "anomaly",
          },
        ],
        parsedLines: ["ERROR 2026-06-24T21:11:38.209845Z boom"],
        warnings: [],
      },
      currentTrack: {
        analysis: { bpm: 126, beatGrid: [] },
        beatGrid: [],
      } as never,
      activeAudio: { duration: 240, currentTime: 30 } as HTMLAudioElement,
      currentAudioContext: { state: "running" } as AudioContext,
      fallbackDurationSeconds: 240,
      fallbackProgress: 0.1,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      maxLiveLines: 8,
      liveSuggestedBpm: 126,
      selectedAnomalyId: null,
      previousLiveLines: [],
      previousWaveformAnomalies: [],
      previousLogSignalBuffer: createMonitorSignalBuffer(),
      hasBackgroundTrack: true,
      audioProbePlayed: false,
      lastCueAccentAtMs: 0,
      nowMs: 2000,
      ensureBackgroundGraph,
      applyTrackMutation,
      playTestTone,
      playCueBatch,
    });

    expect(result.shouldTrackStreamEventAt).toBe(true);
    expect(result.nextAudioProbePlayed).toBe(true);
    expect(result.nextLiveLines).toHaveLength(1);
    expect(result.nextWaveformAnomalies).toHaveLength(1);
    expect(ensureBackgroundGraph).toHaveBeenCalledOnce();
    expect(applyTrackMutation).toHaveBeenCalledOnce();
    expect(playTestTone).toHaveBeenCalledOnce();
    expect(result.nextLastCueAccentAtMs).toBeGreaterThanOrEqual(0);
  });

  it("keeps visual state stable when the update has no real lines", () => {
    const result = applyMonitorLiveStreamSubscriptionUpdate({
      update: {
        sourcePath: "/tmp/live.log",
        fromOffset: 0,
        toOffset: 0,
        hasData: false,
        lineCount: 0,
        anomalyCount: 0,
        suggestedBpm: null,
        summary: "idle",
        confidence: 0,
        dominantLevel: "info",
        levelCounts: {},
        anomalyMarkers: [],
        topComponents: [],
        sonificationCues: [],
        parsedLines: [],
        warnings: [],
      },
      currentTrack: null,
      activeAudio: null,
      currentAudioContext: null,
      fallbackDurationSeconds: null,
      fallbackProgress: 0.2,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      maxLiveLines: 8,
      liveSuggestedBpm: null,
      selectedAnomalyId: "existing",
      previousLiveLines: [],
      previousWaveformAnomalies: [],
      previousLogSignalBuffer: createMonitorSignalBuffer(),
      hasBackgroundTrack: false,
      audioProbePlayed: true,
      lastCueAccentAtMs: 1000,
      nowMs: 2000,
      ensureBackgroundGraph: vi.fn(),
      applyTrackMutation: vi.fn(),
      playTestTone: vi.fn(),
      playCueBatch: vi.fn(),
    });

    expect(result.shouldTrackStreamEventAt).toBe(false);
    expect(result.nextLiveLines).toBeNull();
    expect(result.nextWaveformAnomalies).toBeNull();
    expect(result.nextLogSignalBuffer).toBeNull();
    expect(result.nextSelectedAnomalyId).toBe("existing");
  });
});
