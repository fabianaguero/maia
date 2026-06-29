import { describe, expect, it } from "vitest";

import type { PersistedSession, SessionBookmark } from "../../src/api/sessions";
import {
  appendCreatedSession,
  buildSessionBookmarksMap,
  clearDeletedSelectedSessionId,
  removeDeletedSession,
  removeDeletedSessionBookmarks,
  sortSessionsByCreatedAt,
  toSessionErrorMessage,
} from "../../src/hooks/sessionsRuntime";

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

describe("sessionsRuntime", () => {
  it("sorts and appends sessions by creation date", () => {
    const first = createSession("first", "2026-06-25T10:00:00.000Z");
    const second = createSession("second", "2026-06-25T11:00:00.000Z");

    expect(sortSessionsByCreatedAt([first, second]).map((entry) => entry.id)).toEqual([
      "second",
      "first",
    ]);
    expect(appendCreatedSession([first], second).map((entry) => entry.id)).toEqual([
      "second",
      "first",
    ]);
  });

  it("removes deleted session state and bookmark maps", () => {
    const first = createSession("first", "2026-06-25T10:00:00.000Z");
    const second = createSession("second", "2026-06-25T11:00:00.000Z");
    const bookmark = { id: 1 } as SessionBookmark;

    expect(removeDeletedSession([first, second], "first")).toEqual([second]);
    expect(removeDeletedSessionBookmarks({ first: [bookmark], second: [] }, "first")).toEqual({
      second: [],
    });
    expect(clearDeletedSelectedSessionId("first", "first")).toBeNull();
    expect(clearDeletedSelectedSessionId("second", "first")).toBe("second");
  });

  it("builds bookmark maps and formats errors", () => {
    const bookmark = { id: 1 } as SessionBookmark;

    expect(buildSessionBookmarksMap([["session-1", [bookmark]]])).toEqual({
      "session-1": [bookmark],
    });
    expect(toSessionErrorMessage(new Error("nope"), "fallback")).toBe("nope");
    expect(toSessionErrorMessage(null, "fallback")).toBe("fallback");
  });
});
