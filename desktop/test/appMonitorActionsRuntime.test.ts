import { describe, expect, it } from "vitest";

import type { PersistedSession } from "../src/api/sessions";
import type { RepositoryAnalysis } from "../src/types/library";
import {
  resolveMonitoredRepository,
  resolveReplayMonitorDraft,
  resolveSessionPersistenceAction,
} from "../src/appMonitorActionsRuntime";

function createSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    id: "session-1",
    label: "Night watch",
    sourceId: "repo-1",
    sourceTitle: "orders.log",
    sourcePath: "/logs/orders.log",
    sourceKind: "file",
    trackId: "track-1",
    trackTitle: "Track 1",
    playlistId: "playlist-1",
    playlistName: "Playlist 1",
    adapterKind: "file",
    mode: "live",
    status: "paused",
    fileCursor: 128,
    totalPolls: 1,
    totalLines: 10,
    totalAnomalies: 2,
    lastBpm: 126,
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
    ...overrides,
  };
}

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "orders",
    sourcePath: "/logs/orders.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-26T00:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.7,
    summary: "steady",
    analyzerStatus: "ready",
    buildSystem: "none",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("appMonitorActionsRuntime", () => {
  it("derives replay draft ids from a persisted session", () => {
    expect(resolveReplayMonitorDraft(createSession())).toEqual({
      trackId: "track-1",
      playlistId: "playlist-1",
    });
  });

  it("chooses whether a live session should create or select persisted state", () => {
    expect(
      resolveSessionPersistenceAction({
        sessions: [createSession()],
        persistedSessionId: "session-1",
      }),
    ).toBe("select");

    expect(
      resolveSessionPersistenceAction({
        sessions: [createSession()],
        persistedSessionId: "session-2",
      }),
    ).toBe("create");
  });

  it("finds the monitored repository from the active monitor session", () => {
    const repository = createRepository();
    expect(
      resolveMonitoredRepository({ repoId: "repo-1" }, [repository]),
    ).toEqual(repository);
    expect(resolveMonitoredRepository(null, [repository])).toBeNull();
  });
});
