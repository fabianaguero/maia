import { describe, expect, it } from "vitest";

import type { MusicalAsset } from "../../src/contracts";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RelinkMissingTracksResult,
} from "../../src/types/library";
import {
  appendImportedTrack,
  appendSavedPlaylist,
  applyAnalyzedTrackMetadata,
  clearDeletedPlaylistSelection,
  clearDeletedTrackSelection,
  removeDeletedPlaylist,
  removeDeletedTrack,
  removeTrackFromPlaylists,
  replaceRelinkedTracks,
  replaceTrack,
  resolvePreferredRelinkSelection,
  resolveReanalyzeTrackInput,
  resolveSelectedPlaylistId,
  resolveSelectedTrackId,
  shouldAnalyzeImportedTrack,
  sortPlaylistsByUpdatedAt,
  sortTracksByImportedAt,
  toLibraryErrorMessage,
} from "../../src/hooks/libraryRuntime";

function createTrack(id: string, importedAt: string, analyzerStatus = "ready"): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt,
    bpm: 120,
    bpmConfidence: 0.5,
    durationSeconds: 180,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus,
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
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: importedAt,
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
      importedAt,
      bpm: 120,
      bpmConfidence: 0.5,
      durationSeconds: 180,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus,
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

function createPlaylist(id: string, updatedAt: string, trackIds = ["track-a"]): BaseTrackPlaylist {
  return {
    id,
    name: id,
    trackIds,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("libraryRuntime", () => {
  it("sorts and appends tracks and playlists", () => {
    const oldTrack = createTrack("track-a", "2026-06-25T10:00:00.000Z");
    const newTrack = createTrack("track-b", "2026-06-25T11:00:00.000Z");
    const oldPlaylist = createPlaylist("playlist-a", "2026-06-25T10:00:00.000Z");
    const newPlaylist = createPlaylist("playlist-b", "2026-06-25T11:00:00.000Z");

    expect(sortTracksByImportedAt([oldTrack, newTrack]).map((entry) => entry.id)).toEqual([
      "track-b",
      "track-a",
    ]);
    expect(sortPlaylistsByUpdatedAt([oldPlaylist, newPlaylist]).map((entry) => entry.id)).toEqual([
      "playlist-b",
      "playlist-a",
    ]);
    expect(appendImportedTrack([oldTrack], newTrack)[0]).toBe(newTrack);
    expect(appendSavedPlaylist([oldPlaylist], newPlaylist)[0]).toBe(newPlaylist);
  });

  it("resolves selected ids and deletion cleanup", () => {
    const track = createTrack("track-a", "2026-06-25T10:00:00.000Z");
    const playlist = createPlaylist("playlist-a", "2026-06-25T10:00:00.000Z");

    expect(resolveSelectedTrackId("missing", [track])).toBe("track-a");
    expect(resolveSelectedPlaylistId("missing", [playlist])).toBe("playlist-a");
    expect(clearDeletedTrackSelection("track-a", "track-a")).toBeNull();
    expect(clearDeletedPlaylistSelection("playlist-a", "playlist-a")).toBeNull();
    expect(removeDeletedTrack([track], "track-a")).toEqual([]);
    expect(removeDeletedPlaylist([playlist], "playlist-a")).toEqual([]);
  });

  it("applies analyzed metadata and replacement flows", () => {
    const track = createTrack("track-a", "2026-06-25T10:00:00.000Z", "pending");
    const analyzed: MusicalAsset = {
      id: "asset-1",
      assetType: "track_analysis",
      title: "track-a",
      sourcePath: "/music/track-a.wav",
      suggestedBpm: 128,
      confidence: 0.9,
      tags: [],
      metrics: {},
      artifacts: {
        waveformBins: [1, 2],
        beatGrid: [],
        bpmCurve: [],
      },
      createdAt: "2026-06-25T11:00:00.000Z",
    };

    expect(shouldAnalyzeImportedTrack(track)).toBe(true);
    expect(resolveReanalyzeTrackInput(track)).toEqual({
      title: "track-a",
      sourcePath: "/music/track-a.wav",
      musicStyleId: "house",
    });
    expect(applyAnalyzedTrackMetadata([track], "track-a", analyzed)[0]).toMatchObject({
      bpm: 128,
      bpmConfidence: 0.9,
      waveformBins: [1, 2],
    });

    const replacement = { ...track, title: "replacement" };
    expect(replaceTrack([track], "track-a", replacement)[0]).toBe(replacement);
  });

  it("updates playlists on delete and resolves relink results", () => {
    const track = createTrack("track-a", "2026-06-25T10:00:00.000Z");
    const playlists = [
      createPlaylist("playlist-a", "2026-06-25T10:00:00.000Z", ["track-a", "track-b"]),
    ];
    const relinked = { ...track, title: "relinked" };
    const result: RelinkMissingTracksResult = {
      relinkedTracks: [relinked],
      unresolvedTrackIds: [],
    };

    expect(removeTrackFromPlaylists(playlists, "track-a")[0]?.trackIds).toEqual(["track-b"]);
    expect(replaceRelinkedTracks([track], result)[0]).toBe(relinked);
    expect(resolvePreferredRelinkSelection(result)).toBe("track-a");
    expect(toLibraryErrorMessage(new Error("boom"))).toBe("boom");
  });
});
