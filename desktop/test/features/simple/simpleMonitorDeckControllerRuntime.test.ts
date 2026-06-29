import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSimpleMonitorDeckControllerBaseState,
  buildSimpleMonitorDeckControllerPresentationInput,
  resolveSimpleMonitorDeckControllerBpm,
} from "../../../src/features/simple/simpleMonitorDeckControllerRuntime";
import type { LibraryTrack } from "../../../src/types/library";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: null,
    importedAt: "2026-06-26T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.4],
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
      sizeBytes: 1024,
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
      importedAt: "2026-06-26T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4],
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

describe("simpleMonitorDeckControllerRuntime", () => {
  it("builds the base controller state without a live bpm override", () => {
    const track = createTrack();
    const state = buildSimpleMonitorDeckControllerBaseState({
      session: null,
      isListening: true,
      isLaunchingMonitor: false,
      tracks: [track],
      trackName: "Base Pulse",
      trackDurationSeconds: 240,
      activePreset: "balanced",
      alertShape: "balanced",
      t: en,
    });

    expect(state.activeTrack?.id).toBe("track-1");
    expect(state.deckDurationSeconds).toBe(240);
    expect(state.deckBpm).toBe(126);
  });

  it("resolves deck bpm from the live suggestion on top of the base active track", () => {
    expect(
      resolveSimpleMonitorDeckControllerBpm({
        liveSuggestedBpm: 132,
        activeTrack: createTrack(),
      }),
    ).toBe(132);
  });

  it("builds the presentation input without reshaping controller values", () => {
    const input = buildSimpleMonitorDeckControllerPresentationInput({
      backgroundAudioRef: { current: null },
      waveformBins: [0.1, 0.2],
      waveformAnomalies: [],
      trackWaveProgress: 0.3,
      setTrackWaveProgress: vi.fn(),
      setTrackElapsedSeconds: vi.fn(),
      deckDurationSeconds: 240,
      deckBpm: 128,
      activeBeatGrid: [],
      logSignalBuffer: [{ val: 20, heat: 0 }],
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: vi.fn(),
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }],
      isConsoleExpanded: true,
      onToggleConsole: vi.fn(),
      deckVisualPreset: "balanced",
      waveformScale: 1.2,
      safeRuntime: false,
    });

    expect(input.deckBpm).toBe(128);
    expect(input.selectedAnomalyId).toBe("anomaly-1");
    expect(input.waveformScale).toBe(1.2);
  });
});
