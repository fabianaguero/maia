import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useUnifiedLibraryState } from "../../../src/features/simple/useUnifiedLibraryState";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../src/types/library";

const mockedUserMode = vi.hoisted(() => ({
  useUserMode: vi.fn(),
}));

vi.mock("../../../src/features/simple/UserModeContext", () => ({
  useUserMode: mockedUserMode.useUserMode,
}));

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Base Pulse",
    sourcePath: "/music/base-pulse.wav",
    storagePath: null,
    importedAt: "2026-06-28T18:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.84,
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
      sourcePath: "/music/base-pulse.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 2048,
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
      importedAt: "2026-06-28T18:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.84,
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

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-28T18:00:00.000Z",
    suggestedBpm: null,
    confidence: 0.5,
    summary: "",
    analyzerStatus: "ready",
    buildSystem: "",
    primaryLanguage: "TypeScript",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

function createBaseAsset(): BaseAssetRecord {
  return {
    id: "asset-1",
    title: "Alert Tick",
    category: "drum",
    sourcePath: "/assets/alert-tick.wav",
    storagePath: null,
    importedAt: "2026-06-28T18:00:00.000Z",
    durationSeconds: 2.4,
    bpm: null,
    keySignature: null,
    sampleRate: 44100,
    channels: 2,
    sizeBytes: 1024,
    analyzerStatus: "ready",
    notes: [],
    tags: [],
  };
}

describe("useUnifiedLibraryState", () => {
  it("builds a simple-mode adapter and delegates all library callbacks", async () => {
    mockedUserMode.useUserMode.mockReturnValue({ userMode: "simple" });

    const onSelectRepository = vi.fn();
    const onImportRepository = vi.fn(async (_input: ImportRepositoryInput) => true);
    const onImportBaseAsset = vi.fn(async (_input: ImportBaseAssetInput) => true);
    const onStartMonitoring = vi.fn();

    const { result } = renderHook(() =>
      useUnifiedLibraryState({
        tracks: [createTrack()],
        repositories: [createRepository()],
        baseAssets: [createBaseAsset()],
        selectedRepositoryId: "repo-1",
        onSelectRepository,
        onImportRepository,
        onImportBaseAsset,
        onStartMonitoring,
      }),
    );

    expect(result.current.showAnalysisTabs).toBe(false);
    expect(result.current.showCompositionTools).toBe(false);
    expect(result.current.showPlaylistManagement).toBe(false);
    expect(result.current.selectedRepositoryId).toBe("repo-1");

    await act(async () => {
      result.current.onSelectRepository("repo-2");
      await result.current.onImportRepository({
        sourcePath: "/repos/new-service",
        sourceKind: "directory",
      });
      await result.current.onImportBaseAsset({
        sourcePath: "/assets/riser.wav",
        category: "fx",
      });
      result.current.onStartMonitoring?.("repo-1", "track-1");
    });

    expect(onSelectRepository).toHaveBeenCalledWith("repo-2");
    expect(onImportRepository).toHaveBeenCalledWith({
      sourcePath: "/repos/new-service",
      sourceKind: "directory",
    });
    expect(onImportBaseAsset).toHaveBeenCalledWith({
      sourcePath: "/assets/riser.wav",
      category: "fx",
    });
    expect(onStartMonitoring).toHaveBeenCalledWith("repo-1", "track-1");
  });

  it("builds an expert-mode adapter and keeps monitoring start as a safe no-op when omitted", () => {
    mockedUserMode.useUserMode.mockReturnValue({ userMode: "expert" });

    const { result } = renderHook(() =>
      useUnifiedLibraryState({
        tracks: [createTrack()],
        repositories: [createRepository()],
        baseAssets: [createBaseAsset()],
        selectedRepositoryId: null,
        onSelectRepository: vi.fn(),
        onImportRepository: vi.fn(async () => false),
        onImportBaseAsset: vi.fn(async () => false),
      }),
    );

    expect(result.current.showAnalysisTabs).toBe(true);
    expect(result.current.showCompositionTools).toBe(true);
    expect(result.current.showPlaylistManagement).toBe(true);
    expect(result.current.onStartMonitoring).toBeTypeOf("function");

    expect(() => result.current.onStartMonitoring?.("repo-1")).not.toThrow();
  });
});
