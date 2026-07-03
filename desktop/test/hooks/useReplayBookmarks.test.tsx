import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import { useReplayBookmarks } from "../../src/hooks/useReplayBookmarks";

const sessionsApiMock = vi.hoisted(() => ({
  deleteSessionBookmark: vi.fn(),
  listSessionBookmarks: vi.fn(),
  upsertSessionBookmark: vi.fn(),
}));

vi.mock("../../src/api/sessions", () => sessionsApiMock);

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

function renderReplayBookmarksHook() {
  return renderHook(() =>
    useReplayBookmarks({
      replaySessionId: "session-1",
      replayActive: true,
      replayWindowIndex: 2,
      selectedStyleProfileId: "style-a",
      selectedMutationProfileId: "mutation-a",
      currentReplayExplanation: {
        eventIndex: 7,
        trackId: "track-1",
        trackTitle: "Track 1",
        trackSecond: 42,
      },
      fallbackTrackId: "track-fallback",
      fallbackTrackTitle: "Fallback",
      fallbackTrackSecond: 21,
    }),
  );
}

function renderReplayBookmarksHookWithOverrides(
  overrides: Partial<Parameters<typeof useReplayBookmarks>[0]>,
) {
  return renderHook(() =>
    useReplayBookmarks({
      replaySessionId: "session-1",
      replayActive: true,
      replayWindowIndex: 2,
      selectedStyleProfileId: "style-a",
      selectedMutationProfileId: "mutation-a",
      currentReplayExplanation: {
        eventIndex: 7,
        trackId: "track-1",
        trackTitle: "Track 1",
        trackSecond: 42,
      },
      fallbackTrackId: "track-fallback",
      fallbackTrackTitle: "Fallback",
      fallbackTrackSecond: 21,
      ...overrides,
    }),
  );
}

describe("useReplayBookmarks", () => {
  beforeEach(() => {
    sessionsApiMock.listSessionBookmarks.mockResolvedValue([
      createBookmark(1, 1),
      createBookmark(2, 2, {
        label: "Window 2 saved",
        note: "note",
        bookmarkTag: "alert",
      }),
    ]);
    sessionsApiMock.upsertSessionBookmark.mockResolvedValue(
      createBookmark(3, 2, {
        label: "Window 2 saved",
        note: "updated note",
      }),
    );
    sessionsApiMock.deleteSessionBookmark.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads bookmarks, resolves active state and syncs drafts", async () => {
    const { result } = renderReplayBookmarksHook();

    await waitFor(() => {
      expect(result.current.bookmarkLabelDraft).toBe("Window 2 saved");
    });

    expect(result.current.sortedSessionBookmarks.map((entry) => entry.id)).toEqual([1, 2]);
    expect(result.current.activeReplayBookmark?.id).toBe(2);
    expect(result.current.bookmarkNoteDraft).toBe("note");
    expect(result.current.bookmarkTagDraft).toBe("alert");
  });

  it("captures, saves and deletes replay bookmarks", async () => {
    const { result } = renderReplayBookmarksHook();

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    act(() => {
      result.current.setBookmarkNoteDraft("updated note");
      result.current.captureCurrentScene();
    });

    await act(async () => {
      const saved = await result.current.saveReplayBookmark();
      expect(saved?.id).toBe(3);
    });

    expect(result.current.sessionBookmarks.some((entry) => entry.id === 3)).toBe(true);

    await act(async () => {
      const deleted = await result.current.deleteReplayBookmark(createBookmark(3, 2));
      expect(deleted).toBe(true);
    });

    expect(result.current.sessionBookmarks.some((entry) => entry.id === 3)).toBe(false);
  });

  it("surfaces load and save failures", async () => {
    sessionsApiMock.listSessionBookmarks.mockRejectedValueOnce(new Error("load failed"));

    const { result } = renderReplayBookmarksHook();

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    expect(result.current.bookmarkError).toContain("load failed");

    sessionsApiMock.upsertSessionBookmark.mockRejectedValueOnce(new Error("save failed"));

    await act(async () => {
      const saved = await result.current.saveReplayBookmark();
      expect(saved).toBeNull();
    });

    expect(result.current.bookmarkError).toContain("save failed");
  });

  it("returns null without calling the API when the replay session or window is missing", async () => {
    const withoutSession = renderReplayBookmarksHookWithOverrides({
      replaySessionId: null,
    });

    await act(async () => {
      await expect(withoutSession.result.current.saveReplayBookmark()).resolves.toBeNull();
    });

    const withoutWindow = renderReplayBookmarksHookWithOverrides({
      replayWindowIndex: null,
    });

    await act(async () => {
      await expect(withoutWindow.result.current.saveReplayBookmark()).resolves.toBeNull();
    });

    expect(sessionsApiMock.upsertSessionBookmark).not.toHaveBeenCalled();
  });

  it("surfaces the native-runtime requirement when bookmark upsert returns null", async () => {
    sessionsApiMock.upsertSessionBookmark.mockResolvedValueOnce(null);

    const { result } = renderReplayBookmarksHook();

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    await act(async () => {
      await expect(result.current.saveReplayBookmark()).resolves.toBeNull();
    });

    expect(result.current.bookmarkError).toBe(
      "Replay bookmarks require the native desktop runtime.",
    );
  });
});
