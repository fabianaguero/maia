import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import { useReplayBookmarkPersistence } from "../../src/hooks/useReplayBookmarkPersistence";

const sessionsApiMock = vi.hoisted(() => ({
  deleteSessionBookmark: vi.fn(),
  listSessionBookmarks: vi.fn(),
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

describe("useReplayBookmarkPersistence", () => {
  beforeEach(() => {
    sessionsApiMock.listSessionBookmarks.mockResolvedValue([
      createBookmark(2, 4),
      createBookmark(1, 2),
    ]);
    sessionsApiMock.deleteSessionBookmark.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resets state when no replay session is active and sorts loaded bookmarks", async () => {
    const { result, rerender } = renderHook(
      ({ replaySessionId }: { replaySessionId: string | null }) =>
        useReplayBookmarkPersistence({ replaySessionId }),
      {
        initialProps: { replaySessionId: null },
      },
    );

    expect(result.current.sessionBookmarks).toEqual([]);
    expect(result.current.bookmarkBusy).toBe(false);
    expect(result.current.bookmarkError).toBeNull();

    rerender({ replaySessionId: "session-1" });

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    expect(result.current.sessionBookmarks.map((bookmark) => bookmark.id)).toEqual([1, 2]);
    expect(sessionsApiMock.listSessionBookmarks).toHaveBeenCalledWith("session-1");
  });

  it("surfaces load failures and handles native delete fallbacks", async () => {
    sessionsApiMock.listSessionBookmarks.mockRejectedValueOnce(new Error("load failed"));
    const { result } = renderHook(() =>
      useReplayBookmarkPersistence({ replaySessionId: "session-1" }),
    );

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    expect(result.current.bookmarkError).toContain("load failed");

    sessionsApiMock.deleteSessionBookmark.mockResolvedValueOnce(false);

    await act(async () => {
      const deleted = await result.current.deleteReplayBookmark(createBookmark(1, 2));
      expect(deleted).toBe(false);
    });

    expect(result.current.bookmarkError).toBe(
      "Replay bookmarks require the native desktop runtime.",
    );
  });

  it("deletes persisted bookmarks and surfaces deletion errors", async () => {
    const { result } = renderHook(() =>
      useReplayBookmarkPersistence({ replaySessionId: "session-1" }),
    );

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    await act(async () => {
      const deleted = await result.current.deleteReplayBookmark(createBookmark(1, 2));
      expect(deleted).toBe(true);
    });

    expect(result.current.sessionBookmarks.map((bookmark) => bookmark.id)).toEqual([2]);

    sessionsApiMock.deleteSessionBookmark.mockRejectedValueOnce(new Error("delete failed"));

    await act(async () => {
      const deleted = await result.current.deleteReplayBookmark(createBookmark(2, 4));
      expect(deleted).toBe(false);
    });

    expect(result.current.bookmarkError).toContain("delete failed");
  });

  it("ignores stale bookmark loads after the session changes", async () => {
    let resolveFirstLoad: ((value: SessionBookmark[]) => void) | null = null;
    sessionsApiMock.listSessionBookmarks
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstLoad = resolve;
          }),
      )
      .mockResolvedValueOnce([createBookmark(3, 6)]);

    const { result, rerender } = renderHook(
      ({ replaySessionId }: { replaySessionId: string | null }) =>
        useReplayBookmarkPersistence({ replaySessionId }),
      {
        initialProps: { replaySessionId: "session-1" },
      },
    );

    rerender({ replaySessionId: "session-2" });

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    await act(async () => {
      resolveFirstLoad?.([createBookmark(99, 20)]);
      await Promise.resolve();
    });

    expect(result.current.sessionBookmarks.map((bookmark) => bookmark.id)).toEqual([3]);
    expect(result.current.bookmarkError).toBeNull();
  });

  it("ignores stale bookmark load failures after the session changes", async () => {
    let rejectFirstLoad: ((error?: unknown) => void) | null = null;
    sessionsApiMock.listSessionBookmarks
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFirstLoad = reject;
          }),
      )
      .mockResolvedValueOnce([createBookmark(4, 8)]);

    const { result, rerender } = renderHook(
      ({ replaySessionId }: { replaySessionId: string | null }) =>
        useReplayBookmarkPersistence({ replaySessionId }),
      {
        initialProps: { replaySessionId: "session-1" },
      },
    );

    rerender({ replaySessionId: "session-2" });

    await waitFor(() => {
      expect(result.current.bookmarkBusy).toBe(false);
    });

    await act(async () => {
      rejectFirstLoad?.(new Error("stale load failed"));
      await Promise.resolve();
    });

    expect(result.current.sessionBookmarks.map((bookmark) => bookmark.id)).toEqual([4]);
    expect(result.current.bookmarkError).toBeNull();
  });
});
