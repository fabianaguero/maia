import { describe, expect, it } from "vitest";

import type { PersistedSession } from "../../../src/api/sessions";
import type { BaseTrackPlaylist, LibraryTrack } from "../../../src/types/library";
import {
  resolveBaseDetails,
  resolveSelectedBaseDetails,
  resolveSessionBedPath,
} from "../../../src/features/session/sessionDisplayBaseRuntime";

function createTrack(input: {
  id: string;
  title: string;
  bpm?: number | null;
  path?: string;
  availabilityState?: LibraryTrack["file"]["availabilityState"];
}): LibraryTrack {
  const path = input.path ?? `/music/${input.id}.wav`;
  const bpm = "bpm" in input ? (input.bpm ?? null) : 126;
  return {
    id: input.id,
    file: {
      sourcePath: path,
      storagePath: path,
      playbackSource: "source_file",
      availabilityState: input.availabilityState ?? "available",
      sizeBytes: null,
      checksum: null,
    },
    tags: {
      title: input.title,
      artist: "MAIA",
      album: null,
      genre: "House",
      musicStyleId: "house",
      bpm,
      key: null,
      durationSec: 180,
    },
    analysis: {
      bpm,
      energy: 0.5,
      waveformBins: [0.1, 0.2],
      beatGrid: [],
      key: null,
      loudnessDb: -8,
      durationSec: 180,
    },
    performance: {
      rating: null,
      color: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
      playedCount: 0,
      lastPlayedAt: null,
    },
    title: input.title,
    sourcePath: path,
    storagePath: path,
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: [0.1, 0.2],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: "wav",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: 0.5,
    danceability: 0.7,
    structuralPatterns: [],
  };
}

function createPlaylist(trackIds: string[]): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Night deck",
    trackIds,
    createdAt: "2026-06-25T10:00:00.000Z",
    updatedAt: "2026-06-25T10:00:00.000Z",
  };
}

function createSession(overrides: Partial<PersistedSession>): PersistedSession {
  return {
    id: "session-1",
    label: "Session",
    sourceId: null,
    sourceTitle: null,
    sourcePath: null,
    sourceKind: null,
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
    ...overrides,
  };
}

describe("sessionDisplayBaseRuntime", () => {
  it("resolves playlist and track details from persisted sessions", () => {
    const alpha = createTrack({ id: "alpha", title: "Alpha", bpm: 124 });
    const beta = createTrack({ id: "beta", title: "Beta", bpm: 128 });
    const playlist = createPlaylist(["alpha", "beta"]);

    expect(resolveBaseDetails(null, [alpha, beta], [playlist])).toEqual({
      label: null,
      detail: null,
    });
    expect(
      resolveBaseDetails(
        createSession({ playlistId: "playlist-1", playlistName: "Fallback deck" }),
        [alpha, beta],
        [playlist],
      ),
    ).toEqual({
      label: "Night deck",
      detail: "2 tracks · median 126 BPM",
    });
    expect(
      resolveBaseDetails(
        createSession({ playlistId: "missing", playlistName: "Fallback deck" }),
        [alpha, beta],
        [playlist],
      ),
    ).toEqual({
      label: "Fallback deck",
      detail: null,
    });
    expect(
      resolveBaseDetails(
        createSession({ trackId: "alpha", trackTitle: "Fallback title" }),
        [alpha, beta],
        [playlist],
      ),
    ).toEqual({
      label: "Alpha",
      detail: "124 BPM",
    });
    expect(
      resolveBaseDetails(
        createSession({ trackId: "missing", trackTitle: "Fallback title" }),
        [],
        [],
      ),
    ).toEqual({
      label: "Fallback title",
      detail: null,
    });
  });

  it("resolves current selected base details for both playlist and track modes", () => {
    const alpha = createTrack({ id: "alpha", title: "Alpha", bpm: 124 });
    const beta = createTrack({ id: "beta", title: "Beta", bpm: null });
    const playlist = createPlaylist(["alpha", "beta"]);

    expect(resolveSelectedBaseDetails("playlist", alpha, playlist, [alpha, beta])).toEqual({
      label: "Night deck",
      detail: "2 tracks · median 124 BPM",
    });
    expect(resolveSelectedBaseDetails("track", beta, playlist, [alpha, beta])).toEqual({
      label: "Beta",
      detail: "? BPM",
    });
  });

  it("finds the first playable bed path from playlist or track sessions", () => {
    const missing = createTrack({
      id: "missing",
      title: "Missing",
      path: "",
      availabilityState: "missing",
    });
    const playable = createTrack({
      id: "playable",
      title: "Playable",
      path: "/music/playable.wav",
    });
    const playlist = createPlaylist(["missing", "playable"]);

    expect(resolveSessionBedPath(null, [missing, playable], [playlist])).toBeNull();
    expect(
      resolveSessionBedPath(
        createSession({ playlistId: "playlist-1" }),
        [missing, playable],
        [playlist],
      ),
    ).toBe("/music/playable.wav");
    expect(
      resolveSessionBedPath(
        createSession({ playlistId: "missing" }),
        [missing, playable],
        [playlist],
      ),
    ).toBeNull();
    expect(
      resolveSessionBedPath(createSession({ trackId: "playable" }), [playable], [playlist]),
    ).toBe("/music/playable.wav");
    expect(
      resolveSessionBedPath(createSession({ trackId: "missing" }), [playable], [playlist]),
    ).toBeNull();
  });
});
