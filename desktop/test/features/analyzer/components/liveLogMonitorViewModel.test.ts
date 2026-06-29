import { describe, expect, it } from "vitest";

import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../../src/types/library";
import type { LiveMutationExplanation } from "../../../../src/utils/liveMutationExplainability";
import {
  audioLabel,
  buildLiveLogMonitorViewModel,
  preferredBaseAssetId,
  preferredCompositionId,
  toMessage,
} from "../../../../src/features/analyzer/components/liveLogMonitorViewModel";

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

function createBasePlaylist(trackIds: string[]): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Night watch",
    trackIds,
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
  };
}

function createRepository(overrides: Partial<RepositoryAnalysis> = {}): RepositoryAnalysis {
  return {
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

describe("liveLogMonitorViewModel", () => {
  it("resolves preferred ids and audio labels", () => {
    const baseAssets = [
      {
        id: "base-a",
        title: "Base A",
        sourcePath: "/base/a",
        storagePath: "/managed/base-a",
        sourceKind: "directory",
        importedAt: "2026-06-26T00:00:00.000Z",
        categoryId: "drums",
        categoryLabel: "Drums",
        reusable: false,
        entryCount: 1,
        checksum: null,
        confidence: 0.8,
        summary: "base",
        analyzerStatus: "ready",
        notes: [],
        tags: [],
        metrics: {},
      },
      {
        id: "base-b",
        title: "Base B",
        sourcePath: "/base/b",
        storagePath: "/managed/base-b",
        sourceKind: "directory",
        importedAt: "2026-06-26T00:00:00.000Z",
        categoryId: "drums",
        categoryLabel: "Drums",
        reusable: true,
        entryCount: 1,
        checksum: null,
        confidence: 0.8,
        summary: "base",
        analyzerStatus: "ready",
        notes: [],
        tags: [],
        metrics: {},
      },
    ] as BaseAssetRecord[];
    const compositions = [
      {
        id: "comp-a",
        title: "Comp A",
        sourcePath: "/compositions/comp-a",
        exportPath: null,
        previewAudioPath: null,
        sourceKind: "file",
        importedAt: "2026-06-26T00:00:00.000Z",
        baseAssetId: "base-a",
        baseAssetTitle: "Base A",
        baseAssetCategoryId: "drums",
        baseAssetCategoryLabel: "Drums",
        referenceType: "manual",
        referenceAssetId: null,
        referenceTitle: "manual",
        referenceSourcePath: null,
        targetBpm: 126,
        confidence: 0.8,
        strategy: "balanced",
        summary: "composition",
        analyzerStatus: "ready",
        notes: [],
        tags: [],
        metrics: {},
        waveformBins: [],
        beatGrid: [],
        bpmCurve: [],
      },
      {
        id: "comp-b",
        title: "Comp B",
        sourcePath: "/compositions/comp-b",
        exportPath: null,
        previewAudioPath: null,
        sourceKind: "file",
        importedAt: "2026-06-26T00:00:00.000Z",
        baseAssetId: "base-a",
        baseAssetTitle: "Base A",
        baseAssetCategoryId: "drums",
        baseAssetCategoryLabel: "Drums",
        referenceType: "manual",
        referenceAssetId: null,
        referenceTitle: "manual",
        referenceSourcePath: null,
        targetBpm: 126,
        confidence: 0.8,
        strategy: "balanced",
        summary: "composition",
        analyzerStatus: "ready",
        notes: [],
        tags: [],
        metrics: {},
        waveformBins: [],
        beatGrid: [],
        bpmCurve: [],
      },
    ] as CompositionResultRecord[];

    expect(preferredBaseAssetId(baseAssets, null)).toBe("base-b");
    expect(preferredCompositionId(compositions, "comp-b")).toBe("comp-b");
    expect(
      audioLabel("ready", true, {
        unavailable: "unavailable",
        error: "error",
        active: "active",
        armed: "armed",
        idle: "idle",
      }),
    ).toBe("active");
    expect(toMessage(new Error("boom"))).toBe("boom");
  });

  it("builds monitor visual derivations from playlist and replay state", () => {
    const availableTracks = [
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

    const viewModel = buildLiveLogMonitorViewModel({
      repository: createRepository(),
      repositoryId: "repo-1",
      adapterKind: "file",
      sessionRepoId: "repo-1",
      sessionAdapterKind: "websocket",
      availableBaseAssets: [
        {
          id: "base-a",
          title: "Base A",
          sourcePath: "/base/a",
          storagePath: "/managed/base-a",
          sourceKind: "directory",
          importedAt: "2026-06-26T00:00:00.000Z",
          categoryId: "drums",
          categoryLabel: "Drums",
          reusable: true,
          entryCount: 1,
          checksum: null,
          confidence: 0.8,
          summary: "base",
          analyzerStatus: "ready",
          notes: [],
          tags: [],
          metrics: {},
        },
      ] as BaseAssetRecord[],
      availableCompositions: [
        {
          id: "comp-a",
          title: "Comp A",
          sourcePath: "/compositions/comp-a",
          exportPath: null,
          previewAudioPath: null,
          sourceKind: "file",
          importedAt: "2026-06-26T00:00:00.000Z",
          baseAssetId: "base-a",
          baseAssetTitle: "Base A",
          baseAssetCategoryId: "drums",
          baseAssetCategoryLabel: "Drums",
          referenceType: "manual",
          referenceAssetId: null,
          referenceTitle: "manual",
          referenceSourcePath: null,
          targetBpm: 126,
          confidence: 0.8,
          strategy: "balanced",
          summary: "composition",
          analyzerStatus: "ready",
          notes: [],
          tags: [],
          metrics: {},
          waveformBins: [],
          beatGrid: [],
          bpmCurve: [],
        },
      ] as CompositionResultRecord[],
      availableTracks,
      basePlaylist: createBasePlaylist(["track-a", "track-c"]),
      sceneBaseAssetId: "base-a",
      sceneCompositionId: "comp-a",
      selectedStyleProfileId: "steady-house",
      selectedMutationProfileId: "balanced",
      recentExplanations: [
        createExplanation("exp-a"),
        createExplanation("exp-b", {
          trackId: "track-c",
          trackTitle: "track-c",
          replayWindowIndex: 4,
        }),
      ],
      selectedExplanationId: "exp-a",
      backgroundNowPlayingId: "track-a",
      backgroundTransitionPlan: {
        nextTrackId: "track-c",
        crossfadeSeconds: 6,
        phraseSpanBeats: 32,
        tempoRatio: 1,
        entrySecond: 8,
      },
      replayActive: true,
      playbackEventIndex: 3,
      forcedLiveMutationState: "auto",
      liveMutationState: "warning",
      sampleStatus: "ready",
    });

    expect(viewModel.playableBaseTracks.map((track) => track.id)).toEqual(["track-a", "track-c"]);
    expect(viewModel.availableBaseTrackOptions.map((track) => track.id)).toEqual(["track-b"]);
    expect(viewModel.activeAdapterKind).toBe("websocket");
    expect(viewModel.activeAdapterLabel).toBe("WebSocket");
    expect(viewModel.backgroundTransitionNextTrack?.id).toBe("track-c");
    expect(viewModel.traceWaveformTrack?.id).toBe("track-a");
    expect(viewModel.selectedTraceExplanation?.id).toBe("exp-a");
    expect(viewModel.currentReplayExplanation?.id).toBe("exp-a");
    expect(viewModel.hasBaseListeningBed).toBe(true);
    expect(viewModel.liveMutationStateLabel).toBe("Warning pressure");
    expect(viewModel.cueEnginePreviewLabel).toContain("Guide-track modulation + samples");
  });
});
