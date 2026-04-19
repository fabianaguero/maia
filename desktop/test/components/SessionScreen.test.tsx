import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionScreen } from "../../src/features/session/SessionScreen";
import { MonitorProvider } from "../../src/features/monitor/MonitorContext";
import type { PersistedSession, SessionBookmark } from "../../src/api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../src/types/library";

const importedAt = "2026-04-09T12:00:00.000Z";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    file: {
      sourcePath: "/music/base.wav",
      storagePath: "/managed/base.wav",
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 2048,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title: "Base Pulse",
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
      importedAt,
      bpm: 126,
      bpmConfidence: 0.82,
      durationSeconds: 240,
      waveformBins: [0.2, 0.5],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
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
      color: "#58e6ff",
      rating: 4,
      playCount: 2,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
    title: "Base Pulse",
    sourcePath: "/music/base.wav",
    storagePath: "/managed/base.wav",
    importedAt,
    bpm: 126,
    bpmConfidence: 0.82,
    durationSeconds: 240,
    waveformBins: [0.2, 0.5],
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
    visualization: {
      waveform: [],
      beatGrid: [],
      hotCues: [],
    },
  };
}

function createPlaylist(): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Ops Nights",
    trackIds: ["track-1"],
    createdAt: importedAt,
    updatedAt: importedAt,
  };
}

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "production.log",
    sourcePath: "/logs/production.log",
    storagePath: null,
    sourceKind: "file",
    importedAt,
    suggestedBpm: 126,
    confidence: 0.71,
    summary: "Stable pulse",
    analyzerStatus: "ready",
    buildSystem: "unknown",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    notes: [],
    tags: [],
    metrics: {},
  };
}

function createSession(): PersistedSession {
  return {
    id: "session-1",
    label: "Night watch",
    sourceId: "repo-1",
    sourceTitle: "production.log",
    sourcePath: "/logs/production.log",
    sourceKind: "file",
    trackId: null,
    trackTitle: null,
    playlistId: "playlist-1",
    playlistName: "Ops Nights",
    adapterKind: "file",
    mode: "live",
    status: "paused",
    fileCursor: 420,
    totalPolls: 16,
    totalLines: 480,
    totalAnomalies: 5,
    lastBpm: 126,
    createdAt: importedAt,
    updatedAt: importedAt,
  };
}

function createBookmark(): SessionBookmark {
  return {
    id: 1,
    sessionId: "session-1",
    replayWindowIndex: 7,
    eventIndex: 7,
    label: "Deploy spike",
    note: "This window nailed the alert texture.",
    bookmarkTag: "good-alerting",
    suggestedStyleProfileId: "alert-techno",
    suggestedMutationProfileId: "reactive",
    trackId: "track-1",
    trackTitle: "Base Pulse",
    trackSecond: 42.5,
    createdAt: importedAt,
    updatedAt: importedAt,
  };
}

describe("SessionScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a replay-active banner with progress", () => {
    render(
      <MonitorProvider>
        <SessionScreen
          tracks={[createTrack()]}
          playlists={[createPlaylist()]}
          repositories={[createRepository()]}
          sessions={[createSession()]}
          sessionBookmarksBySessionId={{}}
          selectedSessionId="session-1"
          loading={false}
          mutating={false}
          error={null}
          activeSessionId="session-1"
          activeSessionMode="playback"
          activePlaybackProgress={0.4}
          onStartSession={vi.fn(async () => true)}
          onStopSession={vi.fn(async () => undefined)}
          onResume={vi.fn()}
          onPlayback={vi.fn(async () => true)}
          onReplayBookmark={vi.fn(async () => true)}
          onDelete={vi.fn(async () => undefined)}
          onSelectSession={vi.fn()}
        />
      </MonitorProvider>,
    );

    expect(screen.getByText("Replay active")).toBeInTheDocument();
    expect(screen.getByText("40% of the saved session is back on deck.")).toBeInTheDocument();
    expect(screen.getByLabelText("Replay progress")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exit replay" })).toBeInTheDocument();
  });

  it("replays a stored session from the card action", async () => {
    const onPlayback = vi.fn(async () => true);
    const onSelectSession = vi.fn();

    render(
      <MonitorProvider>
        <SessionScreen
          tracks={[createTrack()]}
          playlists={[createPlaylist()]}
          repositories={[createRepository()]}
          sessions={[createSession()]}
          sessionBookmarksBySessionId={{}}
          selectedSessionId={null}
          loading={false}
          mutating={false}
          error={null}
          activeSessionId={null}
          activeSessionMode={null}
          activePlaybackProgress={null}
          onStartSession={vi.fn(async () => true)}
          onStopSession={vi.fn(async () => undefined)}
          onResume={vi.fn()}
          onPlayback={onPlayback}
          onReplayBookmark={vi.fn(async () => true)}
          onDelete={vi.fn(async () => undefined)}
          onSelectSession={onSelectSession}
        />
      </MonitorProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Playback" }));

    await waitFor(() => {
      expect(onPlayback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "session-1",
          playlistName: "Ops Nights",
        }),
      );
    });
    expect(onSelectSession).toHaveBeenCalledWith("session-1");
  });

  it("shows replay notes for the selected session and jumps to a saved window", async () => {
    const onReplayBookmark = vi.fn(async () => true);
    const onSelectSession = vi.fn();

    render(
      <MonitorProvider>
        <SessionScreen
          tracks={[createTrack()]}
          playlists={[createPlaylist()]}
          repositories={[createRepository()]}
          sessions={[createSession()]}
          sessionBookmarksBySessionId={{ session_ignored: [], "session-1": [createBookmark()] }}
          selectedSessionId="session-1"
          loading={false}
          mutating={false}
          error={null}
          activeSessionId={null}
          activeSessionMode={null}
          activePlaybackProgress={null}
          onStartSession={vi.fn(async () => true)}
          onStopSession={vi.fn(async () => undefined)}
          onResume={vi.fn()}
          onPlayback={vi.fn(async () => true)}
          onReplayBookmark={onReplayBookmark}
          onDelete={vi.fn(async () => undefined)}
          onSelectSession={onSelectSession}
        />
      </MonitorProvider>,
    );

    expect(screen.getByText("Replay notes")).toBeInTheDocument();
    expect(screen.getByText("Recommended mix")).toBeInTheDocument();
    expect(screen.getByText("Deploy spike")).toBeInTheDocument();
    expect(screen.getByText("This window nailed the alert texture.")).toBeInTheDocument();
    expect(screen.getAllByText("Good alerting").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alert Techno").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reactive").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Replay here" }));

    await waitFor(() => {
      expect(onReplayBookmark).toHaveBeenCalledWith(
        expect.objectContaining({ id: "session-1" }),
        7,
      );
    });
    expect(onSelectSession).toHaveBeenCalledWith("session-1");
  });
});
