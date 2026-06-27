import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PersistedSession } from "../../src/api/sessions";
import { useSessions } from "../../src/hooks/useSessions";

const sessionsApiMock = vi.hoisted(() => ({
  createPersistedSession: vi.fn(),
  deletePersistedSession: vi.fn(),
  listPersistedSessions: vi.fn(),
  listSessionBookmarks: vi.fn(),
}));

vi.mock("../../src/api/sessions", async () => {
  const actual = await vi.importActual<object>("../../src/api/sessions");
  return {
    ...actual,
    ...sessionsApiMock,
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
    status: "paused",
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

describe("useSessions", () => {
  beforeEach(() => {
    sessionsApiMock.listPersistedSessions.mockResolvedValue([]);
    sessionsApiMock.listSessionBookmarks.mockResolvedValue([]);
    sessionsApiMock.createPersistedSession.mockResolvedValue(
      createSession("session-1", "2026-06-25T11:00:00.000Z"),
    );
    sessionsApiMock.deletePersistedSession.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("bootstraps sessions and sorts them newest-first", async () => {
    sessionsApiMock.listPersistedSessions.mockResolvedValue([
      createSession("older", "2026-06-25T10:00:00.000Z"),
      createSession("newer", "2026-06-25T11:00:00.000Z"),
    ]);

    const { result } = renderHook(() => useSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions.map((entry) => entry.id)).toEqual(["newer", "older"]);
  });

  it("creates sessions and refreshes bookmarks", async () => {
    const { result } = renderHook(() => useSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createSession({
        id: "session-1",
        adapterKind: "file",
        mode: "live",
      });
    });

    expect(result.current.selectedSessionId).toBe("session-1");
    expect(result.current.sessions[0]?.id).toBe("session-1");

    sessionsApiMock.listSessionBookmarks.mockResolvedValue([{ id: 1 }]);

    await act(async () => {
      await result.current.refreshBookmarks();
    });

    expect(result.current.sessionBookmarksBySessionId["session-1"]).toEqual([{ id: 1 }]);
  });

  it("removes sessions and surfaces API failures", async () => {
    sessionsApiMock.listPersistedSessions.mockResolvedValue([
      createSession("session-1", "2026-06-25T11:00:00.000Z"),
    ]);

    const { result } = renderHook(() => useSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeSession("session-1");
    });

    expect(result.current.sessions).toEqual([]);

    sessionsApiMock.createPersistedSession.mockRejectedValue(new Error("create failed"));

    await act(async () => {
      const created = await result.current.createSession({
        id: "session-2",
        adapterKind: "file",
        mode: "live",
      });
      expect(created).toBeNull();
    });

    expect(result.current.error).toBe("create failed");
  });
});
