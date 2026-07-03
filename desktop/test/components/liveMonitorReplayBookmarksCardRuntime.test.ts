import { describe, expect, it } from "vitest";

import {
  canApplyReplayBookmarkSuggestion,
  resolveReplayBookmarkCardTitle,
  resolveReplayBookmarkSaveLabel,
} from "../../src/features/analyzer/components/liveMonitorReplayBookmarksCardRuntime";

describe("liveMonitorReplayBookmarksCardRuntime", () => {
  it("resolves title from saved state", () => {
    expect(
      resolveReplayBookmarkCardTitle({
        activeReplayBookmark: null,
        replayWindowIndex: 4,
        savedLabel: "Saved {window}",
        unsavedLabel: "Mark {window}",
      }),
    ).toBe("Mark 4");
  });

  it("resolves save CTA state", () => {
    expect(
      resolveReplayBookmarkSaveLabel({
        bookmarkBusy: true,
        activeReplayBookmark: null,
        savingLabel: "Saving",
        updateLabel: "Update",
        createLabel: "Save",
      }),
    ).toBe("Saving");
  });

  it("detects bookmark suggestions", () => {
    expect(
      canApplyReplayBookmarkSuggestion({
        id: 1,
        sessionId: "session-1",
        replayWindowIndex: 4,
        eventIndex: null,
        label: "Bookmark",
        note: "",
        bookmarkTag: null,
        suggestedStyleProfileId: null,
        suggestedMutationProfileId: "reactive",
        trackId: null,
        trackTitle: null,
        trackSecond: null,
        createdAt: "",
        updatedAt: "",
      }),
    ).toBe(true);
  });
});
