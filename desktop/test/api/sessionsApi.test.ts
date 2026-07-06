import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
  isTauri: vi.fn(() => false),
}));

import {
  createPersistedSession,
  deletePersistedSession,
  deleteSessionBookmark,
  getPersistedSession,
  insertSessionEvent,
  listPersistedSessions,
  listSessionBookmarks,
  listSessionEvents,
  updatePersistedSessionCursor,
  updatePersistedSessionStatus,
  upsertSessionBookmark,
  type InsertSessionEventInput,
  type PersistedSession,
  type SessionBookmark,
  type SessionEvent,
} from "../../src/api/sessions";

function enableNativeBridge(): void {
  (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
}

function disableNativeBridge(): void {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

function createSession(id = "session-1"): PersistedSession {
  return {
    id,
    label: "Night watch",
    sourceId: "repo-1",
    sourceTitle: "API logs",
    sourcePath: "/logs/app.log",
    sourceKind: "file",
    trackId: "track-1",
    trackTitle: "Pulse",
    playlistId: "playlist-1",
    playlistName: "Night deck",
    adapterKind: "file",
    mode: "live",
    status: "active",
    fileCursor: 64,
    totalPolls: 8,
    totalLines: 320,
    totalAnomalies: 4,
    lastBpm: 126,
    createdAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-29T00:01:00.000Z",
    sourceTemplateId: "template-1",
  };
}

describe("sessions api", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    enableNativeBridge();
  });

  afterEach(() => {
    disableNativeBridge();
    vi.restoreAllMocks();
  });

  it("passes persisted session and bookmark commands through to the native bridge", async () => {
    const session = createSession();
    const eventInput: InsertSessionEventInput = {
      sessionId: session.id,
      pollIndex: 4,
      fromOffset: 100,
      toOffset: 140,
      summary: "warn burst",
      suggestedBpm: 126,
      confidence: 0.9,
      dominantLevel: "warn",
      lineCount: 12,
      anomalyCount: 2,
      levelCountsJson: '{"warn":2}',
      anomalyMarkersJson: "[]",
      topComponentsJson: '["api"]',
      sonificationCuesJson: "[]",
      parsedLinesJson: "[]",
      warningsJson: "[]",
    };
    const event: SessionEvent = {
      id: 1,
      sessionId: session.id,
      pollIndex: 4,
      capturedAt: "2026-06-29T00:00:00.000Z",
      fromOffset: 100,
      toOffset: 140,
      summary: "warn burst",
      suggestedBpm: 126,
      confidence: 0.9,
      dominantLevel: "warn",
      lineCount: 12,
      anomalyCount: 2,
      levelCountsJson: '{"warn":2}',
      anomalyMarkersJson: "[]",
      topComponentsJson: '["api"]',
      sonificationCuesJson: "[]",
      parsedLinesJson: "[]",
      warningsJson: "[]",
    };
    const bookmark: SessionBookmark = {
      id: 9,
      sessionId: session.id,
      replayWindowIndex: 3,
      eventIndex: 1,
      label: "Deploy spike",
      note: "Good replay anchor",
      bookmarkTag: "deploy",
      suggestedStyleProfileId: "alert-techno",
      suggestedMutationProfileId: "reactive",
      trackId: "track-1",
      trackTitle: "Pulse",
      trackSecond: 64,
      createdAt: "2026-06-29T00:00:00.000Z",
      updatedAt: "2026-06-29T00:00:00.000Z",
    };

    invokeMock
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce([session])
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce([event])
      .mockResolvedValueOnce(bookmark)
      .mockResolvedValueOnce([bookmark])
      .mockResolvedValueOnce(true);

    await expect(
      createPersistedSession({
        id: session.id,
        label: session.label ?? undefined,
        sourceId: session.sourceId ?? undefined,
        trackId: session.trackId ?? undefined,
        playlistId: session.playlistId ?? undefined,
        adapterKind: session.adapterKind,
        mode: session.mode,
        sourceTemplateId: session.sourceTemplateId ?? undefined,
      }),
    ).resolves.toEqual(session);
    await expect(listPersistedSessions()).resolves.toEqual([session]);
    await expect(getPersistedSession(session.id)).resolves.toEqual(session);
    await expect(updatePersistedSessionStatus(session.id, "paused")).resolves.toBeUndefined();
    await expect(updatePersistedSessionCursor(session.id, 128, 4, 1, 124)).resolves.toBeUndefined();
    await expect(deletePersistedSession(session.id)).resolves.toBe(true);
    await expect(insertSessionEvent(eventInput)).resolves.toBe(42);
    await expect(listSessionEvents(session.id)).resolves.toEqual([event]);
    await expect(
      upsertSessionBookmark({
        sessionId: session.id,
        replayWindowIndex: 3,
        eventIndex: bookmark.eventIndex,
        label: bookmark.label,
        note: bookmark.note,
      }),
    ).resolves.toEqual(bookmark);
    await expect(listSessionBookmarks(session.id)).resolves.toEqual([bookmark]);
    await expect(deleteSessionBookmark(bookmark.id)).resolves.toBe(true);

    expect(invokeMock).toHaveBeenNthCalledWith(1, "create_persisted_session", {
      input: {
        id: session.id,
        label: session.label,
        sourceId: session.sourceId,
        trackId: session.trackId,
        playlistId: session.playlistId,
        adapterKind: session.adapterKind,
        mode: session.mode,
        sourceTemplateId: session.sourceTemplateId,
      },
    });
    expect(invokeMock).toHaveBeenNthCalledWith(2, "list_persisted_sessions", undefined);
    expect(invokeMock).toHaveBeenNthCalledWith(3, "get_persisted_session", { id: session.id });
    expect(invokeMock).toHaveBeenNthCalledWith(4, "update_persisted_session_status", {
      id: session.id,
      status: "paused",
    });
    expect(invokeMock).toHaveBeenNthCalledWith(5, "update_persisted_session_cursor", {
      id: session.id,
      cursor: 128,
      linesDelta: 4,
      anomaliesDelta: 1,
      lastBpm: 124,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(6, "delete_persisted_session", {
      id: session.id,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(7, "insert_session_event", { input: eventInput });
    expect(invokeMock).toHaveBeenNthCalledWith(8, "list_session_events", {
      sessionId: session.id,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(9, "upsert_session_bookmark", {
      input: {
        sessionId: session.id,
        replayWindowIndex: 3,
        eventIndex: bookmark.eventIndex,
        label: bookmark.label,
        note: bookmark.note,
      },
    });
    expect(invokeMock).toHaveBeenNthCalledWith(10, "list_session_bookmarks", {
      sessionId: session.id,
    });
    expect(invokeMock).toHaveBeenNthCalledWith(11, "delete_session_bookmark", {
      id: bookmark.id,
    });
  });

  it("returns safe fallbacks for native bridge errors, including awaited async rejections", async () => {
    disableNativeBridge();
    invokeMock.mockImplementation(async () => {
      throw new Error("Tauri native bridge not available");
    });

    await expect(
      createPersistedSession({
        id: "session-1",
        adapterKind: "file",
        mode: "live",
      }),
    ).resolves.toBeNull();
    await expect(listPersistedSessions()).resolves.toEqual([]);
    await expect(getPersistedSession("session-1")).resolves.toBeNull();
    await expect(updatePersistedSessionStatus("session-1", "paused")).resolves.toBeUndefined();
    await expect(updatePersistedSessionCursor("session-1", 10, 1, 0, 120)).resolves.toBeUndefined();
    await expect(deletePersistedSession("session-1")).resolves.toBe(false);
    await expect(
      insertSessionEvent({
        sessionId: "session-1",
        pollIndex: 1,
        fromOffset: 0,
        toOffset: 1,
        summary: "noop",
        suggestedBpm: null,
        confidence: 0,
        dominantLevel: "info",
        lineCount: 0,
        anomalyCount: 0,
        levelCountsJson: "{}",
        anomalyMarkersJson: "[]",
        topComponentsJson: "[]",
        sonificationCuesJson: "[]",
        parsedLinesJson: "[]",
        warningsJson: "[]",
      }),
    ).resolves.toBe(-1);
    await expect(listSessionEvents("session-1")).resolves.toEqual([]);
    await expect(
      upsertSessionBookmark({
        sessionId: "session-1",
        replayWindowIndex: 0,
        label: "bookmark",
        note: "note",
      }),
    ).resolves.toBeNull();
    await expect(listSessionBookmarks("session-1")).resolves.toEqual([]);
    await expect(deleteSessionBookmark(1)).resolves.toBe(false);
  });

  it("rethrows non-bridge failures instead of masking them as local fallbacks", async () => {
    const failures = [
      () =>
        createPersistedSession({
          id: "session-1",
          adapterKind: "file",
          mode: "live",
        }),
      () => listPersistedSessions(),
      () => getPersistedSession("session-1"),
      () => updatePersistedSessionStatus("session-1", "paused"),
      () => updatePersistedSessionCursor("session-1", 10, 1, 0, 120),
      () => deletePersistedSession("session-1"),
      () =>
        insertSessionEvent({
          sessionId: "session-1",
          pollIndex: 1,
          fromOffset: 0,
          toOffset: 1,
          summary: "noop",
          suggestedBpm: null,
          confidence: 0,
          dominantLevel: "info",
          lineCount: 0,
          anomalyCount: 0,
          levelCountsJson: "{}",
          anomalyMarkersJson: "[]",
          topComponentsJson: "[]",
          sonificationCuesJson: "[]",
          parsedLinesJson: "[]",
          warningsJson: "[]",
        }),
      () => listSessionEvents("session-1"),
      () =>
        upsertSessionBookmark({
          sessionId: "session-1",
          replayWindowIndex: 0,
          label: "bookmark",
          note: "note",
        }),
      () => listSessionBookmarks("session-1"),
      () => deleteSessionBookmark(1),
    ];

    for (const fail of failures) {
      invokeMock.mockRejectedValueOnce(new Error("Permission denied"));
      await expect(fail()).rejects.toThrow("Permission denied");
    }
  });
});
