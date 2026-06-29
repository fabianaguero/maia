import { describe, expect, it } from "vitest";

import type { BaseTrackPlaylist, LibraryTrack } from "../../src/types/library";
import {
  findPlaylistLeadTrack,
  getPlaylistMedianBpm,
  resolvePlaylistTracks,
  summarizePlaylistTracks,
} from "../../src/utils/playlist";

function createTrack(id: string, title: string, bpm: number | null): LibraryTrack {
  const importedAt = "2026-04-08T12:00:00.000Z";

  return {
    id,
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: `/managed/${id}.wav`,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1234,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title,
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
      bpm,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "test",
      analyzerVersion: "maia-analyzer",
      analyzedAt: importedAt,
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
    title,
    sourcePath: `/music/${id}.wav`,
    storagePath: `/managed/${id}.wav`,
    importedAt,
    bpm,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "test",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
  };
}

describe("playlist utils", () => {
  const tracks = [
    createTrack("track-1", "Alpha", 124),
    createTrack("track-2", "Beta", 128),
    createTrack("track-3", "Gamma", 132),
    createTrack("track-4", "Delta", null),
  ];

  const playlist: BaseTrackPlaylist = {
    id: "playlist-1",
    name: "Team Base",
    trackIds: ["track-3", "track-1", "missing", "track-2"],
    createdAt: "2026-04-08T12:00:00.000Z",
    updatedAt: "2026-04-08T12:00:00.000Z",
  };

  it("resolves playlist tracks in playlist order and skips missing ids", () => {
    expect(resolvePlaylistTracks(playlist, tracks).map((track) => track.id)).toEqual([
      "track-3",
      "track-1",
      "track-2",
    ]);
  });

  it("derives a stable median bpm from analyzed playlist tracks", () => {
    expect(getPlaylistMedianBpm(playlist, tracks)).toBe(128);
    expect(
      getPlaylistMedianBpm(
        {
          ...playlist,
          trackIds: ["track-1", "track-2"],
        },
        tracks,
      ),
    ).toBe(126);
  });

  it("summarizes the leading playlist track titles", () => {
    expect(summarizePlaylistTracks(playlist, tracks)).toBe("Gamma · Alpha +1");
  });

  it("picks the first available lead track for playlist playback", () => {
    const missingLead = {
      ...tracks[0],
      file: {
        ...tracks[0].file,
        availabilityState: "missing" as const,
      },
    };

    expect(
      findPlaylistLeadTrack(
        {
          ...playlist,
          trackIds: ["track-1", "track-2", "track-3"],
        },
        [missingLead, tracks[1], tracks[2]],
      )?.id,
    ).toBe("track-2");
  });
});
