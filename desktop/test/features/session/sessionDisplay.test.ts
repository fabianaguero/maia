import { describe, expect, it } from "vitest";
import type { PersistedSession } from "../../../src/api/sessions";
import { en } from "../../../src/i18n/en";
import {
  formatMonitorConfidence,
  formatMonitorLevel,
  resolveBaseDetails,
  resolveModeLabel,
  resolveSelectedBaseDetails,
  resolveSessionBedPath,
  resolveSessionBedUrl,
  resolveSessionTemplateLabel,
  resolveSourceDetails,
} from "../../../src/features/session/sessionDisplay";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../src/types/library";

function makeTrack(overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  return {
    id: "track-1",
    tags: {
      title: "Track A",
    },
    file: {
      sourcePath: "/music/track-a.wav",
      storagePath: "/music/track-a.wav",
      availabilityState: "available",
      playbackSource: "source_file",
    },
    analysis: {
      bpm: 126,
      waveformBins: [],
      beatGrid: [],
    },
    ...overrides,
  } as unknown as LibraryTrack;
}

function makePlaylist(overrides: Partial<BaseTrackPlaylist> = {}): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Night Ops",
    trackIds: ["track-1", "track-2"],
    createdAt: "2026-06-25T00:00:00.000Z",
    updatedAt: "2026-06-25T00:00:00.000Z",
    ...overrides,
  };
}

function makeSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    id: "session-1",
    label: "Session One",
    sourceId: "repo-1",
    sourceTitle: "customers-service",
    sourcePath: "/logs/customers-service.log",
    sourceKind: "file",
    trackId: null,
    trackTitle: null,
    playlistId: null,
    playlistName: null,
    adapterKind: "file",
    mode: "live",
    status: "active",
    fileCursor: 0,
    totalPolls: 12,
    totalLines: 400,
    totalAnomalies: 8,
    lastBpm: 126,
    createdAt: "2026-06-25T00:00:00.000Z",
    updatedAt: "2026-06-25T00:00:00.000Z",
    sourceTemplateId: "deep-house",
    ...overrides,
  };
}

describe("sessionDisplay", () => {
  it("formats monitor confidence and level labels", () => {
    expect(formatMonitorConfidence(0.876)).toBe("88%");
    expect(formatMonitorConfidence(null)).toBe("—");
    expect(formatMonitorLevel("warn_burst", en.session.awaitingInput)).toBe("Warn Burst");
    expect(formatMonitorLevel(null, en.session.awaitingInput)).toBe(en.session.awaitingInput);
  });

  it("resolves translated template labels and mode labels", () => {
    expect(
      resolveSessionTemplateLabel(
        "deep-house",
        en,
        en.session.noTemplate,
        en.session.unknownTemplate,
      ),
    ).toBe(en.sourceTemplates.deepHouse.label);
    expect(
      resolveSessionTemplateLabel(null, en, en.session.noTemplate, en.session.unknownTemplate),
    ).toBe(en.session.noTemplate);
    expect(
      resolveSessionTemplateLabel(
        "unknown-template",
        en,
        en.session.noTemplate,
        en.session.unknownTemplate,
      ),
    ).toBe(en.session.unknownTemplate);
    expect(resolveModeLabel("log", en.session.logFile, en.session.repository)).toBe(
      en.session.logFile,
    );
    expect(resolveModeLabel("repo", en.session.logFile, en.session.repository)).toBe(
      en.session.repository,
    );
  });

  it("resolves base details from playlist and track sessions", () => {
    const tracks = [
      makeTrack(),
      makeTrack({
        id: "track-2",
        tags: { title: "Track B" } as LibraryTrack["tags"],
        analysis: { bpm: 124, waveformBins: [], beatGrid: [] } as LibraryTrack["analysis"],
      }),
    ];
    const playlists = [makePlaylist()];

    expect(
      resolveBaseDetails(
        makeSession({ playlistId: "playlist-1", playlistName: "Night Ops" }),
        tracks,
        playlists,
      ),
    ).toEqual({
      label: "Night Ops",
      detail: "2 tracks · median 125 BPM",
    });

    expect(
      resolveBaseDetails(
        makeSession({ trackId: "track-1", trackTitle: "Track A" }),
        tracks,
        playlists,
      ),
    ).toEqual({
      label: "Track A",
      detail: "126 BPM",
    });
  });

  it("resolves selected base details and source lookup", () => {
    const track = makeTrack();
    const playlist = makePlaylist({ trackIds: ["track-1"] });
    const repositories: RepositoryAnalysis[] = [
      {
        id: "repo-1",
        sourcePath: "/logs/customers-service.log",
        title: "customers-service",
        sourceKind: "file",
        suggestedBpm: 126,
        confidence: 0.9,
        analyzerStatus: "ok",
        storagePath: null,
      } as unknown as RepositoryAnalysis,
    ];

    expect(resolveSelectedBaseDetails("track", track, null, [track])).toEqual({
      label: "Track A",
      detail: "126 BPM",
    });

    expect(resolveSelectedBaseDetails("playlist", null, playlist, [track])).toEqual({
      label: "Night Ops",
      detail: "1 tracks · median 126 BPM",
    });

    expect(resolveSourceDetails(makeSession(), repositories)).toEqual({
      label: "customers-service",
      path: "/logs/customers-service.log",
    });
  });

  it("resolves session bed paths and external urls", () => {
    const tracks = [
      makeTrack(),
      makeTrack({
        id: "track-2",
        file: {
          sourcePath: "https://cdn.example.com/track-b.wav",
          storagePath: "https://cdn.example.com/track-b.wav",
          availabilityState: "available",
          playbackSource: "source_file",
        } as LibraryTrack["file"],
      }),
    ];
    const playlists = [makePlaylist({ trackIds: ["track-2"] })];

    expect(resolveSessionBedPath(makeSession({ trackId: "track-1" }), tracks, playlists)).toBe(
      "/music/track-a.wav",
    );
    expect(
      resolveSessionBedPath(
        makeSession({ playlistId: "playlist-1", playlistName: "Night Ops" }),
        tracks,
        playlists,
      ),
    ).toBe("https://cdn.example.com/track-b.wav");

    expect(resolveSessionBedUrl("https://cdn.example.com/track-b.wav")).toBe(
      "https://cdn.example.com/track-b.wav",
    );
    expect(resolveSessionBedUrl(null)).toBeNull();
  });
});
