import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildComposeScreenViewModel,
  buildComposeTabOptions,
  resolveComposeCanCreate,
} from "../../../src/features/compose/composeScreenRuntime";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
} from "../../../src/types/library";

const baseAsset = {
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
} satisfies BaseAssetRecord;

const track = {
  id: "track-1",
  title: "Night run",
  sourcePath: "/music/night-run.wav",
  storagePath: "/storage/night-run.json",
  importedAt: "2026-06-20T10:00:00.000Z",
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 240,
  waveformBins: [0.2, 0.4],
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
    waveformBins: [0.2, 0.4],
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
} satisfies LibraryTrack;

const playlist = {
  id: "playlist-1",
  name: "Warmup",
  trackIds: ["track-1"],
  createdAt: "2026-06-20T10:00:00.000Z",
  updatedAt: "2026-06-20T10:00:00.000Z",
} satisfies BaseTrackPlaylist;

const composition = {
  id: "composition-1",
  title: "Night composition",
  sourcePath: "/compositions/night.json",
  exportPath: "/exports/night.wav",
  previewAudioPath: "/exports/night-preview.wav",
  sourceKind: "file",
  importedAt: "2026-06-20T10:00:00.000Z",
  baseAssetId: "base-1",
  baseAssetTitle: "Base groove",
  baseAssetCategoryId: "drums",
  baseAssetCategoryLabel: "Drums",
  basePlaylistId: "playlist-1",
  basePlaylistName: "Warmup",
  referenceType: "track",
  referenceAssetId: "track-1",
  referenceTitle: "Night run",
  referenceSourcePath: "/music/night-run.wav",
  targetBpm: 126,
  confidence: 0.88,
  strategy: "balanced",
  summary: "Composed preview",
  analyzerStatus: "ready",
  notes: ["layered texture"],
  tags: ["draft"],
  metrics: { previewDurationSeconds: 96 },
  waveformBins: [0.2, 0.4],
  beatGrid: [{ index: 0, second: 0 }],
  bpmCurve: [{ second: 0, bpm: 126 }],
} satisfies CompositionResultRecord;

describe("composeScreenRuntime", () => {
  it("resolves whether composition can start", () => {
    expect(
      resolveComposeCanCreate({
        baseAssets: [],
        tracks: [],
        playlists: [],
      }),
    ).toBe(false);
    expect(
      resolveComposeCanCreate({
        baseAssets: [baseAsset],
        tracks: [track],
        playlists: [],
      }),
    ).toBe(true);
  });

  it("builds tab options and the compose screen view model", () => {
    expect(buildComposeTabOptions({ t: en, tab: "render" })).toMatchObject([
      { id: "preview", isActive: false },
      { id: "structure", isActive: false },
      { id: "render", isActive: true },
      { id: "export", isActive: false },
    ]);

    expect(
      buildComposeScreenViewModel({
        t: en,
        tab: "preview",
        composition,
        compositions: [composition],
        baseAssets: [baseAsset],
        tracks: [track],
        playlists: [playlist],
      }),
    ).toMatchObject({
      title: "Night composition",
      canCompose: true,
      showSummary: true,
      compositionsCount: 1,
      targetBpmLabel: "126",
      timingSourceLabel: "Night run",
    });
  });
});
