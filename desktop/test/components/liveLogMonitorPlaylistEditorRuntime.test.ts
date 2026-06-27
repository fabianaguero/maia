import { describe, expect, it, vi } from "vitest";

import type { BaseTrackPlaylist, LibraryTrack } from "../../src/types/library";
import {
  addTrackToLiveMonitorBasePlaylist,
  loadSavedLiveMonitorBasePlaylist,
  moveTrackWithinLiveMonitorBasePlaylist,
  removeTrackFromLiveMonitorBasePlaylist,
  renameLiveMonitorBasePlaylist,
} from "../../src/features/analyzer/components/liveLogMonitorPlaylistEditorRuntime";

function createPlaylist(trackIds: string[]): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Base playlist",
    trackIds,
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
  };
}

function createTrack(id: string): LibraryTrack {
  return {
    id,
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: null,
      modifiedAt: null,
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
      durationSeconds: 120,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
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
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-26T00:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 120,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "librosa-dsp",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
  };
}

describe("liveLogMonitorPlaylistEditorRuntime", () => {
  it("renames the current playlist or creates a new one", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-26T10:00:00.000Z"));

    expect(renameLiveMonitorBasePlaylist(createPlaylist(["a"]), "Monitoring").name).toBe(
      "Monitoring",
    );
    expect(renameLiveMonitorBasePlaylist(null, "Ambient").name).toBe("Ambient");

    vi.useRealTimers();
  });

  it("adds tracks without duplicating them", () => {
    const playlist = createPlaylist(["a"]);
    expect(addTrackToLiveMonitorBasePlaylist(playlist, "a")).toBe(playlist);
    expect(addTrackToLiveMonitorBasePlaylist(playlist, "b")?.trackIds).toEqual(["a", "b"]);
  });

  it("filters loaded playlists against available tracks", () => {
    const playlist = createPlaylist(["a", "b", "c"]);
    expect(loadSavedLiveMonitorBasePlaylist(playlist, [createTrack("a"), createTrack("c")])?.trackIds).toEqual([
      "a",
      "c",
    ]);
  });

  it("moves tracks up and down within the playlist", () => {
    const playlist = createPlaylist(["a", "b", "c"]);
    expect(moveTrackWithinLiveMonitorBasePlaylist(playlist, "b", "up")?.trackIds).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(moveTrackWithinLiveMonitorBasePlaylist(playlist, "b", "down")?.trackIds).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("removes tracks from the playlist", () => {
    const playlist = createPlaylist(["a", "b", "c"]);
    expect(removeTrackFromLiveMonitorBasePlaylist(playlist, "b")?.trackIds).toEqual(["a", "c"]);
  });
});
