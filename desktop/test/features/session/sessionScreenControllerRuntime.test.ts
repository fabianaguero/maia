import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SOURCE_TEMPLATE_ID } from "../../../src/config/sourceTemplates";
import { en } from "../../../src/i18n/en";
import {
  buildSessionBoothInput,
  buildSessionControllerDerivedCollections,
  buildSessionControllerDerivedInput,
  buildSessionControllerDerivedSelectionInput,
  buildSessionScreenActionsInput,
  buildSessionScreenControllerState,
  resolveInitialSessionBaseMode,
  resolveSessionScreenSelectedTemplateId,
  resolveSessionScreenTemplateSelection,
} from "../../../src/features/session/sessionScreenControllerRuntime";

describe("sessionScreenControllerRuntime", () => {
  it("resolves base mode and default template id deterministically", () => {
    expect(resolveInitialSessionBaseMode(1)).toBe("track");
    expect(resolveInitialSessionBaseMode(0)).toBe("playlist");
    expect(resolveSessionScreenSelectedTemplateId(undefined)).toBe(DEFAULT_SOURCE_TEMPLATE_ID);
    expect(resolveSessionScreenSelectedTemplateId(null)).toBe(DEFAULT_SOURCE_TEMPLATE_ID);
    expect(resolveSessionScreenSelectedTemplateId("custom")).toBe("custom");
  });

  it("resolves template presentation and preserves the public controller contract", () => {
    expect(
      resolveSessionScreenTemplateSelection({
        selectedTemplateId: DEFAULT_SOURCE_TEMPLATE_ID,
        t: en,
      }).selectedTemplate,
    ).toBeTruthy();

    const state = buildSessionScreenControllerState({
      t: en,
      monitor: {},
      mode: "log",
      setMode: vi.fn(),
      baseMode: "track",
      setBaseMode: vi.fn(),
      selectedSourceId: null,
      setSelectedSourceId: vi.fn(),
      selectedTrackId: null,
      setSelectedTrackId: vi.fn(),
      selectedPlaylistId: null,
      setSelectedPlaylistId: vi.fn(),
      sessionLabel: "",
      setSessionLabel: vi.fn(),
      creating: false,
      createError: null,
      latestUpdate: null,
      directPath: "",
      setDirectPath: vi.fn(),
      isDirectLoading: false,
      selectedTemplateId: DEFAULT_SOURCE_TEMPLATE_ID,
      setSelectedTemplateId: vi.fn(),
      sourceOptions: [],
      selectedSource: null,
      selectedTrack: null,
      selectedPlaylist: null,
      selectedBaseDetails: {},
      handleCreateSession: vi.fn(async () => undefined),
      handleDirectLaunch: vi.fn(async () => undefined),
      handleResumeSession: vi.fn(async () => undefined),
      handlePlaybackSession: vi.fn(async () => undefined),
      handleReplayBookmark: vi.fn(async () => undefined),
      activeSession: null,
      selectedSession: null,
      playbackActive: false,
      liveMonitorActive: false,
      selectedSessionBookmarks: [],
      bookmarkContexts: [],
      selectedSessionReplayFeedbackRecommendation: null,
      sessionLabelPlaceholder: "placeholder",
      readyToRun: false,
      booth: {},
    });

    expect(state.mode).toBe("log");
    expect(state.selectedTemplateId).toBe(DEFAULT_SOURCE_TEMPLATE_ID);
    expect(state.sessionLabelPlaceholder).toBe("placeholder");
  });

  it("builds action, derived and booth inputs without mutating payloads", () => {
    const actionInput = buildSessionScreenActionsInput({
      t: en,
      baseMode: "track",
      mode: "log",
      repositories: [] as never,
      sessions: [] as never,
      selectedPlaylistId: null,
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionLabel: "Night watch",
      directPath: "/logs/direct.log",
      onStartSession: vi.fn(async () => true),
      onResume: vi.fn(),
      onPlayback: vi.fn(async () => true),
      onReplayBookmark: vi.fn(async () => true),
      onSelectSession: vi.fn(),
      setCreateError: vi.fn(),
      setCreating: vi.fn(),
      setIsDirectLoading: vi.fn(),
      setSessionLabel: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setDirectPath: vi.fn(),
    });
    expect(actionInput.selectedSourceId).toBe("repo-1");

    const derivedInput = buildSessionControllerDerivedInput({
      controllerInput: {
        tracks: [] as never,
        playlists: [] as never,
        repositories: [] as never,
        sessions: [] as never,
        sessionBookmarksBySessionId: {},
        selectedSessionId: null,
        activeSessionId: null,
        activeSessionMode: null,
        activePlaybackProgress: null,
        onStartSession: vi.fn(async () => true),
        onResume: vi.fn(),
        onPlayback: vi.fn(async () => true),
        onReplayBookmark: vi.fn(async () => true),
        onSelectSession: vi.fn(),
      },
      activePlaybackProgress: null,
      activeSessionId: null,
      activeSessionMode: null,
      baseMode: "track",
      mode: "log",
      monitorHasSession: false,
      selectedPlaylistId: null,
      selectedSessionEvents: [],
      selectedSourceId: null,
      selectedTrackId: null,
      sessionPlaceholderFallback: "Session",
      templateGenre: null,
      templateLabel: null,
    });
    const derivedCollections = buildSessionControllerDerivedCollections({
      tracks: [] as never,
      playlists: [] as never,
      repositories: [] as never,
      sessions: [] as never,
      sessionBookmarksBySessionId: {},
      selectedSessionId: null,
      activeSessionId: null,
      activeSessionMode: null,
      activePlaybackProgress: null,
      onStartSession: vi.fn(async () => true),
      onResume: vi.fn(),
      onPlayback: vi.fn(async () => true),
      onReplayBookmark: vi.fn(async () => true),
      onSelectSession: vi.fn(),
    });
    const derivedSelection = buildSessionControllerDerivedSelectionInput({
      controllerInput: {
        tracks: [] as never,
        playlists: [] as never,
        repositories: [] as never,
        sessions: [] as never,
        sessionBookmarksBySessionId: {},
        selectedSessionId: null,
        activeSessionId: null,
        activeSessionMode: null,
        activePlaybackProgress: null,
        onStartSession: vi.fn(async () => true),
        onResume: vi.fn(),
        onPlayback: vi.fn(async () => true),
        onReplayBookmark: vi.fn(async () => true),
        onSelectSession: vi.fn(),
      },
      activePlaybackProgress: null,
      activeSessionId: null,
      activeSessionMode: null,
      baseMode: "track",
      mode: "log",
      monitorHasSession: false,
      selectedPlaylistId: null,
      selectedSessionEvents: [],
      selectedSourceId: null,
      selectedTrackId: null,
      sessionPlaceholderFallback: "Session",
      templateGenre: null,
      templateLabel: null,
    });
    expect(derivedInput.mode).toBe("log");
    expect(derivedCollections.selectedSessionId).toBeNull();
    expect(derivedSelection.mode).toBe("log");

    const boothInput = buildSessionBoothInput({
      t: en,
      mode: "log",
      latestUpdate: null,
      playbackActive: false,
      liveMonitorActive: false,
      readyToRun: false,
      playbackPercent: null,
      activeSession: null,
      selectedSourceTitle: null,
      selectedSourcePath: null,
      selectedSourceSuggestedBpm: null,
      selectedSessionSourceLabel: null,
      selectedSessionSourcePath: null,
      selectedBaseLabel: null,
      selectedBaseDetail: null,
      selectedSessionBaseLabel: null,
      selectedSessionBaseDetail: null,
      activeBaseLabel: null,
      activeBaseDetail: null,
      activeSourceLabel: null,
      activeSourcePath: null,
      monitorSession: null,
      monitorMetrics: { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
      isPlaybackPaused: false,
      playbackEventIndex: null,
      playbackEventCount: null,
    });
    expect(boothInput.mode).toBe("log");
  });
});
