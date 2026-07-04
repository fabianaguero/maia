import { describe, expect, it, vi } from "vitest";

import {
  buildSessionSavedSessionsPanelProps,
  buildSessionSetupPanelProps,
} from "../../../src/features/session/sessionScreenPanelsViewRuntime";

describe("sessionScreenPanelsViewRuntime", () => {
  it("builds setup panel props and adapts nullable selectors to child callbacks", () => {
    const onTrackSelect = vi.fn();
    const onPlaylistSelect = vi.fn();
    const onSourceSelect = vi.fn();

    const props = buildSessionSetupPanelProps({
      tracks: [],
      playlists: [],
      sourceOptions: [],
      mode: "log",
      baseMode: "track",
      selectedTemplateId: "deep-house",
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      selectedPlaylistId: null,
      selectedSource: null,
      selectedTrack: null,
      selectedPlaylist: null,
      selectedBaseLabel: null,
      selectedBaseDetail: null,
      sessionLabel: "Night watch",
      sessionLabelPlaceholder: "Session",
      creating: false,
      mutating: false,
      onTemplateSelect: vi.fn(),
      onBaseModeChange: vi.fn(),
      onTrackSelect,
      onPlaylistSelect,
      onModeChange: vi.fn(),
      onSourceSelect,
      onSessionLabelChange: vi.fn(),
      onCreateSession: vi.fn(),
    });

    props.onTrackSelect("track-2");
    props.onPlaylistSelect("playlist-1");
    props.onSourceSelect("repo-2");

    expect(onTrackSelect).toHaveBeenCalledWith("track-2");
    expect(onPlaylistSelect).toHaveBeenCalledWith("playlist-1");
    expect(onSourceSelect).toHaveBeenCalledWith("repo-2");
  });

  it("passes saved sessions panel props through unchanged", () => {
    const onSelectSession = vi.fn();
    const onResumeSession = vi.fn();
    const onPlaybackSession = vi.fn(async () => undefined);
    const onReplayBookmark = vi.fn(async () => undefined);
    const onDeleteSession = vi.fn();

    const props = buildSessionSavedSessionsPanelProps({
      sessions: [{ id: "session-1" }] as never,
      loading: false,
      mutating: true,
      selectedSessionId: "session-1",
      selectedSession: { id: "session-1" } as never,
      selectedSessionBookmarks: [],
      selectedSessionReplayFeedbackRecommendation: null,
      sessionBookmarksBySessionId: {},
      bookmarkContexts: {},
      activeSessionId: null,
      activeSessionMode: null,
      liveWindowCount: 4,
      liveProcessedLines: 48,
      liveTotalAnomalies: 2,
      onSelectSession,
      onResumeSession,
      onPlaybackSession,
      onReplayBookmark,
      onDeleteSession,
    });

    expect(props.mutating).toBe(true);
    expect(props.onSelectSession).toBe(onSelectSession);
    expect(props.onReplayBookmark).toBe(onReplayBookmark);
    expect(props.liveProcessedLines).toBe(48);
  });
});
