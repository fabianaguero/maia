import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveMonitorReplayBookmarksCard } from "../../src/features/analyzer/components/LiveMonitorReplayBookmarksCard";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

function renderCard(overrides: Partial<Parameters<typeof LiveMonitorReplayBookmarksCard>[0]> = {}) {
  const props: Parameters<typeof LiveMonitorReplayBookmarksCard>[0] = {
    replayWindowIndex: 4,
    activeReplayBookmark: null,
    sortedSessionBookmarks: [],
    playbackEventCount: 12,
    bookmarkLabelDraft: "Window 4",
    bookmarkNoteDraft: "Good transition",
    bookmarkTagDraft: null,
    bookmarkStyleProfileIdDraft: null,
    bookmarkMutationProfileIdDraft: null,
    bookmarkBusy: false,
    bookmarkError: null,
    onBookmarkLabelChange: vi.fn(),
    onBookmarkNoteChange: vi.fn(),
    onBookmarkTagToggle: vi.fn(),
    onBookmarkStyleProfileChange: vi.fn(),
    onBookmarkMutationProfileChange: vi.fn(),
    onCaptureCurrentScene: vi.fn(),
    onSaveBookmark: vi.fn(),
    onDeleteCurrentBookmark: vi.fn(),
    onJumpToBookmark: vi.fn(),
    onApplyBookmarkSuggestion: vi.fn(),
    onDeleteBookmark: vi.fn(),
    ...overrides,
  };

  render(
    <I18nContext.Provider value={en}>
      <LiveMonitorReplayBookmarksCard {...props} />
    </I18nContext.Provider>,
  );

  return props;
}

describe("LiveMonitorReplayBookmarksCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty bookmark state and save controls", () => {
    renderCard();

    expect(screen.getByText(en.inspect.replayBookmarks)).toBeTruthy();
    expect(screen.getByDisplayValue("Window 4")).toBeTruthy();
    expect(screen.getByRole("button", { name: en.inspect.saveWindowNote })).toBeTruthy();
    expect(screen.getByText(en.inspect.noReplayBookmarks)).toBeTruthy();
  });

  it("renders saved bookmarks and forwards actions", () => {
    const onJumpToBookmark = vi.fn();
    const onApplyBookmarkSuggestion = vi.fn();
    const onDeleteBookmark = vi.fn();
    const bookmark = {
      id: 1,
      sessionId: "session-1",
      replayWindowIndex: 4,
      eventIndex: 12,
      label: "Deploy transition",
      note: "",
      bookmarkTag: "deploy-transition",
      suggestedStyleProfileId: "alert-techno",
      suggestedMutationProfileId: "reactive",
      trackId: "track-1",
      trackTitle: "Donna Summer",
      trackSecond: 42.13,
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedAt: "2026-07-03T00:00:00.000Z",
    };

    renderCard({
      activeReplayBookmark: bookmark,
      sortedSessionBookmarks: [bookmark],
      onJumpToBookmark,
      onApplyBookmarkSuggestion,
      onDeleteBookmark,
    });

    expect(screen.getAllByText("Deploy transition").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alert Techno").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reactive").length).toBeGreaterThan(0);
    expect(screen.getByText("Donna Summer")).toBeTruthy();
    expect(screen.getByText("42.13s")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Load scene/i }));
    fireEvent.click(screen.getByRole("button", { name: /Delete replay bookmark/i }));

    expect(onApplyBookmarkSuggestion).toHaveBeenCalledWith(bookmark);
    expect(onDeleteBookmark).toHaveBeenCalledWith(bookmark);
  });
});
