import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionReplayBookmarkPanel } from "../../../src/features/session/SessionReplayBookmarkPanel";
import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";

vi.mock("../../../src/components/ReplayFeedbackSummaryCard", () => ({
  ReplayFeedbackSummaryCard: ({ title }: { title: string }) => (
    <div data-testid="replay-summary">{title}</div>
  ),
}));

vi.mock("../../../src/features/session/SessionReplayBookmarkCard", () => ({
  SessionReplayBookmarkCard: ({ label }: { label: string }) => (
    <div data-testid="bookmark-card">{label}</div>
  ),
}));

describe("SessionReplayBookmarkPanel", () => {
  it("renders empty state when there are no bookmarks", () => {
    render(
      <I18nContext.Provider value={en}>
        <SessionReplayBookmarkPanel
          selectedSession={{ label: "Night watch", totalPolls: 3 } as never}
          selectedSessionBookmarks={[]}
          selectedSessionReplayFeedbackRecommendation={null}
          bookmarkContexts={{}}
          mutating={false}
          onReplayBookmark={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByText(en.session.replayNotes)).toBeInTheDocument();
    expect(screen.getByText(en.session.noReplayNotesSavedYet)).toBeInTheDocument();
  });

  it("renders recommendation and bookmark cards when bookmarks exist", () => {
    render(
      <I18nContext.Provider value={en}>
        <SessionReplayBookmarkPanel
          selectedSession={{ label: "Night watch", totalPolls: 3 } as never}
          selectedSessionBookmarks={
            [
              {
                id: 1,
                label: "Deploy burst",
                replayWindowIndex: 4,
                note: "Check this",
                updatedAt: "2026-06-25T00:00:00.000Z",
              },
            ] as never
          }
          selectedSessionReplayFeedbackRecommendation={{ id: "rec-1" } as never}
          bookmarkContexts={{}}
          mutating={false}
          onReplayBookmark={vi.fn()}
        />
      </I18nContext.Provider>,
    );

    expect(screen.getByTestId("replay-summary")).toHaveTextContent(en.session.recommendedMix);
    expect(screen.getByTestId("bookmark-card")).toHaveTextContent("Deploy burst");
  });
});
