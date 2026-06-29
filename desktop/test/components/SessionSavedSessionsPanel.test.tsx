import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionSavedSessionsPanel } from "../../src/features/session/SessionSavedSessionsPanel";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { PersistedSession, SessionBookmark } from "../../src/api/sessions";

afterEach(() => {
  cleanup();
});

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
    createdAt: "2026-06-25T00:00:00.000Z",
    updatedAt: "2026-06-25T00:00:00.000Z",
    sourceTemplateId: "deep-house",
  };
}

function createBookmark(): SessionBookmark {
  return {
    id: 1,
    sessionId: "session-1",
    replayWindowIndex: 7,
    eventIndex: 7,
    label: "Deploy spike",
    note: "Alert texture",
    bookmarkTag: "good-alerting",
    suggestedStyleProfileId: "alert-techno",
    suggestedMutationProfileId: "reactive",
    trackId: "track-1",
    trackTitle: "Base Pulse",
    trackSecond: 42.5,
    createdAt: "2026-06-25T00:00:00.000Z",
    updatedAt: "2026-06-25T00:00:00.000Z",
  };
}

describe("SessionSavedSessionsPanel", () => {
  it("renders loading and empty states", () => {
    const { rerender } = render(
      <I18nContext.Provider value={en}>
        <SessionSavedSessionsPanel
          sessions={[]}
          loading
          mutating={false}
          selectedSessionId={null}
          selectedSession={null}
          selectedSessionBookmarks={[]}
          selectedSessionReplayFeedbackRecommendation={null}
          sessionBookmarksBySessionId={{}}
          bookmarkContexts={{}}
          activeSessionId={null}
          activeSessionMode={null}
          liveWindowCount={0}
          liveProcessedLines={0}
          liveTotalAnomalies={0}
          onSelectSession={vi.fn()}
          onResumeSession={vi.fn()}
          onPlaybackSession={vi.fn()}
          onReplayBookmark={vi.fn()}
          onDeleteSession={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByText(en.session.loading)).toBeInTheDocument();

    rerender(
      <I18nContext.Provider value={en}>
        <SessionSavedSessionsPanel
          sessions={[]}
          loading={false}
          mutating={false}
          selectedSessionId={null}
          selectedSession={null}
          selectedSessionBookmarks={[]}
          selectedSessionReplayFeedbackRecommendation={null}
          sessionBookmarksBySessionId={{}}
          bookmarkContexts={{}}
          activeSessionId={null}
          activeSessionMode={null}
          liveWindowCount={0}
          liveProcessedLines={0}
          liveTotalAnomalies={0}
          onSelectSession={vi.fn()}
          onResumeSession={vi.fn()}
          onPlaybackSession={vi.fn()}
          onReplayBookmark={vi.fn()}
          onDeleteSession={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByText(en.session.noSessions)).toBeInTheDocument();
  });

  it("renders saved metrics and allows playback", async () => {
    const session = createSession();
    const onPlaybackSession = vi.fn(async () => undefined);

    render(
      <I18nContext.Provider value={en}>
        <SessionSavedSessionsPanel
          sessions={[session]}
          loading={false}
          mutating={false}
          selectedSessionId="session-1"
          selectedSession={session}
          selectedSessionBookmarks={[createBookmark()]}
          selectedSessionReplayFeedbackRecommendation={null}
          sessionBookmarksBySessionId={{ "session-1": [createBookmark()] }}
          bookmarkContexts={{ 1: { bpm: 126, dominantLevel: "warn", anomalyCount: 3, logExcerpt: "timeout" } }}
          activeSessionId={null}
          activeSessionMode={null}
          liveWindowCount={0}
          liveProcessedLines={0}
          liveTotalAnomalies={0}
          onSelectSession={vi.fn()}
          onResumeSession={vi.fn()}
          onPlaybackSession={onPlaybackSession}
          onReplayBookmark={vi.fn()}
          onDeleteSession={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getAllByText("Night watch").length).toBeGreaterThan(0);
    expect(screen.getByText(/1 replay note/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /playback/i }));

    await waitFor(() => {
      expect(onPlaybackSession).toHaveBeenCalledWith(expect.objectContaining({ id: "session-1" }));
    });
  });

  it("omits the bookmark panel when no session is selected", () => {
    const session = createSession();

    render(
      <I18nContext.Provider value={en}>
        <SessionSavedSessionsPanel
          sessions={[session]}
          loading={false}
          mutating={false}
          selectedSessionId={null}
          selectedSession={null}
          selectedSessionBookmarks={[]}
          selectedSessionReplayFeedbackRecommendation={null}
          sessionBookmarksBySessionId={{ "session-1": [createBookmark()] }}
          bookmarkContexts={{}}
          activeSessionId="session-1"
          activeSessionMode="playback"
          liveWindowCount={4}
          liveProcessedLines={120}
          liveTotalAnomalies={6}
          onSelectSession={vi.fn()}
          onResumeSession={vi.fn()}
          onPlaybackSession={vi.fn()}
          onReplayBookmark={vi.fn()}
          onDeleteSession={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getAllByText("Night watch").length).toBeGreaterThan(0);
    expect(screen.queryByText(/deploy spike/i)).not.toBeInTheDocument();
  });
});
