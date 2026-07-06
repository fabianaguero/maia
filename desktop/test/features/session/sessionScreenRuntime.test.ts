import { describe, expect, it } from "vitest";

import type { PersistedSession, SessionBookmark, SessionEvent } from "../../../src/api/sessions";
import { en } from "../../../src/i18n/en";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../src/types/library";
import {
  buildSessionControllerDerivedBookmarkBindings,
  buildSessionControllerDerivedBookmarkInput,
  buildSessionControllerDerivedBookmarkState,
  buildSessionControllerDerivedDetailsBindings,
  buildSessionControllerDerivedDetailsInput,
  buildSessionControllerDerivedSelectionArgs,
  buildSessionControllerDerivedSelectionInput,
  buildSessionControllerDerivedDetailsState,
  buildSessionControllerDerivedSectionInputs,
  buildSessionControllerDerivedSections,
  buildSessionControllerDerivedSelectionBindings,
  buildSessionControllerDerivedSelectionState,
  buildSessionControllerDerivedSessionBindings,
  buildSessionControllerDerivedState,
  buildSessionLabelPlaceholder,
  createDirectSessionStartPlan,
  createResumeSessionPlan,
  createSessionStartPlan,
  createSessionTimestampId,
  resolveBookmarkContext,
  resolveSessionBookmarkState,
  resolvePlaybackPercent,
  resolveReadyToRun,
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
  resolveSessionControllerDerivedSections,
  resolveSessionControllerDerivedSelectionState,
  resolveSessionControllerDerivedState,
  resolveSessionSelection,
  resolveSourceOptions,
} from "../../../src/features/session/sessionScreenRuntime";

const repository: RepositoryAnalysis = {
  id: "repo-1",
  title: "production.log",
  sourcePath: "/logs/production.log",
  storagePath: null,
  sourceKind: "file",
  importedAt: "2026-06-25T00:00:00.000Z",
  suggestedBpm: null,
  confidence: 0,
  summary: "",
  analyzerStatus: "ready",
  buildSystem: "",
  primaryLanguage: "logs",
  javaFileCount: 0,
  testFileCount: 0,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  notes: [],
  tags: [],
  metrics: {},
};

const session: PersistedSession = {
  id: "session-1",
  label: "Night watch",
  sourceId: "repo-1",
  sourceTitle: "production.log",
  sourcePath: "/logs/production.log",
  sourceKind: "file",
  trackId: "track-1",
  trackTitle: "Base Pulse",
  playlistId: null,
  playlistName: null,
  adapterKind: "file",
  mode: "live",
  status: "paused",
  fileCursor: 0,
  totalPolls: 0,
  totalLines: 0,
  totalAnomalies: 0,
  lastBpm: null,
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z",
  sourceTemplateId: null,
};

const track = {
  id: "track-1",
  file: {
    sourcePath: "/music/base-pulse.wav",
    storagePath: "/music/base-pulse.wav",
    playbackSource: "source_file",
    availabilityState: "available",
  },
  tags: {
    title: "Base Pulse",
    artist: "MAIA",
    album: null,
    genre: "House",
    year: null,
    durationSec: 240,
  },
  analysis: {
    bpm: 126,
    keySignature: null,
    energy: 0.8,
    danceability: 0.7,
    durationSeconds: 240,
    beatGrid: [],
    bpmCurve: [],
    waveformBins: [],
    notes: [],
  },
  performance: {
    rating: 0,
    color: null,
    bpmLock: false,
    gridLock: false,
    mainCueSecond: null,
    hotCues: [],
    memoryCues: [],
    savedLoops: [],
    lastPlayedAt: null,
    playCount: 0,
  },
  title: "Base Pulse",
  sourcePath: "/music/base-pulse.wav",
  storagePath: "/music/base-pulse.wav",
  importedAt: "2026-06-25T00:00:00.000Z",
  bpm: 126,
  bpmConfidence: 0.92,
  durationSeconds: 240,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  analyzerStatus: "ready",
  repoSuggestedBpm: null,
  repoSuggestedStatus: "idle",
  notes: [],
  fileExtension: "wav",
  analysisMode: "full",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: null,
  energyLevel: 0.8,
  danceability: 0.7,
  structuralPatterns: [],
} as unknown as LibraryTrack;

const playlist: BaseTrackPlaylist = {
  id: "playlist-1",
  name: "Night drive",
  trackIds: ["track-1"],
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z",
};

describe("sessionScreenRuntime", () => {
  it("builds bookmark context from stored event payload", () => {
    const bookmark = {
      id: 1,
      eventIndex: 0,
    } as SessionBookmark;
    const events = [
      {
        suggestedBpm: 126,
        dominantLevel: "error",
        anomalyCount: 3,
        parsedLinesJson: JSON.stringify(["first line", "second line"]),
      },
    ] as SessionEvent[];

    expect(resolveBookmarkContext(bookmark, events)).toEqual({
      bpm: 126,
      dominantLevel: "error",
      anomalyCount: 3,
      logExcerpt: "first line",
    });
  });

  it("creates a valid live session plan for file sources", () => {
    const plan = createSessionStartPlan(
      {
        baseMode: "track",
        mode: "log",
        repositories: [repository],
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: "track-1",
        sessionLabel: "",
      },
      en,
      () => "session_123",
    );

    expect(plan.error).toBeNull();
    expect(plan.input).toEqual({
      sessionId: "session_123",
      adapterKind: "file",
      source: "/logs/production.log",
      label: "production.log",
      startFromBeginning: true,
    });
    expect(plan.draft).toEqual({
      sourceId: "repo-1",
      trackId: "track-1",
      playlistId: undefined,
    });
  });

  it("rejects session creation when a playlist base is missing", () => {
    const plan = createSessionStartPlan(
      {
        baseMode: "playlist",
        mode: "log",
        repositories: [repository],
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: null,
        sessionLabel: "ops",
      },
      en,
      () => "session_123",
    );

    expect(plan).toEqual({ error: en.session.selectBasePlaylist });
  });

  it("creates direct launch and resume plans", () => {
    const directPlan = createDirectSessionStartPlan(
      {
        directPath: " /var/log/custom.log ",
        selectedPlaylistId: "playlist-1",
        selectedTrackId: null,
      },
      en,
      () => "direct_1",
    );

    expect(directPlan.input?.source).toBe("/var/log/custom.log");
    expect(directPlan.input?.label).toBe("custom.log");
    expect(directPlan.draft).toEqual({
      trackId: undefined,
      playlistId: "playlist-1",
    });

    const resumePlan = createResumeSessionPlan("session-1", [session], [repository], en);
    expect(resumePlan.error).toBeNull();
    expect(resumePlan.input).toEqual({
      sessionId: "session-1",
      adapterKind: "file",
      source: "/logs/production.log",
      label: "Night watch",
    });
  });

  it("resolves replay, readiness and placeholder state", () => {
    expect(resolveReplaySessionError(null, en)).toBe(en.session.noStoredSourceReplay);
    expect(resolveReplaySessionFailure(false, en)).toBe(en.session.failedReplay);
    expect(resolveReplayBookmarkError(false, en)).toBe(en.session.failedReplayJump);
    expect(
      buildSessionLabelPlaceholder({
        selectedBaseLabel: "Base Pulse",
        selectedSourceTitle: "production.log",
        templateGenre: "House",
        templateLabel: "Log monitor",
        fallbackLabel: en.session.sessionPlaceholder,
      }),
    ).toBe("production.log · Base Pulse · House");
    expect(resolvePlaybackPercent(0.401)).toBe(40);
    expect(
      resolveReadyToRun({
        baseMode: "track",
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: "track-1",
      }),
    ).toBe(true);
  });

  it("resolves source options and timestamp ids deterministically", () => {
    const repoSource = {
      ...repository,
      id: "repo-2",
      sourceKind: "directory" as const,
    };

    expect(resolveSourceOptions("log", [repository, repoSource])).toEqual([repository]);
    expect(resolveSourceOptions("repo", [repository, repoSource])).toEqual([repoSource]);
    expect(createSessionTimestampId("session", 123)).toBe("session_123");
  });

  it("derives controller state for the active session booth", () => {
    const input = {
      activePlaybackProgress: 0.42,
      activeSessionId: "session-1",
      activeSessionMode: "live",
      baseMode: "track",
      mode: "log",
      monitorHasSession: true,
      playlists: [playlist],
      repositories: [repository],
      selectedPlaylistId: null,
      selectedSessionEvents: [
        {
          suggestedBpm: 124,
          dominantLevel: "warn",
          anomalyCount: 2,
          parsedLinesJson: JSON.stringify(["warn checkout"]),
        },
      ] as SessionEvent[],
      selectedSessionId: "session-1",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionBookmarksBySessionId: {
        "session-1": [{ id: 7, eventIndex: 0 } as SessionBookmark],
      },
      sessionPlaceholderFallback: en.session.sessionPlaceholder,
      sessions: [session],
      templateGenre: "House",
      templateLabel: "Night monitor",
      tracks: [track],
    };
    const selectionState = resolveSessionControllerDerivedSelectionState(input);
    const selectionInput = buildSessionControllerDerivedSelectionInput(input);
    const selectionArgs = buildSessionControllerDerivedSelectionArgs(selectionInput);
    const rebuiltSelectionState = buildSessionControllerDerivedSelectionState({
      sourceOptions: [repository],
      entitySelection: {
        selectedSource: repository,
        selectedTrack: track,
        selectedPlaylist: null,
      },
      sessionSelection: selectionState.sessionSelection,
    });
    const bookmarkInput = buildSessionControllerDerivedBookmarkInput({
      selectedSession: selectionState.sessionSelection.selectedSession,
      sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
      selectedSessionEvents: input.selectedSessionEvents,
    });
    const bookmarkState = buildSessionControllerDerivedBookmarkState(bookmarkInput);
    const detailsInput = buildSessionControllerDerivedDetailsInput({
      baseMode: input.baseMode,
      selectedTrack: selectionState.selectedTrack,
      selectedPlaylist: selectionState.selectedPlaylist,
      tracks: input.tracks,
      selectedPlaylistId: input.selectedPlaylistId,
      selectedSourceId: input.selectedSourceId,
      selectedTrackId: input.selectedTrackId,
      selectedSource: selectionState.selectedSource,
      templateGenre: input.templateGenre,
      templateLabel: input.templateLabel,
      sessionPlaceholderFallback: input.sessionPlaceholderFallback,
      activePlaybackProgress: input.activePlaybackProgress,
      activeSession: selectionState.sessionSelection.activeSession,
      selectedSession: selectionState.sessionSelection.selectedSession,
      repositories: input.repositories,
      playlists: input.playlists,
    });
    const sectionInputs = buildSessionControllerDerivedSectionInputs({
      input,
      selectionState,
    });
    const detailsState = buildSessionControllerDerivedDetailsState(detailsInput);
    const sections = resolveSessionControllerDerivedSections(input);
    const builtSections = buildSessionControllerDerivedSections({
      input,
      selectionState,
    });
    const selectionBindings = buildSessionControllerDerivedSelectionBindings(selectionState);
    const sessionBindings = buildSessionControllerDerivedSessionBindings(selectionState);
    const bookmarkBindings = buildSessionControllerDerivedBookmarkBindings(bookmarkState);
    const detailsBindings = buildSessionControllerDerivedDetailsBindings(detailsState);
    const rebuiltState = buildSessionControllerDerivedState(sections);
    const derived = resolveSessionControllerDerivedState(input);

    expect(derived.sourceOptions).toEqual([repository]);
    expect(selectionInput.mode).toBe("log");
    expect(selectionArgs.sourceOptions).toEqual([repository]);
    expect(sectionInputs.bookmarkInput.selectedSession?.id).toBe("session-1");
    expect(sectionInputs.detailsInput.selectedSource?.id).toBe("repo-1");
    expect(rebuiltSelectionState.selectedSource?.id).toBe("repo-1");
    expect(selectionState.sourceOptions).toEqual([repository]);
    expect(selectionBindings.selectedTrack?.id).toBe("track-1");
    expect(selectionState.sessionSelection.activeSession?.id).toBe("session-1");
    expect(sessionBindings.selectedSessionIdForEvents).toBe("session-1");
    expect(bookmarkInput.selectedSession?.id).toBe("session-1");
    expect(bookmarkState.selectedSessionBookmarks).toHaveLength(1);
    expect(bookmarkBindings.bookmarkContexts[7]?.dominantLevel).toBe("warn");
    expect(detailsInput.selectedSource?.id).toBe("repo-1");
    expect(detailsState.readyToRun).toBe(true);
    expect(detailsBindings.sessionLabelPlaceholder).toBe("production.log · Base Pulse · House");
    expect(sections.bookmarkState.selectedSessionBookmarks).toHaveLength(1);
    expect(builtSections.detailsState.readyToRun).toBe(true);
    expect(rebuiltState.selectedSession?.id).toBe("session-1");
    expect(sections.detailsState.readyToRun).toBe(true);
    expect(derived.selectedSource?.id).toBe("repo-1");
    expect(derived.selectedTrack?.id).toBe("track-1");
    expect(derived.selectedBaseDetails).toEqual({
      label: "Base Pulse",
      detail: "126 BPM",
    });
    expect(derived.activeSession?.id).toBe("session-1");
    expect(derived.selectedSession?.id).toBe("session-1");
    expect(derived.selectedSessionIdForEvents).toBe("session-1");
    expect(derived.playbackActive).toBe(false);
    expect(derived.liveMonitorActive).toBe(true);
    expect(derived.selectedSessionBookmarks).toHaveLength(1);
    expect(derived.bookmarkContexts[7]).toEqual({
      bpm: 124,
      dominantLevel: "warn",
      anomalyCount: 2,
      logExcerpt: "warn checkout",
    });
    expect(derived.sessionLabelPlaceholder).toBe("production.log · Base Pulse · House");
    expect(derived.playbackPercent).toBe(42);
    expect(derived.readyToRun).toBe(true);
    expect(derived.activeBaseDetails).toEqual({
      label: "Base Pulse",
      detail: "126 BPM",
    });
    expect(derived.selectedSessionSourceDetails).toEqual({
      label: "production.log",
      path: "/logs/production.log",
    });
  });

  it("resolves active/selected session state and bookmark contexts independently", () => {
    const sessionTwo = {
      ...session,
      id: "session-2",
      label: "Fallback session",
      sourceId: null,
      sourceTitle: null,
      sourcePath: null,
      trackId: null,
      trackTitle: null,
      playlistId: "playlist-1",
      playlistName: "Night drive",
    };

    const selection = resolveSessionSelection({
      sessions: [session, sessionTwo],
      activeSessionId: "session-1",
      selectedSessionId: "missing",
      activeSessionMode: "playback",
      monitorHasSession: true,
      tracks: [track],
      playlists: [playlist],
    });

    expect(selection.activeSession?.id).toBe("session-1");
    expect(selection.selectedSession?.id).toBe("session-1");
    expect(selection.selectedSessionIdForEvents).toBe("session-1");
    expect(selection.playbackActive).toBe(true);
    expect(selection.liveMonitorActive).toBe(false);
    expect(selection.activeBedUrl).toBeNull();

    const bookmarkState = resolveSessionBookmarkState({
      selectedSession: selection.selectedSession,
      sessionBookmarksBySessionId: {
        "session-1": [{ id: 9, eventIndex: 0 } as SessionBookmark],
      },
      selectedSessionEvents: [
        {
          suggestedBpm: 122,
          dominantLevel: "info",
          anomalyCount: 1,
          parsedLinesJson: JSON.stringify(["session resumed"]),
        },
      ] as SessionEvent[],
    });

    expect(bookmarkState.selectedSessionBookmarks).toHaveLength(1);
    expect(bookmarkState.bookmarkContexts[9]).toEqual({
      bpm: 122,
      dominantLevel: "info",
      anomalyCount: 1,
      logExcerpt: "session resumed",
    });
  });
});
