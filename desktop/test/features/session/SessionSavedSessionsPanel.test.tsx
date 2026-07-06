import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionSavedSessionsPanel } from "../../../src/features/session/SessionSavedSessionsPanel";
import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";

vi.mock("../../../src/features/session/SessionSavedSessionsList", () => ({
  SessionSavedSessionsList: ({ sessions }: { sessions: Array<{ id: string }> }) => (
    <div data-testid="saved-sessions-list">{sessions.length}</div>
  ),
}));

vi.mock("../../../src/features/session/SessionReplayBookmarkPanel", () => ({
  SessionReplayBookmarkPanel: ({ selectedSession }: { selectedSession: { id: string } }) => (
    <div data-testid="replay-panel">{selectedSession.id}</div>
  ),
}));

describe("SessionSavedSessionsPanel", () => {
  it("renders saved sessions header and list", () => {
    render(
      <I18nContext.Provider value={en}>
        <SessionSavedSessionsPanel
          sessions={[{ id: "session-1" }, { id: "session-2" }] as never}
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

    expect(screen.getByText(en.session.savedSessions)).toBeInTheDocument();
    expect(
      screen.getByText(en.session.savedSessionsCount.replace("{count}", "2")),
    ).toBeInTheDocument();
    expect(screen.getByTestId("saved-sessions-list")).toHaveTextContent("2");
  });

  it("renders replay bookmark panel for a selected session", () => {
    render(
      <I18nContext.Provider value={en}>
        <SessionSavedSessionsPanel
          sessions={[{ id: "session-1" }] as never}
          loading={false}
          mutating={false}
          selectedSessionId={"session-1"}
          selectedSession={{ id: "session-1" } as never}
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

    expect(screen.getByTestId("replay-panel")).toHaveTextContent("session-1");
  });
});
