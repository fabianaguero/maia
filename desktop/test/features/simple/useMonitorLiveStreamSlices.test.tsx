import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { useMonitorLiveStreamSlices } from "../../../src/features/simple/useMonitorLiveStreamSlices";
import type { LibraryTrack } from "../../../src/types/library";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: null,
    importedAt: "2026-06-25T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.5],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "wav",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: "/music/base.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1234,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Base Pulse",
      artist: "Maia",
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-25T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.5],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
  };
}

describe("useMonitorLiveStreamSlices", () => {
  it("builds controller state plus live stream state slices", () => {
    const { result } = renderHook(() =>
      useMonitorLiveStreamSlices({
        isListening: true,
        sessionSourcePath: "/logs/visits-service.log",
        streamAdapterLabel: "FILE_TAIL",
        subscribe: vi.fn(() => () => undefined),
        audioContextRef: { current: null },
        backgroundAudioRef: { current: null },
        backgroundGraphRef: { current: null },
        activeTrackRef: { current: createTrack() },
        deckDurationSecondsRef: { current: 240 },
        trackWaveProgressRef: { current: 0.1 },
        deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
        trackBpm: 126,
        ensureBackgroundGraph: vi.fn(),
        applyTrackMutation: vi.fn(),
        playTestTone: vi.fn(),
        playCueBatch: vi.fn(),
        idleHoldMs: 300,
        maxLiveLines: 8,
      }),
    );

    expect(result.current.controllerState.streamAdapterLabel).toBe("FILE_TAIL");
    expect(result.current.controllerState.maxLiveLines).toBe(8);
    expect(result.current.stateController.liveLines).toHaveLength(1);
    expect(result.current.stateController.logSignalBuffer).toHaveLength(120);
    expect(typeof result.current.stateController.simulateLog).toBe("function");
  });
});
