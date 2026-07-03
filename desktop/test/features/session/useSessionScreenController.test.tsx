import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const actions = {
    handleCreateSession: vi.fn(),
    handleDirectLaunch: vi.fn(),
    handleResumeSession: vi.fn(),
    handlePlaybackSession: vi.fn(),
    handleReplayBookmark: vi.fn(),
  };

  const localState = {
    mode: "log" as const,
    setMode: vi.fn(),
    baseMode: "track" as const,
    setBaseMode: vi.fn(),
    selectedSourceId: "repo-1",
    setSelectedSourceId: vi.fn(),
    selectedTrackId: "track-1",
    setSelectedTrackId: vi.fn(),
    selectedPlaylistId: null,
    setSelectedPlaylistId: vi.fn(),
    sessionLabel: "Night watch",
    setSessionLabel: vi.fn(),
    creating: false,
    setCreating: vi.fn(),
    createError: null,
    setCreateError: vi.fn(),
    latestUpdate: null,
    setLatestUpdate: vi.fn(),
    directPath: "/logs/service.log",
    setDirectPath: vi.fn(),
    isDirectLoading: false,
    setIsDirectLoading: vi.fn(),
    selectedTemplateId: "missing-template",
    setSelectedTemplateId: vi.fn(),
    selectedSessionEvents: [],
    setSelectedSessionEvents: vi.fn(),
    boothBedAudioRef: { current: null },
  };

  const derivedState = {
    sourceOptions: [{ id: "repo-1" }],
    selectedSource: {
      id: "repo-1",
      title: "orders-service",
      sourcePath: "/logs/orders-service.log",
      suggestedBpm: 126,
    },
    selectedTrack: { id: "track-1", title: "Track One" },
    selectedPlaylist: null,
    selectedBaseDetails: { label: "Deck A", detail: "126 BPM" },
    activeSession: null,
    selectedSession: { id: "session-1" },
    selectedSessionIdForEvents: "session-1",
    playbackActive: true,
    liveMonitorActive: false,
    activeBedUrl: "file:///bed.wav",
    selectedSessionBookmarks: [{ id: "bookmark-1" }],
    bookmarkContexts: [{ id: "bookmark-1", label: "Alert" }],
    sessionLabelPlaceholder: "Session placeholder",
    playbackPercent: 48,
    readyToRun: true,
    activeBaseDetails: { label: "Deck A", detail: "126 BPM" },
    selectedSessionBaseDetails: { label: "Deck A", detail: "126 BPM" },
    activeSourceDetails: { label: "orders-service", path: "/logs/orders-service.log" },
    selectedSessionSourceDetails: { label: "orders-service", path: "/logs/orders-service.log" },
  };

  const monitor = {
    session: { sessionId: "monitor-1" },
    metrics: {
      windowCount: 2,
      processedLines: 64,
      totalAnomalies: 5,
    },
    subscribe: vi.fn(() => vi.fn()),
    isPlaybackPaused: false,
    playbackEventIndex: 3,
    playbackEventCount: 12,
  };

  return {
    actions,
    localState,
    derivedState,
    monitor,
    recommendation: { summary: "Keep this groove" },
    boothViewModel: { headline: "Session live" },
    useSessionScreenEffects: vi.fn(),
  };
});

vi.mock("../../../src/i18n/I18nContext", () => ({
  useT: () => ({
    session: {
      sessionPlaceholder: "Session placeholder",
    },
  }),
}));

vi.mock("../../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => mocks.monitor,
}));

vi.mock("../../../src/hooks/useReplayFeedbackRecommendation", () => ({
  useReplayFeedbackRecommendation: () => mocks.recommendation,
}));

vi.mock("../../../src/features/session/useSessionScreenLocalState", () => ({
  useSessionScreenLocalState: () => mocks.localState,
}));

vi.mock("../../../src/features/session/useSessionScreenActions", () => ({
  useSessionScreenActions: () => mocks.actions,
}));

vi.mock("../../../src/features/session/useSessionScreenEffects", () => ({
  useSessionScreenEffects: mocks.useSessionScreenEffects,
}));

vi.mock("../../../src/features/session/sessionScreenRuntime", async () => {
  const actual = await vi.importActual("../../../src/features/session/sessionScreenRuntime");
  return {
    ...actual,
    resolveSessionControllerDerivedState: () => mocks.derivedState,
  };
});

vi.mock("../../../src/features/session/sessionBoothViewModel", () => ({
  buildSessionBoothViewModel: () => mocks.boothViewModel,
}));

import { useSessionScreenController } from "../../../src/features/session/useSessionScreenController";

describe("useSessionScreenController", () => {
  it("assembles monitor snapshot, derived session state, and booth view-model", () => {
    const input = {
      tracks: [{ id: "track-1" }],
      playlists: [],
      repositories: [{ id: "repo-1", title: "orders-service" }],
      sessions: [{ id: "session-1" }],
      sessionBookmarksBySessionId: { "session-1": [] },
      selectedSessionId: "session-1",
      activeSessionId: "session-1",
      activeSessionMode: "playback" as const,
      activePlaybackProgress: 0.48,
      onStartSession: vi.fn(),
      onResume: vi.fn(),
      onPlayback: vi.fn(),
      onReplayBookmark: vi.fn(),
      onSelectSession: vi.fn(),
    } as never;

    const { result } = renderHook(() => useSessionScreenController(input));

    expect(mocks.useSessionScreenEffects).toHaveBeenCalledWith(
      expect.objectContaining({
        monitorSessionId: "monitor-1",
        selectedSessionIdForEvents: "session-1",
        activeBedUrl: "file:///bed.wav",
      }),
    );
    expect(result.current.mode).toBe("log");
    expect(result.current.baseMode).toBe("track");
    expect(result.current.selectedSource).toBe(mocks.derivedState.selectedSource);
    expect(result.current.selectedSessionReplayFeedbackRecommendation).toBe(mocks.recommendation);
    expect(result.current.booth).toBe(mocks.boothViewModel);
    expect(result.current.handleCreateSession).toBe(mocks.actions.handleCreateSession);
    expect(result.current.readyToRun).toBe(true);
  });
});
