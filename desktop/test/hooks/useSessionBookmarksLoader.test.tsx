import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PersistedSession, SessionBookmark } from "../../src/api/sessions";
import { useSessionBookmarksLoader } from "../../src/hooks/useSessionBookmarksLoader";

const state = vi.hoisted(() => ({
  listSessionBookmarks: vi.fn<Promise<SessionBookmark[]>, [string]>(),
}));

vi.mock("../../src/api/sessions", async () => {
  const actual = await vi.importActual("../../src/api/sessions");
  return {
    ...actual,
    listSessionBookmarks: state.listSessionBookmarks,
  };
});

function createSession(id: string, createdAt: string): PersistedSession {
  return {
    id,
    label: id,
    sourceId: null,
    sourceTitle: null,
    sourcePath: null,
    sourceKind: null,
    trackId: null,
    trackTitle: null,
    playlistId: null,
    playlistName: null,
    adapterKind: "file",
    mode: "live",
    status: "active",
    fileCursor: 0,
    totalPolls: 0,
    totalLines: 0,
    totalAnomalies: 0,
    lastBpm: null,
    createdAt,
    updatedAt: createdAt,
    sourceTemplateId: null,
  };
}

function createBookmark(sessionId: string, id: number, label: string): SessionBookmark {
  return {
    id,
    sessionId,
    replayWindowIndex: id,
    eventIndex: id,
    label,
    note: "",
    bookmarkTag: null,
    suggestedStyleProfileId: null,
    suggestedMutationProfileId: null,
    trackId: null,
    trackTitle: null,
    trackSecond: null,
    createdAt: "2026-04-09T12:00:00.000Z",
    updatedAt: "2026-04-09T12:01:00.000Z",
  };
}

describe("useSessionBookmarksLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads bookmarks for all sessions and clears previous errors", async () => {
    const setSessionBookmarksBySessionId = vi.fn();
    const setError = vi.fn();
    state.listSessionBookmarks
      .mockResolvedValueOnce([createBookmark("session-1", 1, "Deploy")])
      .mockResolvedValueOnce([
        createBookmark("session-2", 2, "Warn"),
        createBookmark("session-2", 3, "Recover"),
      ]);

    const { result } = renderHook(() =>
      useSessionBookmarksLoader({
        sessions: [
          createSession("session-1", "2026-04-09T10:00:00.000Z"),
          createSession("session-2", "2026-04-09T11:00:00.000Z"),
        ],
        setSessionBookmarksBySessionId,
        setError,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(state.listSessionBookmarks).toHaveBeenNthCalledWith(1, "session-1");
    expect(state.listSessionBookmarks).toHaveBeenNthCalledWith(2, "session-2");
    expect(setSessionBookmarksBySessionId).toHaveBeenCalledWith({
      "session-1": [createBookmark("session-1", 1, "Deploy")],
      "session-2": [
        createBookmark("session-2", 2, "Warn"),
        createBookmark("session-2", 3, "Recover"),
      ],
    });
    expect(setError).toHaveBeenCalledWith(null);
  });

  it("normalizes thrown failures into a session error message", async () => {
    const setSessionBookmarksBySessionId = vi.fn();
    const setError = vi.fn();
    state.listSessionBookmarks.mockRejectedValueOnce(new Error("bookmark gateway offline"));

    const { result } = renderHook(() =>
      useSessionBookmarksLoader({
        sessions: [createSession("session-1", "2026-04-09T10:00:00.000Z")],
        setSessionBookmarksBySessionId,
        setError,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(setSessionBookmarksBySessionId).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith("bookmark gateway offline");
  });
});
