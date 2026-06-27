import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildLibraryPlaylistsViewModel } from "../../../src/features/library/libraryPlaylistsViewModel";
import type { BaseTrackPlaylist, LibraryTrack } from "../../../src/types/library";

function createTrack(input: {
  id: string;
  title: string;
  bpm?: number | null;
  availabilityState?: "available" | "missing";
}): LibraryTrack {
  const importedAt = "2026-06-26T10:00:00.000Z";

  return {
    id: input.id,
    title: input.title,
    sourcePath: `/music/${input.id}.wav`,
    storagePath: null,
    importedAt,
    bpm: input.bpm ?? null,
    bpmConfidence: 0.7,
    durationSeconds: 180,
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
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: `/music/${input.id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: input.availabilityState ?? "available",
      playbackSource: "source_file",
    },
    tags: {
      title: input.title,
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
      bpm: input.bpm ?? null,
      bpmConfidence: 0.7,
      durationSeconds: 180,
      waveformBins: [],
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

function createPlaylist(id: string, trackIds: string[]): BaseTrackPlaylist {
  return {
    id,
    name: id,
    trackIds,
    createdAt: "2026-06-26T10:00:00.000Z",
    updatedAt: "2026-06-26T12:00:00.000Z",
  };
}

describe("libraryPlaylistsViewModel", () => {
  it("builds playlist editor options with BPM and lost state", () => {
    const tracks = [
      createTrack({ id: "track-a", title: "Track A", bpm: 126 }),
      createTrack({ id: "track-b", title: "Track B", bpm: null, availabilityState: "missing" }),
    ];

    const model = buildLibraryPlaylistsViewModel({
      playlistEditorId: null,
      playlistTrackIds: ["track-b"],
      playlists: [],
      selectedPlaylistId: null,
      t: en,
      tracks,
    });

    expect(model.editorActionLabel).toBe(en.library.savePlaylist);
    expect(model.trackOptions).toEqual([
      {
        id: "track-a",
        checked: false,
        title: "Track A",
        detail: "126 BPM",
      },
      {
        id: "track-b",
        checked: true,
        title: "Track B",
        detail: `${en.library.noBpm} · ${en.library.lost.toUpperCase()}`,
      },
    ]);
  });

  it("builds playlist cards with preview text and selection", () => {
    const tracks = [
      createTrack({ id: "track-a", title: "Track A", bpm: 126 }),
      createTrack({ id: "track-b", title: "Track B", bpm: 124 }),
      createTrack({ id: "track-c", title: "Track C", bpm: 122 }),
    ];
    const playlists = [createPlaylist("playlist-a", ["track-a", "track-b", "track-c"])];

    const model = buildLibraryPlaylistsViewModel({
      playlistEditorId: "playlist-a",
      playlistTrackIds: ["track-a"],
      playlists,
      selectedPlaylistId: "playlist-a",
      t: en,
      tracks,
    });

    expect(model.editorActionLabel).toBe(en.library.updatePlaylist);
    expect(model.cards).toHaveLength(1);
    expect(model.cards[0]).toMatchObject({
      id: "playlist-a",
      isSelected: true,
      name: "playlist-a",
      preview: "Track A · Track B · Track C",
    });
    expect(model.cards[0]?.meta).toContain(`3 ${en.library.sounds.toLowerCase()}`);
  });

  it("falls back when a playlist has no resolvable tracks", () => {
    const model = buildLibraryPlaylistsViewModel({
      playlistEditorId: null,
      playlistTrackIds: [],
      playlists: [createPlaylist("playlist-empty", ["missing-track"])],
      selectedPlaylistId: null,
      t: en,
      tracks: [],
    });

    expect(model.emptyMessage).toBe(en.library.noBasePlaylists);
    expect(model.cards[0]?.preview).toBe(en.library.noTracksAssigned);
  });
});
