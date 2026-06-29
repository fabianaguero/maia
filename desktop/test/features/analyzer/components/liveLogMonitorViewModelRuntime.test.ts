import { describe, expect, it } from "vitest";

import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../../../src/types/library";
import type { LiveMutationExplanation } from "../../../../src/utils/liveMutationExplainability";
import {
  buildLiveLogMonitorAdapterState,
  buildLiveLogMonitorExplanationState,
  buildLiveLogMonitorTrackSelectionState,
  resolveCueEnginePreviewLabel,
  resolveLiveMutationStateLabel,
} from "../../../../src/features/analyzer/components/liveLogMonitorViewModelRuntime";

function createTrack(id: string, overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-26T00:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [],
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
    energyLevel: 0.8,
    danceability: 0.7,
    structuralPatterns: [],
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: "2026-06-26T00:00:00.000Z",
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: id,
      artist: null,
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-26T00:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: "2026-06-26T00:00:00.000Z",
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: 0.8,
      danceability: 0.7,
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
    ...overrides,
  };
}

function createExplanation(
  id: string,
  overrides: Partial<LiveMutationExplanation> = {},
): LiveMutationExplanation {
  return {
    id,
    eventIndex: 1,
    summary: "alert",
    trigger: "anomaly",
    effectLabel: "duck",
    cueLabel: "warn",
    trackId: "track-a",
    trackTitle: "track-a",
    trackSecond: 12,
    replayWindowIndex: 3,
    details: [],
    ...overrides,
  };
}

describe("liveLogMonitorViewModelRuntime", () => {
  it("builds track selection state from playlist and background deck pointers", () => {
    const tracks = [
      createTrack("track-a"),
      createTrack("track-b", {
        file: {
          sourcePath: "/missing/track-b.wav",
          storagePath: null,
          sourceKind: "file",
          fileExtension: "wav",
          sizeBytes: 1024,
          modifiedAt: "2026-06-26T00:00:00.000Z",
          checksum: null,
          availabilityState: "missing",
          playbackSource: "unavailable",
        },
      }),
      createTrack("track-c"),
    ];
    const playlist: BaseTrackPlaylist = {
      id: "playlist-1",
      name: "Night watch",
      trackIds: ["track-a", "track-c"],
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    };

    const state = buildLiveLogMonitorTrackSelectionState({
      basePlaylist: playlist,
      availableTracks: tracks,
      backgroundNowPlayingId: "track-a",
      backgroundTransitionPlan: {
        nextTrackId: "track-c",
        crossfadeSeconds: 6,
        phraseSpanBeats: 32,
        tempoRatio: 1,
        entrySecond: 8,
      },
    });

    expect(state.playableBaseTracks.map((track) => track.id)).toEqual(["track-a", "track-c"]);
    expect(state.availableBaseTrackOptions.map((track) => track.id)).toEqual(["track-b"]);
    expect(state.backgroundNowPlayingTrack?.id).toBe("track-a");
    expect(state.backgroundTransitionNextTrack?.id).toBe("track-c");
    expect(state.traceWaveformTrack?.id).toBe("track-a");
    expect(state.hasBaseListeningBed).toBe(true);
  });

  it("builds explanation state from waveform track and replay window", () => {
    const state = buildLiveLogMonitorExplanationState({
      recentExplanations: [
        createExplanation("exp-a"),
        createExplanation("exp-b", {
          trackId: "track-c",
          trackTitle: "track-c",
          replayWindowIndex: 4,
        }),
      ],
      selectedExplanationId: "exp-a",
      traceWaveformTrack: createTrack("track-a"),
      replayActive: true,
      playbackEventIndex: 3,
    });

    expect(state.traceWaveformExplanations).toHaveLength(1);
    expect(state.selectedTraceExplanation?.id).toBe("exp-a");
    expect(state.currentReplayExplanation?.id).toBe("exp-a");
    expect(state.traceWaveformCues.length).toBeGreaterThan(0);
  });

  it("builds adapter labels and cue labels consistently", () => {
    const repository: RepositoryAnalysis = {
      id: "repo-1",
      title: "visits-service",
      sourcePath: "/logs/visits-service.log",
      storagePath: null,
      sourceKind: "file",
      importedAt: "2026-06-26T00:00:00.000Z",
      suggestedBpm: 126,
      confidence: 0.8,
      summary: "service tail",
      analyzerStatus: "ready",
      buildSystem: "unknown",
      primaryLanguage: "log",
      javaFileCount: 0,
      testFileCount: 0,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      notes: [],
      tags: [],
      metrics: {},
    };

    const adapterState = buildLiveLogMonitorAdapterState({
      repository,
      repositoryId: "repo-1",
      adapterKind: "file",
      sessionRepoId: "repo-1",
      sessionAdapterKind: "websocket",
    });

    expect(adapterState.activeAdapterKind).toBe("websocket");
    expect(adapterState.activeAdapterLabel).toBe("WebSocket");
    expect(resolveLiveMutationStateLabel("warning")).toBe("Warning pressure");
    expect(
      resolveCueEnginePreviewLabel({
        hasBaseListeningBed: true,
        sampleStatus: "ready",
        liveMutationStateLabel: "Warning pressure",
        sampleSourceCount: 2,
      }),
    ).toContain("Guide-track modulation + samples");
  });
});
