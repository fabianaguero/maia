import { describe, expect, it, vi } from "vitest";

import { buildSessionScreenPanelsProps } from "../../../src/features/session/sessionScreenPanelsPropsRuntime";

describe("sessionScreenPanelsPropsRuntime", () => {
  it("builds panel props and resets selected source when mode changes", () => {
    const controller = {
      mode: "log",
      baseMode: "track",
      selectedTemplateId: "deep-house",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSource: { id: "repo-1" },
      selectedTrack: { id: "track-1" },
      selectedPlaylist: null,
      selectedBaseDetails: { label: "Track A", detail: "126 BPM" },
      sessionLabel: "Night watch",
      sessionLabelPlaceholder: "Night watch",
      creating: false,
      sourceOptions: [{ id: "repo-1" }],
      selectedSession: { id: "session-1" },
      selectedSessionBookmarks: [{ id: 1 }],
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: { 1: { excerpt: "boom" } },
      monitor: {
        metrics: {
          windowCount: 4,
          processedLines: 120,
          totalAnomalies: 6,
        },
      },
      setSelectedTemplateId: vi.fn(),
      setBaseMode: vi.fn(),
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
      setMode: vi.fn(),
      setSelectedSourceId: vi.fn(),
      setSessionLabel: vi.fn(),
      handleCreateSession: vi.fn(),
      handleResumeSession: vi.fn(async () => undefined),
      handlePlaybackSession: vi.fn(async () => undefined),
      handleReplayBookmark: vi.fn(async () => undefined),
    } as never;

    const props = buildSessionScreenPanelsProps({
      tracks: [{ id: "track-1" }] as never,
      playlists: [] as never,
      sessions: [] as never,
      sessionsCount: 0,
      selectedSessionId: "session-1",
      loading: false,
      mutating: false,
      error: null,
      activeSessionId: "session-1",
      activeSessionMode: "live",
      sessionBookmarksBySessionId: { "session-1": [{ id: 1 }] } as never,
      onStopSession: vi.fn(async () => undefined),
      onDelete: vi.fn(async () => undefined),
      onSelectSession: vi.fn(),
      controller,
    });

    props.onModeChange("repo");
    expect(controller.setMode).toHaveBeenCalledWith("repo");
    expect(controller.setSelectedSourceId).toHaveBeenCalledWith(null);
  });
});
