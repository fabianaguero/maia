import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionsScreenState } from "../../../src/features/simple/useConnectionsScreenState";
import type { LogSourceConnection, StreamSessionPollResult } from "../../../src/types/monitor";

const repositoriesApi = vi.hoisted(() => ({
  listLogSourceConnections: vi.fn(),
  pickRepositoryFile: vi.fn(),
  upsertLogSourceConnection: vi.fn(),
  deleteLogSourceConnection: vi.fn(),
  startLogSourceConnection: vi.fn(),
  pollStreamSession: vi.fn(),
  stopStreamSession: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => ({
  listLogSourceConnections: repositoriesApi.listLogSourceConnections,
  pickRepositoryFile: repositoriesApi.pickRepositoryFile,
  upsertLogSourceConnection: repositoriesApi.upsertLogSourceConnection,
  deleteLogSourceConnection: repositoriesApi.deleteLogSourceConnection,
  startLogSourceConnection: repositoriesApi.startLogSourceConnection,
  pollStreamSession: repositoriesApi.pollStreamSession,
  stopStreamSession: repositoriesApi.stopStreamSession,
}));

function createConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "file_log",
    label: "visits-service",
    sourceUri: "/logs/visits-service.log",
    enabled: true,
    adapterKind: "file",
    config: {
      path: "/logs/visits-service.log",
    },
    lastCursor: 0,
    lastSeenAt: null,
    createdAt: "2026-06-26T10:00:00.000Z",
    updatedAt: "2026-06-26T10:05:00.000Z",
    ...overrides,
  };
}

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: {
      sessionId: "session-1",
      adapterKind: "file",
      source: "/logs/visits-service.log",
      label: "visits-service",
      createdAt: "2026-06-26T10:00:00.000Z",
      lastPolledAt: "2026-06-26T10:00:01.000Z",
      totalPolls: 1,
      fileCursor: 10,
    },
    hasData: true,
    summary: "ready",
    suggestedBpm: null,
    confidence: 0.5,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
    ...overrides,
  };
}

describe("useConnectionsScreenState integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads persisted connections and saves a new file connection through the real form controller", async () => {
    let connectionStore: LogSourceConnection[] = [];

    repositoriesApi.listLogSourceConnections.mockImplementation(async () => [...connectionStore]);
    repositoriesApi.upsertLogSourceConnection.mockImplementation(async (payload: {
      id?: string;
      kind: "file_log";
      label: string;
      sourceUri: string;
      config: { path: string };
    }) => {
      const next: LogSourceConnection = createConnection({
        id: payload.id ?? "conn-new",
        kind: payload.kind,
        label: payload.label,
        sourceUri: payload.sourceUri,
        config: payload.config,
        updatedAt: "2026-06-26T10:06:00.000Z",
      });
      connectionStore = [next];
      return next;
    });
    repositoriesApi.pickRepositoryFile.mockResolvedValue("/logs/generated.log");
    repositoriesApi.deleteLogSourceConnection.mockResolvedValue(undefined);
    repositoriesApi.startLogSourceConnection.mockResolvedValue(undefined);
    repositoriesApi.pollStreamSession.mockResolvedValue(createPollResult());
    repositoriesApi.stopStreamSession.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "120m",
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.connections).toEqual([]);
    });

    act(() => {
      result.current.setDraft((current) => ({
        ...current,
        kind: "file_log",
        label: "generated.log",
        sourcePath: "/logs/generated.log",
      }));
    });

    await act(async () => {
      await result.current.handleSaveConnection();
    });

    expect(repositoriesApi.upsertLogSourceConnection).toHaveBeenCalledWith({
      id: undefined,
      kind: "file_log",
      label: "generated.log",
      sourceUri: "/logs/generated.log",
      config: {
        path: "/logs/generated.log",
      },
    });

    await waitFor(() => {
      expect(result.current.connections).toHaveLength(1);
      expect(result.current.connections[0]?.label).toBe("generated.log");
      expect(result.current.draft.sourcePath).toBe("");
      expect(result.current.draft.gcpBackfillFreshness).toBe("120m");
    });
  });

  it("starts a live tail and runs a connection test through the composed screen controllers", async () => {
    const connection = createConnection();
    repositoriesApi.listLogSourceConnections.mockResolvedValue([connection]);
    repositoriesApi.pickRepositoryFile.mockResolvedValue(null);
    repositoriesApi.upsertLogSourceConnection.mockResolvedValue(undefined);
    repositoriesApi.deleteLogSourceConnection.mockResolvedValue(undefined);
    repositoriesApi.startLogSourceConnection.mockResolvedValue(undefined);
    repositoriesApi.stopStreamSession.mockResolvedValue(undefined);
    repositoriesApi.pollStreamSession.mockImplementation(async (sessionId: string) =>
      createPollResult({
        session: {
          ...createPollResult().session,
          sessionId,
        },
      }),
    );

    const { result, unmount } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "10m",
      }),
    );

    try {
      await waitFor(() => {
        expect(result.current.connections).toHaveLength(1);
      });

      vi.useFakeTimers();

      await act(async () => {
        await result.current.handleStartTail(connection);
      });

      expect(repositoriesApi.startLogSourceConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionId: "conn-1",
          startFromBeginning: false,
        }),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1510);
      });

      expect(result.current.activeConnectionId).toBe("conn-1");
      expect(result.current.tailPreview).toContain("WARN queue depth rising");
      expect(result.current.tailStatus).toBe("2 lines · 1 anomalies · warn");

      await act(async () => {
        const run = result.current.handleTestConnection(connection);
        await vi.advanceTimersByTimeAsync(260);
        await run;
      });

      expect(result.current.testStatusById["conn-1"]).toBe("success");
      expect(result.current.testMessageById["conn-1"]).toBe("2 lines available from the tail");

      await act(async () => {
        await result.current.handleStopTail();
      });

      expect(repositoriesApi.stopStreamSession).toHaveBeenCalled();
      expect(result.current.activeSessionId).toBeNull();
      expect(result.current.activeConnectionId).toBeNull();
    } finally {
      unmount();
    }
  });
});
