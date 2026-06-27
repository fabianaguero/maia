import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorReplaySection } from "../../src/features/analyzer/components/LiveLogMonitorReplaySection";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

function wrapper(ui: ReactNode) {
  return render(<I18nContext.Provider value={en}>{ui}</I18nContext.Provider>);
}

describe("LiveLogMonitorReplaySection", () => {
  it("renders replay controls and feedback when replay is active", () => {
    const onStepWindow = vi.fn();
    const onTogglePause = vi.fn();
    const onApplyReplayFeedbackRecommendation = vi.fn();

    wrapper(
      <LiveLogMonitorReplaySection
        replayActive
        playbackProgress={0.4}
        playbackPercent={40}
        playbackWindowLabel="12 / 30"
        isPlaybackPaused={false}
        playbackEventCount={30}
        playbackEventIndex={12}
        replaySessionId="session-1"
        activeReplayBookmark={null}
        sortedSessionBookmarks={[
          {
            id: "bookmark-1",
            sessionId: "session-1",
            replayWindowIndex: 12,
            label: "Window 12",
            note: "Interesting spike",
            bookmarkTag: "incident",
            suggestedStyleProfileId: "warehouse",
            suggestedMutationProfileId: "warning-swell",
            trackTitle: "Deck Track",
            trackSecond: 42.5,
            createdAt: "2026-06-26T10:00:00.000Z",
            updatedAt: "2026-06-26T10:00:00.000Z",
          },
        ]}
        bookmarkLabelDraft=""
        bookmarkNoteDraft=""
        bookmarkTagDraft={null}
        bookmarkStyleProfileIdDraft={null}
        bookmarkMutationProfileIdDraft={null}
        bookmarkBusy={false}
        bookmarkError={null}
        replayFeedbackRecommendation={{
          summary: "Warehouse + warning-swell fit this replay",
          detail: "Bookmark history points to a stronger anomaly contour.",
          bookmarkCount: 2,
          suggestedStyleProfileId: "warehouse",
          suggestedMutationProfileId: "warning-swell",
          dominantTagLabel: "Incident",
          tagSummaries: [{ tag: "incident", label: "Incident", count: 2 }],
          isAligned: false,
        }}
        labels={{
          sceneAlreadyAligned: "Scene already aligned",
          applyFeedbackMix: "Apply feedback mix",
        }}
        onStepWindow={onStepWindow}
        onTogglePause={onTogglePause}
        onSeekProgress={vi.fn()}
        onBookmarkLabelChange={vi.fn()}
        onBookmarkNoteChange={vi.fn()}
        onBookmarkTagToggle={vi.fn()}
        onBookmarkStyleProfileChange={vi.fn()}
        onBookmarkMutationProfileChange={vi.fn()}
        onCaptureCurrentScene={vi.fn()}
        onSaveBookmark={vi.fn()}
        onDeleteCurrentBookmark={vi.fn()}
        onJumpToBookmark={vi.fn()}
        onApplyBookmarkSuggestion={vi.fn()}
        onDeleteBookmark={vi.fn()}
        onApplyReplayFeedbackRecommendation={onApplyReplayFeedbackRecommendation}
      />,
    );

    expect(screen.getByText(en.inspect.replayTimeline)).toBeTruthy();
    expect(screen.getByText(en.inspect.replayBookmarks)).toBeTruthy();
    expect(screen.getByText("Warehouse + warning-swell fit this replay")).toBeTruthy();

    fireEvent.click(screen.getByText(en.session.nextWindow));
    fireEvent.click(screen.getByText(en.session.pauseReplay));
    fireEvent.click(screen.getByText("Apply feedback mix"));

    expect(onStepWindow).toHaveBeenCalledWith(1);
    expect(onTogglePause).toHaveBeenCalledTimes(1);
    expect(onApplyReplayFeedbackRecommendation).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when replay is inactive", () => {
    const { container } = wrapper(
      <LiveLogMonitorReplaySection
        replayActive={false}
        playbackProgress={null}
        playbackPercent={null}
        playbackWindowLabel={null}
        isPlaybackPaused={false}
        playbackEventCount={null}
        playbackEventIndex={null}
        replaySessionId={null}
        activeReplayBookmark={null}
        sortedSessionBookmarks={[]}
        bookmarkLabelDraft=""
        bookmarkNoteDraft=""
        bookmarkTagDraft={null}
        bookmarkStyleProfileIdDraft={null}
        bookmarkMutationProfileIdDraft={null}
        bookmarkBusy={false}
        bookmarkError={null}
        replayFeedbackRecommendation={null}
        labels={{
          sceneAlreadyAligned: "Scene already aligned",
          applyFeedbackMix: "Apply feedback mix",
        }}
        onStepWindow={vi.fn()}
        onTogglePause={vi.fn()}
        onSeekProgress={vi.fn()}
        onBookmarkLabelChange={vi.fn()}
        onBookmarkNoteChange={vi.fn()}
        onBookmarkTagToggle={vi.fn()}
        onBookmarkStyleProfileChange={vi.fn()}
        onBookmarkMutationProfileChange={vi.fn()}
        onCaptureCurrentScene={vi.fn()}
        onSaveBookmark={vi.fn()}
        onDeleteCurrentBookmark={vi.fn()}
        onJumpToBookmark={vi.fn()}
        onApplyBookmarkSuggestion={vi.fn()}
        onDeleteBookmark={vi.fn()}
        onApplyReplayFeedbackRecommendation={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
