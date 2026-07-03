import { describe, expect, it, vi } from "vitest";

import {
  buildConnectionsFormControllerState,
  buildConnectionsFormLoadState,
  buildConnectionsFormResetState,
} from "../../../src/features/simple/connectionsFormControllerRuntime";
import type { LogSourceConnection } from "../../../src/types/monitor";

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

describe("connectionsFormControllerRuntime", () => {
  it("builds reset and load state from the draft domain helpers", () => {
    expect(buildConnectionsFormResetState("120m")).toMatchObject({
      editingConnectionId: null,
      draft: {
        kind: "file_log",
        gcpBackfillFreshness: "120m",
      },
    });

    expect(buildConnectionsFormLoadState(createConnection())).toMatchObject({
      editingConnectionId: "conn-1",
      draft: {
        kind: "file_log",
        sourcePath: "/logs/visits-service.log",
      },
      error: null,
    });
  });

  it("returns a stable form controller contract", () => {
    const setDraft = vi.fn();
    const setError = vi.fn();
    const refreshConnections = vi.fn(async () => undefined);
    const resetForm = vi.fn();
    const loadConnectionIntoForm = vi.fn();
    const handleBrowseFile = vi.fn(async () => undefined);
    const handleSaveConnection = vi.fn(async () => undefined);
    const handleDeleteConnection = vi.fn(async () => undefined);

    expect(
      buildConnectionsFormControllerState({
        connections: [createConnection()],
        editingConnectionId: null,
        draft: buildConnectionsFormResetState("10m").draft,
        loading: false,
        saving: false,
        pickerBusy: false,
        error: null,
        setDraft,
        setError,
        refreshConnections,
        resetForm,
        loadConnectionIntoForm,
        handleBrowseFile,
        handleSaveConnection,
        handleDeleteConnection,
      }),
    ).toMatchObject({
      connections: [createConnection()],
      editingConnectionId: null,
      loading: false,
      saving: false,
      pickerBusy: false,
      error: null,
    });
  });
});
