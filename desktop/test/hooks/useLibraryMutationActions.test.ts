import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLibraryMutationActions } from "../../src/hooks/useLibraryMutationActions";
import type { UseLibraryMutationActionsInput } from "../../src/hooks/libraryMutationActionsTypes";
import type { LibraryTrack } from "../../src/types/library";

const trackActionsMock = vi.hoisted(() => ({
  useLibraryTrackMutationActions: vi.fn(),
}));

const playlistActionsMock = vi.hoisted(() => ({
  useLibraryPlaylistMutationActions: vi.fn(),
}));

vi.mock("../../src/hooks/useLibraryTrackMutationActions", () => trackActionsMock);
vi.mock("../../src/hooks/useLibraryPlaylistMutationActions", () => playlistActionsMock);

function createTrack(id: string): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-28T10:00:00.000Z",
    bpm: 120,
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
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: "2026-06-28T10:00:00.000Z",
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
      importedAt: "2026-06-28T10:00:00.000Z",
      bpm: 120,
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

function createInput(): UseLibraryMutationActionsInput {
  return {
    tracks: [createTrack("track-a")],
    setTracks: vi.fn(),
    setPlaylists: vi.fn(),
    setSelectedTrackId: vi.fn(),
    setSelectedPlaylistId: vi.fn(),
    setMutating: vi.fn(),
    setError: vi.fn(),
  };
}

describe("useLibraryMutationActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("composes track and playlist actions from the split hooks", () => {
    const input = createInput();
    const importLibraryTrack = vi.fn();
    const relinkTrack = vi.fn();
    const savePlaylist = vi.fn();
    const deletePlaylist = vi.fn();

    trackActionsMock.useLibraryTrackMutationActions.mockReturnValue({
      importLibraryTrack,
      relinkTrack,
    });
    playlistActionsMock.useLibraryPlaylistMutationActions.mockReturnValue({
      savePlaylist,
      deletePlaylist,
    });

    const { result } = renderHook(() => useLibraryMutationActions(input));

    expect(trackActionsMock.useLibraryTrackMutationActions).toHaveBeenCalledWith(input);
    expect(playlistActionsMock.useLibraryPlaylistMutationActions).toHaveBeenCalledWith(input);
    expect(result.current).toEqual({
      importLibraryTrack,
      relinkTrack,
      savePlaylist,
      deletePlaylist,
    });
  });
});
