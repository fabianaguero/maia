import { describe, expect, it, vi } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import {
  buildReplayBookmarkDeleteSuccessState,
  buildReplayBookmarkPersistenceDeleteError,
  buildReplayBookmarkPersistenceLoadedState,
  buildReplayBookmarkPersistenceLoadError,
  buildReplayBookmarkPersistenceNativeRuntimeError,
  buildReplayBookmarkPersistenceResetState,
  buildReplayBookmarkPersistenceResult,
} from "../../src/hooks/replayBookmarkPersistenceRuntime";

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

describe("replayBookmarkPersistenceRuntime", () => {
  it("builds reset/load/delete states and a stable result envelope", () => {
    const setSessionBookmarks = vi.fn();
    const setBookmarkBusy = vi.fn();
    const setBookmarkError = vi.fn();
    const deleteReplayBookmark = vi.fn();

    expect(buildReplayBookmarkPersistenceResetState()).toEqual({
      sessionBookmarks: [],
      bookmarkBusy: false,
      bookmarkError: null,
    });
    expect(
      buildReplayBookmarkPersistenceLoadedState([createBookmark(2, 4), createBookmark(1, 2)]).map(
        (bookmark) => bookmark.id,
      ),
    ).toEqual([1, 2]);
    expect(
      buildReplayBookmarkDeleteSuccessState([createBookmark(1, 2), createBookmark(2, 4)], 1).map(
        (bookmark) => bookmark.id,
      ),
    ).toEqual([2]);
    expect(buildReplayBookmarkPersistenceLoadError(new Error("load failed"))).toContain(
      "load failed",
    );
    expect(buildReplayBookmarkPersistenceDeleteError(new Error("delete failed"))).toContain(
      "delete failed",
    );
    expect(buildReplayBookmarkPersistenceNativeRuntimeError()).toBe(
      "Replay bookmarks require the native desktop runtime.",
    );

    const result = buildReplayBookmarkPersistenceResult({
      sessionBookmarks: [createBookmark(1, 2)],
      setSessionBookmarks,
      bookmarkBusy: true,
      setBookmarkBusy,
      bookmarkError: "boom",
      setBookmarkError,
      deleteReplayBookmark,
    });

    expect(result).toEqual({
      sessionBookmarks: [createBookmark(1, 2)],
      setSessionBookmarks,
      bookmarkBusy: true,
      setBookmarkBusy,
      bookmarkError: "boom",
      setBookmarkError,
      deleteReplayBookmark,
    });
  });
});
