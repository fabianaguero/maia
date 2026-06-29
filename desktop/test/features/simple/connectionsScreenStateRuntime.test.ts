import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import type { LogSourceConnection } from "../../../src/types/monitor";
import {
  browseConnectionFileState,
  deleteConnectionState,
  refreshConnectionsState,
  saveConnectionState,
  testConnectionState,
} from "../../../src/features/simple/connectionsScreenStateRuntime";

function createConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "file_log",
    label: "visits-service",
    sourceUri: "/logs/visits-service.log",
    enabled: true,
    adapterKind: "file",
    config: { path: "/logs/visits-service.log" },
    lastCursor: 0,
    lastSeenAt: null,
    createdAt: "2026-06-26T10:00:00.000Z",
    updatedAt: "2026-06-26T10:05:00.000Z",
    ...overrides,
  };
}

describe("connectionsScreenStateRuntime", () => {
  it("refreshes connections and clears loading state", async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const setConnections = vi.fn();

    await refreshConnectionsState({
      setLoading,
      setError,
      setConnections,
      listLogSourceConnections: async () => [createConnection()],
    });

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setError).toHaveBeenNthCalledWith(1, null);
    expect(setConnections).toHaveBeenCalledWith([createConnection()]);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("surfaces refresh failures and still clears loading state", async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const setConnections = vi.fn();

    await refreshConnectionsState({
      setLoading,
      setError,
      setConnections,
      listLogSourceConnections: async () => {
        throw new Error("list failed");
      },
    });

    expect(setConnections).not.toHaveBeenCalled();
    expect(setError).toHaveBeenLastCalledWith("list failed");
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("browses and injects the picked file path into the draft", async () => {
    const setPickerBusy = vi.fn();
    const setError = vi.fn();
    const setDraft = vi.fn();

    await browseConnectionFileState({
      sourcePath: "/logs/current.log",
      setPickerBusy,
      setError,
      setDraft,
      pickRepositoryFile: async () => "/logs/picked.log",
      fallbackErrorMessage: "picker failed",
    });

    expect(setPickerBusy).toHaveBeenNthCalledWith(1, true);
    expect(setError).toHaveBeenNthCalledWith(1, null);
    expect(setDraft).toHaveBeenCalledWith(expect.any(Function));
    const updater = setDraft.mock.calls[0]?.[0] as (current: {
      sourcePath: string;
      label: string;
    }) => { sourcePath: string; label: string };
    expect(updater({ sourcePath: "/logs/current.log", label: "x" })).toEqual({
      sourcePath: "/logs/picked.log",
      label: "x",
    });
    expect(setPickerBusy).toHaveBeenLastCalledWith(false);
  });

  it("handles browse failures and non-error fallbacks", async () => {
    const setPickerBusy = vi.fn();
    const setError = vi.fn();
    const setDraft = vi.fn();

    await browseConnectionFileState({
      sourcePath: "/logs/current.log",
      setPickerBusy,
      setError,
      setDraft,
      pickRepositoryFile: async () => {
        throw "picker exploded";
      },
      fallbackErrorMessage: "picker failed",
    });

    expect(setDraft).not.toHaveBeenCalled();
    expect(setError).toHaveBeenLastCalledWith("picker failed");
    expect(setPickerBusy).toHaveBeenLastCalledWith(false);
  });

  it("saves a valid connection and executes the post-save callback", async () => {
    const setSaving = vi.fn();
    const setError = vi.fn();
    const upsertLogSourceConnection = vi.fn(async () => undefined);
    const onAfterSave = vi.fn(async () => undefined);

    await saveConnectionState({
      draft: {
        kind: "file_log",
        label: "new-log",
        sourcePath: "/logs/new.log",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "10m",
      },
      editingConnectionId: null,
      t: en,
      setSaving,
      setError,
      upsertLogSourceConnection,
      onAfterSave,
    });

    expect(setSaving).toHaveBeenNthCalledWith(1, true);
    expect(upsertLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "file_log",
        label: "new-log",
        sourceUri: "/logs/new.log",
      }),
    );
    expect(onAfterSave).toHaveBeenCalledTimes(1);
    expect(setSaving).toHaveBeenLastCalledWith(false);
  });

  it("stops save flow on invalid draft and reports persistence errors", async () => {
    const invalidSetSaving = vi.fn();
    const invalidSetError = vi.fn();
    const invalidUpsert = vi.fn(async () => undefined);
    const invalidAfterSave = vi.fn(async () => undefined);

    await saveConnectionState({
      draft: {
        kind: "file_log",
        label: "",
        sourcePath: "",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "10m",
      },
      editingConnectionId: null,
      t: en,
      setSaving: invalidSetSaving,
      setError: invalidSetError,
      upsertLogSourceConnection: invalidUpsert,
      onAfterSave: invalidAfterSave,
    });

    expect(invalidUpsert).not.toHaveBeenCalled();
    expect(invalidAfterSave).not.toHaveBeenCalled();
    expect(invalidSetError).toHaveBeenLastCalledWith(
      en.simpleMode.connections.chooseLogFileError,
    );
    expect(invalidSetSaving).toHaveBeenLastCalledWith(false);

    const errorSetSaving = vi.fn();
    const errorSetError = vi.fn();

    await saveConnectionState({
      draft: {
        kind: "file_log",
        label: "new-log",
        sourcePath: "/logs/new.log",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "10m",
      },
      editingConnectionId: null,
      t: en,
      setSaving: errorSetSaving,
      setError: errorSetError,
      upsertLogSourceConnection: async () => {
        throw new Error("save failed");
      },
      onAfterSave: async () => undefined,
    });

    expect(errorSetError).toHaveBeenLastCalledWith("save failed");
    expect(errorSetSaving).toHaveBeenLastCalledWith(false);
  });

  it("deletes a connection, resets the form when editing it, and refreshes the list", async () => {
    const setError = vi.fn();
    const deleteLogSourceConnection = vi.fn(async () => undefined);
    const resetForm = vi.fn();
    const refreshConnections = vi.fn(async () => undefined);

    await deleteConnectionState({
      id: "conn-1",
      editingConnectionId: "conn-1",
      setError,
      deleteLogSourceConnection,
      resetForm,
      refreshConnections,
    });

    expect(setError).toHaveBeenNthCalledWith(1, null);
    expect(deleteLogSourceConnection).toHaveBeenCalledWith("conn-1");
    expect(resetForm).toHaveBeenCalledTimes(1);
    expect(refreshConnections).toHaveBeenCalledTimes(1);
  });

  it("reports delete failures without resetting unrelated form state", async () => {
    const setError = vi.fn();
    const deleteLogSourceConnection = vi.fn(async () => {
      throw new Error("delete failed");
    });
    const resetForm = vi.fn();
    const refreshConnections = vi.fn(async () => undefined);

    await deleteConnectionState({
      id: "conn-1",
      editingConnectionId: "other",
      setError,
      deleteLogSourceConnection,
      resetForm,
      refreshConnections,
    });

    expect(resetForm).not.toHaveBeenCalled();
    expect(refreshConnections).not.toHaveBeenCalled();
    expect(setError).toHaveBeenLastCalledWith("delete failed");
  });

  it("tests a connection, updates probe state, and stops the ephemeral session", async () => {
    const setError = vi.fn();
    const setTestStatusById = vi.fn();
    const setTestMessageById = vi.fn();
    const startLogSourceConnection = vi.fn(async () => undefined);
    const stopStreamSession = vi.fn(async () => undefined);
    const pollStreamSession = vi.fn(async () => ({
      session: {
        sessionId: "test-conn-1",
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
    }));

    await testConnectionState({
      connection: createConnection(),
      t: en,
      setError,
      currentStatusById: {},
      currentMessageById: {},
      setTestStatusById,
      setTestMessageById,
      startLogSourceConnection,
      pollStreamSession,
      sleep: async () => undefined,
      stopStreamSession,
    });

    expect(setError).toHaveBeenNthCalledWith(1, null);
    expect(setTestStatusById).toHaveBeenCalledWith({ "conn-1": "testing" });
    expect(setTestMessageById).toHaveBeenCalledWith({
      "conn-1": en.simpleMode.connections.openingAdapter,
    });
    expect(startLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "conn-1",
        startFromBeginning: false,
      }),
    );
    expect(setTestStatusById).toHaveBeenLastCalledWith({ "conn-1": "success" });
    expect(setTestMessageById).toHaveBeenLastCalledWith({
      "conn-1": "2 lines available from the tail",
    });
    expect(stopStreamSession).toHaveBeenCalledTimes(1);
  });

  it("marks connection tests as failed when startup or cleanup breaks", async () => {
    const setError = vi.fn();
    const setTestStatusById = vi.fn();
    const setTestMessageById = vi.fn();
    const stopStreamSession = vi.fn(async () => {
      throw new Error("cleanup failed");
    });

    await testConnectionState({
      connection: createConnection({ kind: "gcp_cloud_run", adapterKind: "process" }),
      t: en,
      setError,
      currentStatusById: {},
      currentMessageById: {},
      setTestStatusById,
      setTestMessageById,
      startLogSourceConnection: async () => {
        throw new Error("startup failed");
      },
      pollStreamSession: async () => {
        throw new Error("should not poll");
      },
      sleep: async () => undefined,
      stopStreamSession,
    });

    expect(setError).toHaveBeenNthCalledWith(1, null);
    expect(setTestStatusById).toHaveBeenLastCalledWith({ "conn-1": "error" });
    expect(setTestMessageById).toHaveBeenLastCalledWith({
      "conn-1": "startup failed",
    });
    expect(stopStreamSession).toHaveBeenCalledTimes(1);
  });
});
