import { describe, expect, it } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import {
  buildReplayBookmarkDeleteErrorMessage,
  buildReplayBookmarkLoadErrorMessage,
  buildReplayBookmarkNativeRuntimeError,
  buildReplayBookmarkSaveErrorMessage,
  buildReplayBookmarkUpsertInput,
  buildReplayBookmarkDraftState,
  canSaveReplayBookmark,
  resolveReplayBookmarkSaveContext,
  removeReplayBookmark,
  resolveActiveReplayBookmark,
  sortReplayBookmarks,
  toReplayBookmarkErrorMessage,
  upsertSortedReplayBookmark,
} from "../../src/hooks/replayBookmarksRuntime";

function createBookmark(
  id: number,
  replayWindowIndex: number,
  overrides: Partial<SessionBookmark> = {},
): SessionBookmark {
  return {
    id,
    sessionId: "session-1",
    replayWindowIndex,
    eventIndex: null,
    label: `Window ${replayWindowIndex}`,
    note: "",
    bookmarkTag: null,
    suggestedStyleProfileId: "style-a",
    suggestedMutationProfileId: "mutation-a",
    trackId: null,
    trackTitle: null,
    trackSecond: null,
    createdAt: "2026-06-25T10:00:00.000Z",
    updatedAt: "2026-06-25T10:00:00.000Z",
    ...overrides,
  };
}

describe("replayBookmarksRuntime", () => {
  it("sorts and resolves the active replay bookmark", () => {
    const bookmarks = [createBookmark(2, 4), createBookmark(1, 2)];

    expect(sortReplayBookmarks(bookmarks).map((entry) => entry.id)).toEqual([1, 2]);
    expect(resolveActiveReplayBookmark(bookmarks, true, 4)?.id).toBe(2);
    expect(resolveActiveReplayBookmark(bookmarks, false, 4)).toBeNull();
  });

  it("builds draft state from active bookmark or defaults", () => {
    expect(
      buildReplayBookmarkDraftState({
        activeReplayBookmark: null,
        replayActive: false,
        replayWindowIndex: null,
        selectedStyleProfileId: "style-a",
        selectedMutationProfileId: "mutation-a",
      }),
    ).toEqual({
      label: "",
      note: "",
      tag: null,
      styleProfileId: null,
      mutationProfileId: null,
    });

    expect(
      buildReplayBookmarkDraftState({
        activeReplayBookmark: null,
        replayActive: true,
        replayWindowIndex: 5,
        selectedStyleProfileId: "style-b",
        selectedMutationProfileId: "mutation-b",
      }),
    ).toEqual({
      label: "Window 5",
      note: "",
      tag: null,
      styleProfileId: "style-b",
      mutationProfileId: "mutation-b",
    });
  });

  it("upserts, removes and normalizes replay bookmark errors", () => {
    const current = [createBookmark(1, 1), createBookmark(2, 2)];
    const saved = createBookmark(3, 2, { label: "Updated" });

    expect(upsertSortedReplayBookmark(current, saved).map((entry) => entry.id)).toEqual([1, 3]);
    expect(removeReplayBookmark(current, 1).map((entry) => entry.id)).toEqual([2]);
    expect(canSaveReplayBookmark("session-1", 2)).toBe(true);
    expect(canSaveReplayBookmark(null, 2)).toBe(false);
    expect(canSaveReplayBookmark("session-1", null)).toBe(false);
    expect(resolveReplayBookmarkSaveContext("session-1", 2)).toEqual({
      replaySessionId: "session-1",
      replayWindowIndex: 2,
    });
    expect(resolveReplayBookmarkSaveContext(null, 2)).toBeNull();
    expect(buildReplayBookmarkNativeRuntimeError()).toBe(
      "Replay bookmarks require the native desktop runtime.",
    );
    expect(buildReplayBookmarkLoadErrorMessage(new Error("load boom"))).toContain("load boom");
    expect(buildReplayBookmarkSaveErrorMessage(new Error("save boom"))).toContain("save boom");
    expect(buildReplayBookmarkDeleteErrorMessage(new Error("delete boom"))).toContain(
      "delete boom",
    );
    expect(toReplayBookmarkErrorMessage(new Error("boom"))).toBe("boom");
    expect(toReplayBookmarkErrorMessage("failed")).toBe("failed");
    expect(toReplayBookmarkErrorMessage({})).toBe("Unexpected replay bookmark failure.");
  });

  it("builds the bookmark upsert payload from replay and fallback context", () => {
    expect(
      buildReplayBookmarkUpsertInput({
        replaySessionId: "session-9",
        replayWindowIndex: 4,
        bookmarkLabelDraft: "  ",
        bookmarkNoteDraft: "  note  ",
        bookmarkTagDraft: "alert",
        bookmarkStyleProfileIdDraft: "style-z",
        bookmarkMutationProfileIdDraft: "mutation-z",
        currentReplayExplanation: {
          eventIndex: 6,
          trackId: "track-live",
          trackTitle: "Live Track",
          trackSecond: 64,
        },
        fallbackTrackId: "track-fallback",
        fallbackTrackTitle: "Fallback",
        fallbackTrackSecond: 21,
      }),
    ).toEqual({
      sessionId: "session-9",
      replayWindowIndex: 4,
      eventIndex: 6,
      label: "Window 4",
      note: "note",
      bookmarkTag: "alert",
      suggestedStyleProfileId: "style-z",
      suggestedMutationProfileId: "mutation-z",
      trackId: "track-live",
      trackTitle: "Live Track",
      trackSecond: 64,
    });
  });
});
