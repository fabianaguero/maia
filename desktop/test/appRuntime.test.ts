import { describe, expect, it } from "vitest";

import type { PersistedSession } from "../src/api/sessions";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../src/types/library";
import {
  buildDiscoveredLogImportInputs,
  resolveLibraryMonitorGuideState,
  resolvePlaylistArmState,
  resolveReplaySourceRepository,
  resolveSessionMonitorGuideState,
  resolveTrackArmState,
  shouldReuseActiveReplaySession,
} from "../src/appRuntime";

function createTrack(id: string, sourcePath = `/music/${id}.wav`): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath,
    storagePath: null,
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
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
      sourcePath,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: "2026-06-25T10:00:00.000Z",
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
      importedAt: "2026-06-25T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
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
    createdAt: "2026-06-25T10:00:00.000Z",
    updatedAt: "2026-06-25T10:00:00.000Z",
  };
}

describe("appRuntime", () => {
  it("resolves arm state for tracks and playlists", () => {
    const tracks = [createTrack("track-a"), createTrack("track-b")];
    const playlists = [createPlaylist("playlist-a", ["track-b"])];

    expect(resolveTrackArmState("track-a", tracks)).toEqual({
      selectedPlaylistId: null,
      selectedTrackId: "track-a",
    });

    expect(resolvePlaylistArmState("playlist-a", playlists, tracks)).toEqual({
      selectedPlaylistId: "playlist-a",
      selectedTrackId: "track-b",
    });
  });

  it("builds monitor guide state from selected library items and session drafts", () => {
    const tracks = [createTrack("track-a"), createTrack("track-b")];
    const playlist = createPlaylist("playlist-a", ["track-a", "track-b"]);

    expect(
      resolveLibraryMonitorGuideState({
        selectedPlaylist: playlist,
        selectedTrack: null,
        tracks,
      }),
    ).toEqual({
      trackPath: null,
      playlistPaths: ["/music/track-a.wav", "/music/track-b.wav"],
    });

    expect(
      resolveSessionMonitorGuideState(
        { trackId: "track-b" },
        [playlist],
        tracks,
      ),
    ).toEqual({
      trackPath: "/music/track-b.wav",
      playlistPaths: null,
    });
  });

  it("resolves replay repositories, replay reuse, and discovered log imports", () => {
    const repositories = [
      {
        id: "repo-1",
        title: "orders-service",
        sourcePath: "/logs/orders.log",
      } as RepositoryAnalysis,
    ];
    const session = {
      id: "session-1",
      label: "Session 1",
      sourceId: null,
      sourceTitle: null,
      sourcePath: "/logs/orders.log",
      sourceKind: "file",
      trackId: null,
      trackTitle: null,
      playlistId: null,
      playlistName: null,
      adapterKind: "file",
      mode: "live",
      status: "active",
      fileCursor: 0,
      totalPolls: 0,
      totalLines: 0,
      totalAnomalies: 0,
      lastBpm: null,
      createdAt: "2026-06-25T10:00:00.000Z",
      updatedAt: "2026-06-25T10:00:00.000Z",
      sourceTemplateId: null,
    } satisfies PersistedSession;

    expect(resolveReplaySourceRepository(session, repositories)).toBe(repositories[0]);
    expect(
      shouldReuseActiveReplaySession({
        currentPersistedSessionId: "session-1",
        isPlayback: true,
        replaySessionId: "session-1",
      }),
    ).toBe(true);
    expect(
      buildDiscoveredLogImportInputs(["/logs/api.log", "/logs/worker.log"]),
    ).toEqual([
      { sourceKind: "file", sourcePath: "/logs/api.log", label: "api.log" },
      { sourceKind: "file", sourcePath: "/logs/worker.log", label: "worker.log" },
    ]);
  });
});
