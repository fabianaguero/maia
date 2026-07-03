import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildConnectionsFormControllerApi,
  buildConnectionsFormControllerBrowseInput,
  buildConnectionsFormControllerDeleteInput,
  buildConnectionsFormControllerHookResult,
  buildConnectionsFormControllerRefreshInput,
  buildConnectionsFormControllerSaveInput,
} from "../../../src/features/simple/connectionsFormControllerHookRuntime";

describe("connectionsFormControllerHookRuntime", () => {
  it("builds stable api and refresh/save/delete payloads", () => {
    const api = buildConnectionsFormControllerApi({
      listLogSourceConnections: vi.fn(async () => []),
      pickRepositoryFile: vi.fn(async () => null),
      upsertLogSourceConnection: vi.fn(async () => undefined),
      deleteLogSourceConnection: vi.fn(async () => undefined),
    });

    const refreshInput = buildConnectionsFormControllerRefreshInput({
      setLoading: vi.fn(),
      setError: vi.fn(),
      setConnections: vi.fn(),
      api,
    });
    const saveInput = buildConnectionsFormControllerSaveInput({
      draft: {
        kind: "file_log",
        label: "orders",
        sourcePath: "/logs/orders.log",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "30m",
      },
      editingConnectionId: "conn-1",
      t: en,
      setSaving: vi.fn(),
      setError: vi.fn(),
      api,
      onAfterSave: vi.fn(async () => undefined),
    });
    const deleteInput = buildConnectionsFormControllerDeleteInput({
      id: "conn-1",
      editingConnectionId: "conn-1",
      setError: vi.fn(),
      api,
      resetForm: vi.fn(),
      refreshConnections: vi.fn(async () => undefined),
    });

    expect(refreshInput.listLogSourceConnections).toBe(api.listLogSourceConnections);
    expect(saveInput.upsertLogSourceConnection).toBe(api.upsertLogSourceConnection);
    expect(saveInput.draft.label).toBe("orders");
    expect(deleteInput.deleteLogSourceConnection).toBe(api.deleteLogSourceConnection);
    expect(deleteInput.id).toBe("conn-1");
  });

  it("builds browse input and returns hook results without mutation", () => {
    const api = buildConnectionsFormControllerApi({
      listLogSourceConnections: vi.fn(async () => []),
      pickRepositoryFile: vi.fn(async () => null),
      upsertLogSourceConnection: vi.fn(async () => undefined),
      deleteLogSourceConnection: vi.fn(async () => undefined),
    });
    const state = {
      connections: [],
      editingConnectionId: null,
      draft: {
        kind: "file_log",
        label: "",
        sourcePath: "/logs/current.log",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "10m",
      },
      loading: false,
      saving: false,
      pickerBusy: false,
      error: null,
      setDraft: vi.fn(),
      setError: vi.fn(),
      refreshConnections: vi.fn(async () => undefined),
      resetForm: vi.fn(),
      loadConnectionIntoForm: vi.fn(),
      handleBrowseFile: vi.fn(async () => undefined),
      handleSaveConnection: vi.fn(async () => undefined),
      handleDeleteConnection: vi.fn(async () => undefined),
    } as never;

    const browseInput = buildConnectionsFormControllerBrowseInput({
      sourcePath: "/logs/current.log",
      setPickerBusy: vi.fn(),
      setError: vi.fn(),
      setDraft: vi.fn(),
      api,
      t: en,
    });
    const result = buildConnectionsFormControllerHookResult(state);

    expect(browseInput.pickRepositoryFile).toBe(api.pickRepositoryFile);
    expect(browseInput.sourcePath).toBe("/logs/current.log");
    expect(browseInput.fallbackErrorMessage).toBe(en.simpleMode.connections.nativeFilePickerFailed);
    expect(result).toBe(state);
  });
});
