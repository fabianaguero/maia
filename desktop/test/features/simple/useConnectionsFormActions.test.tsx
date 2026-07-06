import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { createEmptyConnectionDraft } from "../../../src/features/simple/connectionsDraftRuntime";
import { useConnectionsFormActions } from "../../../src/features/simple/useConnectionsFormActions";
import type { ConnectionsFormLocalState } from "../../../src/features/simple/useConnectionsFormLocalState";
import type { LogSourceConnection } from "../../../src/types/monitor";

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

interface TestFormApi {
  listLogSourceConnections: ReturnType<typeof vi.fn>;
  pickRepositoryFile: ReturnType<typeof vi.fn>;
  upsertLogSourceConnection: ReturnType<typeof vi.fn>;
  deleteLogSourceConnection: ReturnType<typeof vi.fn>;
}

function createApi(): TestFormApi {
  return {
    listLogSourceConnections: vi.fn(async () => [createConnection()]),
    pickRepositoryFile: vi.fn(async () => "/logs/picked.log"),
    upsertLogSourceConnection: vi.fn(async () => undefined),
    deleteLogSourceConnection: vi.fn(async () => undefined),
  };
}

function createState(
  overrides: Partial<ConnectionsFormLocalState> = {},
): ConnectionsFormLocalState {
  return {
    connections: [],
    setConnections: vi.fn(),
    editingConnectionId: null,
    setEditingConnectionId: vi.fn(),
    draft: createEmptyConnectionDraft("30m"),
    setDraft: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    saving: false,
    setSaving: vi.fn(),
    pickerBusy: false,
    setPickerBusy: vi.fn(),
    error: null,
    setError: vi.fn(),
    ...overrides,
  };
}

describe("useConnectionsFormActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes saved connections on mount", async () => {
    const api = createApi();
    const state = createState();

    renderHook(() =>
      useConnectionsFormActions({
        api,
        t: en,
        defaultCloudLookback: "30m",
        state,
      }),
    );

    await waitFor(() => {
      expect(api.listLogSourceConnections).toHaveBeenCalledTimes(1);
    });

    expect(state.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(state.setError).toHaveBeenNthCalledWith(1, null);
    expect(state.setConnections).toHaveBeenCalledWith([createConnection()]);
    expect(state.setLoading).toHaveBeenLastCalledWith(false);
  });

  it("saves a connection, resets the form, and refreshes the saved list", async () => {
    const api = createApi();
    const state = createState({
      editingConnectionId: "conn-1",
      draft: {
        kind: "file_log",
        label: "visits-service",
        sourcePath: "/logs/visits-service.log",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "30m",
      },
    });

    const { result } = renderHook(() =>
      useConnectionsFormActions({
        api,
        t: en,
        defaultCloudLookback: "30m",
        state,
      }),
    );

    await waitFor(() => {
      expect(api.listLogSourceConnections).toHaveBeenCalledTimes(1);
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.handleSaveConnection();
    });

    expect(api.upsertLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "conn-1",
        kind: "file_log",
        label: "visits-service",
        sourceUri: "/logs/visits-service.log",
      }),
    );
    expect(state.setSaving).toHaveBeenNthCalledWith(1, true);
    expect(state.setEditingConnectionId).toHaveBeenCalledWith(null);
    expect(state.setDraft).toHaveBeenCalledWith(createEmptyConnectionDraft("30m"));
    expect(api.listLogSourceConnections).toHaveBeenCalledTimes(1);
    expect(state.setConnections).toHaveBeenCalledWith([createConnection()]);
    expect(state.setSaving).toHaveBeenLastCalledWith(false);
  });

  it("deletes the edited connection, resets the form, and refreshes the list", async () => {
    const api = createApi();
    const state = createState({
      editingConnectionId: "conn-1",
      draft: {
        kind: "file_log",
        label: "visits-service",
        sourcePath: "/logs/visits-service.log",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "45m",
      },
    });

    const { result } = renderHook(() =>
      useConnectionsFormActions({
        api,
        t: en,
        defaultCloudLookback: "45m",
        state,
      }),
    );

    await waitFor(() => {
      expect(api.listLogSourceConnections).toHaveBeenCalledTimes(1);
    });

    vi.clearAllMocks();

    await act(async () => {
      await result.current.handleDeleteConnection("conn-1");
    });

    expect(api.deleteLogSourceConnection).toHaveBeenCalledWith("conn-1");
    expect(state.setEditingConnectionId).toHaveBeenCalledWith(null);
    expect(state.setDraft).toHaveBeenCalledWith(createEmptyConnectionDraft("45m"));
    expect(api.listLogSourceConnections).toHaveBeenCalledTimes(1);
    expect(state.setConnections).toHaveBeenCalledWith([createConnection()]);
  });
});
