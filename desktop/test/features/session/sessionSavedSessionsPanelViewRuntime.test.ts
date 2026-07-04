import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionReplayBookmarkPanelProps,
  buildSessionSavedSessionsListProps,
  buildSessionSavedSessionsPanelHeader,
} from "../../../src/features/session/sessionSavedSessionsPanelViewRuntime";

describe("sessionSavedSessionsPanelViewRuntime", () => {
  it("builds localized header copy", () => {
    const header = buildSessionSavedSessionsPanelHeader({
      t: en,
      sessionsCount: 3,
    });

    expect(header.title).toBe(en.session.savedSessions);
    expect(header.summary).toContain("3");
  });

  it("composes list and replay props without reshaping callbacks", () => {
    const onSelectSession = vi.fn();
    const onResumeSession = vi.fn();
    const onPlaybackSession = vi.fn();
    const onDeleteSession = vi.fn();
    const onReplayBookmark = vi.fn();

    const listProps = buildSessionSavedSessionsListProps({
      t: en,
      sessions: [{ id: "session-1" }] as never,
      loading: false,
      mutating: false,
      selectedSessionId: "session-1",
      activeSessionId: null,
      activeSessionMode: null,
      sessionBookmarksBySessionId: {},
      liveWindowCount: 2,
      liveProcessedLines: 24,
      liveTotalAnomalies: 1,
      onSelectSession,
      onResumeSession,
      onPlaybackSession,
      onDeleteSession,
    });
    const replayProps = buildSessionReplayBookmarkPanelProps({
      selectedSession: { id: "session-1" } as never,
      selectedSessionBookmarks: [{ id: 1 }] as never,
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: {},
      mutating: false,
      onReplayBookmark,
    });

    expect(listProps.emptyLabel).toBe(en.session.noSessions);
    expect(listProps.loadingLabel).toBe(en.session.loading);
    expect(listProps.onSelectSession).toBe(onSelectSession);
    expect(replayProps.selectedSession.id).toBe("session-1");
    expect(replayProps.onReplayBookmark).toBe(onReplayBookmark);
  });
});
