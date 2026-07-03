import { describe, expect, it } from "vitest";

import type { PersistedSession, SessionBookmark } from "../../src/api/sessions";
import {
  buildCreatedSessionState,
  buildLoadedSessionBookmarksState,
  buildLoadedSessionsState,
  buildRemovedSessionState,
} from "../../src/hooks/sessionsStateRuntime";

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

describe("sessionsStateRuntime", () => {
  it("builds loaded and created session state", () => {
    const older = createSession("older", "2026-06-25T10:00:00.000Z");
    const newer = createSession("newer", "2026-06-25T11:00:00.000Z");

    expect(buildLoadedSessionsState([older, newer])).toEqual({
      sessions: [newer, older],
      error: null,
    });

    expect(buildCreatedSessionState([older], newer)).toEqual({
      sessions: [newer, older],
      selectedSessionId: "newer",
      error: null,
    });
  });

  it("builds bookmark and removal state", () => {
    const bookmark = { id: 1 } as SessionBookmark;
    const first = createSession("first", "2026-06-25T10:00:00.000Z");
    const second = createSession("second", "2026-06-25T11:00:00.000Z");

    expect(buildLoadedSessionBookmarksState([["first", [bookmark]]])).toEqual({
      sessionBookmarksBySessionId: { first: [bookmark] },
      error: null,
    });

    expect(
      buildRemovedSessionState({
        sessions: [first, second],
        sessionBookmarksBySessionId: { first: [bookmark], second: [] },
        selectedSessionId: "first",
        sessionId: "first",
      }),
    ).toEqual({
      sessions: [second],
      sessionBookmarksBySessionId: { second: [] },
      selectedSessionId: null,
      error: null,
    });
  });
});
