import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionsScreenState } from "../../../src/features/simple/useConnectionsScreenState";
import type { LogSourceConnection } from "../../../src/types/monitor";

const apiState = vi.hoisted(() => ({
  listLogSourceConnections: vi.fn(),
  pickRepositoryFile: vi.fn(),
  pollStreamSession: vi.fn(),
  startLogSourceConnection: vi.fn(),
  stopStreamSession: vi.fn(),
  upsertLogSourceConnection: vi.fn(),
  deleteLogSourceConnection: vi.fn(),
}));

const runtimeState = vi.hoisted(() => ({
  runConnectionProbeLoop: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => ({
  listLogSourceConnections: apiState.listLogSourceConnections,
  pickRepositoryFile: apiState.pickRepositoryFile,
  pollStreamSession: apiState.pollStreamSession,
  startLogSourceConnection: apiState.startLogSourceConnection,
  stopStreamSession: apiState.stopStreamSession,
  upsertLogSourceConnection: apiState.upsertLogSourceConnection,
  deleteLogSourceConnection: apiState.deleteLogSourceConnection,
}));

vi.mock("../../../src/features/simple/connectionsRuntime", async () => {
  const actual = await vi.importActual("../../../src/features/simple/connectionsRuntime");
  return {
    ...actual,
    runConnectionProbeLoop: runtimeState.runConnectionProbeLoop,
  };
});

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

describe("useConnectionsScreenState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiState.listLogSourceConnections.mockResolvedValue([createConnection()]);
    apiState.pickRepositoryFile.mockResolvedValue("/logs/picked.log");
    apiState.pollStreamSession.mockResolvedValue({
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
      dominantLevel: "info",
      lineCount: 2,
      anomalyCount: 0,
      levelCounts: {},
      anomalyMarkers: [],
      topComponents: [],
      sonificationCues: [],
      parsedLines: ["INFO ok"],
      warnings: [],
    });
    apiState.startLogSourceConnection.mockResolvedValue(undefined);
    apiState.stopStreamSession.mockResolvedValue(undefined);
    apiState.upsertLogSourceConnection.mockResolvedValue(undefined);
    apiState.deleteLogSourceConnection.mockResolvedValue(undefined);
    runtimeState.runConnectionProbeLoop.mockResolvedValue({
      status: "success",
      message: "adapter ready",
    });
  });

  it("hydrates connections on mount and resets the draft using the configured cloud lookback", async () => {
    const { result } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "120m",
      }),
    );

    await waitFor(() => {
      expect(apiState.listLogSourceConnections).toHaveBeenCalledTimes(1);
      expect(result.current.connections).toHaveLength(1);
    });

    expect(result.current.draft.gcpBackfillFreshness).toBe("120m");

    act(() => {
      result.current.loadConnectionIntoForm(createConnection());
    });

    expect(result.current.editingConnectionId).toBe("conn-1");
    expect(result.current.draft.sourcePath).toBe("/logs/visits-service.log");

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.editingConnectionId).toBeNull();
    expect(result.current.draft.gcpBackfillFreshness).toBe("120m");
    expect(result.current.draft.sourcePath).toBe("");
  });

  it("saves and tests a connection through the repository APIs", async () => {
    const { result } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "30m",
      }),
    );

    await waitFor(() => {
      expect(result.current.connections).toHaveLength(1);
    });

    act(() => {
      result.current.setDraft((current) => ({
        ...current,
        kind: "file_log",
        sourcePath: "/logs/new.log",
        label: "new-log",
      }));
    });

    await act(async () => {
      await result.current.handleSaveConnection();
    });

    expect(apiState.upsertLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "file_log",
        label: "new-log",
        sourceUri: "/logs/new.log",
      }),
    );
    expect(apiState.listLogSourceConnections).toHaveBeenCalledTimes(2);

    await act(async () => {
      await result.current.handleTestConnection(createConnection());
    });

    expect(apiState.startLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "conn-1",
        startFromBeginning: false,
      }),
    );
    expect(runtimeState.runConnectionProbeLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        t: en,
        connectionKind: "file_log",
      }),
    );
    expect(apiState.stopStreamSession).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.testStatusById["conn-1"]).toBe("success");
      expect(result.current.testMessageById["conn-1"]).toBe("adapter ready");
    });
  });
});
