import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionsFormController } from "../../../src/features/simple/useConnectionsFormController";
import type { LogSourceConnection } from "../../../src/types/monitor";

const apiState = vi.hoisted(() => ({
  listLogSourceConnections: vi.fn(),
  pickRepositoryFile: vi.fn(),
  upsertLogSourceConnection: vi.fn(),
  deleteLogSourceConnection: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => ({
  listLogSourceConnections: apiState.listLogSourceConnections,
  pickRepositoryFile: apiState.pickRepositoryFile,
  upsertLogSourceConnection: apiState.upsertLogSourceConnection,
  deleteLogSourceConnection: apiState.deleteLogSourceConnection,
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

describe("useConnectionsFormController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiState.listLogSourceConnections.mockResolvedValue([createConnection()]);
    apiState.pickRepositoryFile.mockResolvedValue("/logs/picked.log");
    apiState.upsertLogSourceConnection.mockResolvedValue(undefined);
    apiState.deleteLogSourceConnection.mockResolvedValue(undefined);
  });

  it("hydrates connections and resets the draft with the configured lookback", async () => {
    const { result } = renderHook(() =>
      useConnectionsFormController({
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
  });

  it("browses, saves and deletes connections through repository APIs", async () => {
    const { result } = renderHook(() =>
      useConnectionsFormController({
        t: en,
        defaultCloudLookback: "30m",
      }),
    );

    await waitFor(() => {
      expect(result.current.connections).toHaveLength(1);
    });

    await act(async () => {
      await result.current.handleBrowseFile();
    });

    expect(result.current.draft.sourcePath).toBe("/logs/picked.log");

    act(() => {
      result.current.setDraft((current) => ({
        ...current,
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
        sourceUri: "/logs/picked.log",
      }),
    );
    expect(apiState.listLogSourceConnections).toHaveBeenCalledTimes(2);

    await act(async () => {
      await result.current.handleDeleteConnection("conn-1");
    });

    expect(apiState.deleteLogSourceConnection).toHaveBeenCalledWith("conn-1");
    expect(apiState.listLogSourceConnections).toHaveBeenCalledTimes(3);
  });

  it("clears stale errors when loading an existing connection and resets after deleting the edited item", async () => {
    const { result } = renderHook(() =>
      useConnectionsFormController({
        t: en,
        defaultCloudLookback: "45m",
      }),
    );

    await waitFor(() => {
      expect(result.current.connections).toHaveLength(1);
    });

    act(() => {
      result.current.setError("stale error");
      result.current.loadConnectionIntoForm(createConnection());
    });

    expect(result.current.error).toBeNull();
    expect(result.current.editingConnectionId).toBe("conn-1");

    await act(async () => {
      await result.current.handleDeleteConnection("conn-1");
    });

    expect(apiState.deleteLogSourceConnection).toHaveBeenCalledWith("conn-1");
    expect(result.current.editingConnectionId).toBeNull();
    expect(result.current.draft.gcpBackfillFreshness).toBe("45m");
  });

  it("passes the current draft path to the native picker helper", async () => {
    const { result } = renderHook(() =>
      useConnectionsFormController({
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
        sourcePath: "/logs/current.log",
      }));
    });

    await act(async () => {
      await result.current.handleBrowseFile();
    });

    expect(apiState.pickRepositoryFile).toHaveBeenCalledWith("/logs/current.log");
    expect(result.current.draft.sourcePath).toBe("/logs/picked.log");
  });
});
