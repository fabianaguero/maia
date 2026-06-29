import { describe, expect, it, vi } from "vitest";

import { buildSessionScreenViewModel } from "../../../src/features/session/sessionScreenViewModel";

describe("sessionScreenViewModel", () => {
  it("assembles booth and panel props from the controller state", async () => {
    const onStopSession = vi.fn(async () => undefined);
    const onDelete = vi.fn(async (_sessionId: string) => undefined);
    const onSelectSession = vi.fn();
    const controller = {
      activeSession: { id: "session-1" },
      createError: "create failed",
      playbackActive: false,
      liveMonitorActive: true,
      creating: false,
      readyToRun: true,
      mode: "log",
      latestUpdate: { hasData: true },
      monitor: {
        session: { sessionId: "runtime-1" },
        isPlaybackPaused: false,
        stepPlaybackWindow: vi.fn(),
        resumePlayback: vi.fn(),
        pausePlayback: vi.fn(),
        metrics: {
          windowCount: 4,
          processedLines: 120,
          totalAnomalies: 6,
        },
        sessions: [{ id: "session-1" }],
      },
      directPath: "/logs/app.log",
      isDirectLoading: false,
      selectedSession: { id: "session-1" },
      setDirectPath: vi.fn(),
      handleDirectLaunch: vi.fn(),
      handleResumeSession: vi.fn(async (_sessionId: string) => undefined),
      handlePlaybackSession: vi.fn(async (_session: unknown) => undefined),
      handleCreateSession: vi.fn(),
      selectedTemplateId: "deep-house",
      baseMode: "track",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSource: { id: "repo-1" },
      selectedTrack: { id: "track-1" },
      selectedPlaylist: null,
      selectedBaseDetails: { label: "Track A", detail: "126 BPM" },
      sessionLabel: "Night watch",
      sessionLabelPlaceholder: "Night watch",
      sourceOptions: [{ id: "repo-1" }],
      selectedSessionBookmarks: [{ id: 1 }],
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: { 1: { excerpt: "boom" } },
      setSelectedTemplateId: vi.fn(),
      setBaseMode: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setMode: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSessionLabel: vi.fn(),
      handleReplayBookmark: vi.fn(async () => undefined),
    } as never;

    const viewModel = buildSessionScreenViewModel({
      sessionsCount: 3,
      selectedSessionId: "session-1",
      loading: false,
      mutating: false,
      error: "tail offline",
      activeSessionId: "session-1",
      activeSessionMode: "live",
      tracks: [{ id: "track-1" }] as never,
      playlists: [] as never,
      sessionBookmarksBySessionId: { "session-1": [{ id: 1 }] } as never,
      onStopSession,
      onDelete,
      onSelectSession,
      controller,
    });

    expect(viewModel.headerProps.sessionsCount).toBe(3);
    expect(viewModel.noticeProps).toEqual({
      error: "tail offline",
      createError: "create failed",
    });
    expect(viewModel.boothProps.monitorSessionId).toBe("runtime-1");
    expect(viewModel.panelsProps.liveTotalAnomalies).toBe(6);

    viewModel.panelsProps.onModeChange("repo");
    expect(controller.setMode).toHaveBeenCalledWith("repo");
    expect(controller.setSelectedSourceId).toHaveBeenCalledWith(null);

    await viewModel.boothProps.onReplaySelected();
    expect(controller.handlePlaybackSession).toHaveBeenCalledWith({ id: "session-1" });

    viewModel.boothProps.onStopSession();
    expect(onStopSession).toHaveBeenCalled();
  });

  it("skips replay when no selected session is available", async () => {
    const controller = {
      activeSession: null,
      createError: null,
      playbackActive: false,
      liveMonitorActive: false,
      creating: false,
      readyToRun: false,
      mode: "log",
      latestUpdate: null,
      monitor: {
        session: null,
        isPlaybackPaused: false,
        stepPlaybackWindow: vi.fn(),
        resumePlayback: vi.fn(),
        pausePlayback: vi.fn(),
        metrics: {
          windowCount: 0,
          processedLines: 0,
          totalAnomalies: 0,
        },
      },
      directPath: "",
      isDirectLoading: false,
      selectedSession: null,
      setDirectPath: vi.fn(),
      handleDirectLaunch: vi.fn(),
      handleResumeSession: vi.fn(async (_sessionId: string) => undefined),
      handlePlaybackSession: vi.fn(async (_session: unknown) => undefined),
      handleCreateSession: vi.fn(),
      selectedTemplateId: "deep-house",
      baseMode: "track",
      selectedSourceId: null,
      selectedTrackId: null,
      selectedPlaylistId: null,
      selectedSource: null,
      selectedTrack: null,
      selectedPlaylist: null,
      selectedBaseDetails: { label: null, detail: null },
      sessionLabel: "",
      sessionLabelPlaceholder: "Session",
      sourceOptions: [],
      selectedSessionBookmarks: [],
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: {},
      setSelectedTemplateId: vi.fn(),
      setBaseMode: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setMode: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSessionLabel: vi.fn(),
      handleReplayBookmark: vi.fn(async () => undefined),
    } as never;

    const viewModel = buildSessionScreenViewModel({
      sessionsCount: 0,
      selectedSessionId: null,
      loading: false,
      mutating: false,
      error: null,
      activeSessionId: null,
      activeSessionMode: null,
      tracks: [] as never,
      playlists: [] as never,
      sessions: [] as never,
      sessionBookmarksBySessionId: {},
      onStopSession: vi.fn(async () => undefined),
      onDelete: vi.fn(async (_sessionId: string) => undefined),
      onSelectSession: vi.fn(),
      controller,
    });

    await expect(viewModel.boothProps.onReplaySelected()).resolves.toBeUndefined();
    expect(controller.handlePlaybackSession).not.toHaveBeenCalled();
  });
});
