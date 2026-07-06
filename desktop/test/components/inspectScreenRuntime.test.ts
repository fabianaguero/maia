import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import type { BaseAssetRecord, LibraryTrack, RepositoryAnalysis } from "../../src/types/library";
import {
  buildInspectScreenContextBarProps,
  buildInspectScreenRenderState,
} from "../../src/features/inspect/inspectScreenRuntime";

const track: LibraryTrack = {
  id: "track-1",
  title: "Night run",
  sourcePath: "/music/night-run.wav",
  storagePath: "/storage/night-run.json",
  importedAt: "2026-06-20T10:00:00.000Z",
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 240,
  waveformBins: [0.2],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
  analyzerStatus: "ready",
  repoSuggestedBpm: 126,
  repoSuggestedStatus: "aligned",
  notes: [],
  fileExtension: "wav",
  analysisMode: "full",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: "Am",
  energyLevel: 0.8,
  danceability: 0.7,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/night-run.wav",
    storagePath: "/storage/night-run.json",
    sourceKind: "file",
    fileExtension: "wav",
    sizeBytes: 1000,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available",
    playbackSource: "source_file",
  },
  tags: {
    title: "Night run",
    artist: "Maia",
    album: null,
    genre: "House",
    year: 2026,
    comment: null,
    artworkPath: null,
    musicStyleId: "house",
    musicStyleLabel: "House",
  },
  analysis: {
    importedAt: "2026-06-20T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds: 240,
    waveformBins: [0.2],
    beatGrid: [{ index: 0, second: 0 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    analyzerStatus: "ready",
    analysisMode: "full",
    analyzerVersion: "1.0.0",
    analyzedAt: "2026-06-20T10:00:00.000Z",
    repoSuggestedBpm: 126,
    repoSuggestedStatus: "aligned",
    notes: [],
    keySignature: "Am",
    energyLevel: 0.8,
    danceability: 0.7,
    structuralPatterns: [],
  },
  performance: {
    color: null,
    rating: 4,
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

const repository: RepositoryAnalysis = {
  id: "repo-1",
  title: "orders.log",
  sourcePath: "/logs/orders.log",
  storagePath: "/storage/orders.json",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  suggestedBpm: 126,
  confidence: 0.75,
  summary: "Passive log stream",
  analyzerStatus: "ready",
  buildSystem: "spring",
  primaryLanguage: "java",
  javaFileCount: 10,
  testFileCount: 4,
  waveformBins: [0.2],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
  notes: [],
  tags: ["logs"],
  metrics: {},
};

const baseAsset: BaseAssetRecord = {
  id: "base-1",
  title: "Base groove",
  sourcePath: "/assets/base.wav",
  storagePath: "/storage/base.json",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  categoryId: "drums",
  categoryLabel: "Drums",
  reusable: true,
  entryCount: 12,
  checksum: null,
  confidence: 0.91,
  summary: "Groove pack",
  analyzerStatus: "ready",
  notes: [],
  tags: ["base"],
  metrics: {},
};

describe("inspectScreenRuntime", () => {
  it("builds context-bar props from inspect inventory and selection state", () => {
    const props = buildInspectScreenContextBarProps({
      mode: "track",
      track,
      repository,
      baseAsset,
      availableTracks: [track],
      availableRepositories: [repository],
      availableBaseAssets: [baseAsset],
      t: en,
    });

    expect(props).toEqual(
      expect.objectContaining({
        mode: "track",
        trackCount: 1,
        repositoryCount: 1,
        baseAssetCount: 1,
        selectedTrackId: "track-1",
        selectedRepositoryId: "repo-1",
        selectedBaseAssetId: "base-1",
      }),
    );
    expect(props.trackOptions).toEqual([{ id: "track-1", label: "Night run" }]);
  });

  it("resolves inspect screen render state for empty, placeholders, and active views", () => {
    expect(
      buildInspectScreenRenderState({
        mode: "track",
        track: null,
        repository: null,
        baseAsset: null,
        availableTracks: [],
        availableRepositories: [],
        availableBaseAssets: [],
      }),
    ).toEqual({
      hasAnyAsset: false,
      kind: "empty",
    });

    expect(
      buildInspectScreenRenderState({
        mode: "track",
        track: null,
        repository: null,
        baseAsset: null,
        availableTracks: [track],
        availableRepositories: [],
        availableBaseAssets: [],
      }).kind,
    ).toBe("track-placeholder");

    expect(
      buildInspectScreenRenderState({
        mode: "repo",
        track: null,
        repository,
        baseAsset: null,
        availableTracks: [track],
        availableRepositories: [repository],
        availableBaseAssets: [],
      }).kind,
    ).toBe("repo");

    expect(
      buildInspectScreenRenderState({
        mode: "base",
        track: null,
        repository: null,
        baseAsset,
        availableTracks: [track],
        availableRepositories: [repository],
        availableBaseAssets: [baseAsset],
      }).kind,
    ).toBe("base");
  });
});
