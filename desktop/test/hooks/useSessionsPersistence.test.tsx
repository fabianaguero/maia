import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PersistedSession, SessionBookmark } from "../../src/api/sessions";
import { useSessionsPersistence } from "../../src/hooks/useSessionsPersistence";

const sessionsApiMock = vi.hoisted(() => ({
  createPersistedSession: vi.fn(),
  deletePersistedSession: vi.fn(),
  listPersistedSessions: vi.fn(),
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

function createInput(overrides?: {
  sessions?: PersistedSession[];
  selectedSessionId?: string | null;
  sessionBookmarksBySessionId?: Record<string, SessionBookmark[]>;
}) {
  return {
    sessions: overrides?.sessions ?? [],
    selectedSessionId: overrides?.selectedSessionId ?? null,
    sessionBookmarksBySessionId: overrides?.sessionBookmarksBySessionId ?? {},
    setSessions: vi.fn(),
    setLoading: vi.fn(),
    setMutating: vi.fn(),
    setError: vi.fn(),
    setSelectedSessionId: vi.fn(),
    setSessionBookmarksBySessionId: vi.fn(),
  };
}

describe("useSessionsPersistence", () => {
  beforeEach(() => {
    sessionsApiMock.listPersistedSessions.mockResolvedValue([]);
    sessionsApiMock.createPersistedSession.mockResolvedValue(
      createSession("session-new", "2026-06-30T10:00:00.000Z"),
    );
    sessionsApiMock.deletePersistedSession.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads sessions on mount and normalizes bootstrap failures", async () => {
    const successInput = createInput();
    sessionsApiMock.listPersistedSessions.mockResolvedValueOnce([
      createSession("older", "2026-06-30T09:00:00.000Z"),
      createSession("newer", "2026-06-30T10:00:00.000Z"),
    ]);

    renderHook(() => useSessionsPersistence(successInput));

    await waitFor(() => {
      expect(successInput.setSessions).toHaveBeenCalledWith([
        createSession("newer", "2026-06-30T10:00:00.000Z"),
        createSession("older", "2026-06-30T09:00:00.000Z"),
      ]);
    });

    expect(successInput.setError).toHaveBeenCalledWith(null);
    expect(successInput.setLoading.mock.calls).toEqual([[true], [false]]);

    const failureInput = createInput();
    sessionsApiMock.listPersistedSessions.mockRejectedValueOnce(new Error("load sessions failed"));

    renderHook(() => useSessionsPersistence(failureInput));

    await waitFor(() => {
      expect(failureInput.setError).toHaveBeenCalledWith("load sessions failed");
    });

    expect(failureInput.setLoading.mock.calls).toEqual([[true], [false]]);
  });

  it("creates a session, selects it, and tolerates null native responses", async () => {
    const input = createInput({
      sessions: [createSession("older", "2026-06-30T09:00:00.000Z")],
    });

    const { result } = renderHook(() => useSessionsPersistence(input));

    await act(async () => {
      await expect(
        result.current.createSession({
          id: "session-new",
          adapterKind: "file",
          mode: "live",
        }),
      ).resolves.toEqual(createSession("session-new", "2026-06-30T10:00:00.000Z"));
    });

    expect(input.setSelectedSessionId).toHaveBeenCalledWith("session-new");
    expect(input.setError).toHaveBeenCalledWith(null);
    expect(input.setMutating.mock.calls).toEqual([[true], [false]]);

    const setSessionsArg = input.setSessions.mock.calls.find(
      ([value]) => Array.isArray(value) && value[0]?.id === "session-new",
    )?.[0] as PersistedSession[] | undefined;
    expect(setSessionsArg?.map((entry) => entry.id)).toEqual(["session-new", "older"]);

    sessionsApiMock.createPersistedSession.mockResolvedValueOnce(null);

    await act(async () => {
      await expect(
        result.current.createSession({
          id: "session-null",
          adapterKind: "file",
          mode: "live",
        }),
      ).resolves.toBeNull();
    });

    expect(input.setError).toHaveBeenLastCalledWith(null);
  });

  it("removes persisted sessions only when deletion succeeds and surfaces delete failures", async () => {
    const bookmark = { id: 1 } as SessionBookmark;
    const input = createInput({
      sessions: [
        createSession("first", "2026-06-30T09:00:00.000Z"),
        createSession("second", "2026-06-30T10:00:00.000Z"),
      ],
      selectedSessionId: "first",
      sessionBookmarksBySessionId: { first: [bookmark], second: [] },
    });

    const { result } = renderHook(() => useSessionsPersistence(input));

    await act(async () => {
      await result.current.removeSession("first");
    });

    const sessionsUpdater = input.setSessions.mock.calls.find(
      ([value]) => typeof value === "function",
    )?.[0] as ((current: PersistedSession[]) => PersistedSession[]) | undefined;
    expect(
      sessionsUpdater?.([
        createSession("first", "2026-06-30T09:00:00.000Z"),
        createSession("second", "2026-06-30T10:00:00.000Z"),
      ]),
    ).toEqual([createSession("second", "2026-06-30T10:00:00.000Z")]);

    const bookmarksUpdater = input.setSessionBookmarksBySessionId.mock.calls.find(
      ([value]) => typeof value === "function",
    )?.[0] as
      | ((current: Record<string, SessionBookmark[]>) => Record<string, SessionBookmark[]>)
      | undefined;
    expect(bookmarksUpdater?.({ first: [bookmark], second: [] })).toEqual({ second: [] });

    const selectedUpdater = input.setSelectedSessionId.mock.calls.find(
      ([value]) => typeof value === "function",
    )?.[0] as ((current: string | null) => string | null) | undefined;
    expect(selectedUpdater?.("first")).toBeNull();
    expect(input.setError).toHaveBeenCalledWith(null);

    sessionsApiMock.deletePersistedSession.mockResolvedValueOnce(false);
    const setSessionsCallCountAfterSuccess = input.setSessions.mock.calls.length;

    await act(async () => {
      await result.current.removeSession("second");
    });

    expect(input.setSessions).toHaveBeenCalledTimes(setSessionsCallCountAfterSuccess);
    expect(input.setError).toHaveBeenLastCalledWith(null);

    sessionsApiMock.deletePersistedSession.mockRejectedValueOnce(new Error("delete failed"));

    await act(async () => {
      await result.current.removeSession("second");
    });

    expect(input.setError).toHaveBeenLastCalledWith("delete failed");
    expect(input.setMutating.mock.calls).toEqual([
      [true],
      [false],
      [true],
      [false],
      [true],
      [false],
    ]);
  });
});
