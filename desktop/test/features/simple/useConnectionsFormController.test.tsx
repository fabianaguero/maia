import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionsFormController } from "../../../src/features/simple/useConnectionsFormController";
import { createEmptyConnectionDraft } from "../../../src/features/simple/connectionsDraftRuntime";
import type { LogSourceConnection } from "../../../src/types/monitor";

const controllerHooks = vi.hoisted(() => ({
  useConnectionsFormLocalState: vi.fn(),
  useConnectionsFormActions: vi.fn(),
}));

vi.mock("../../../src/features/simple/useConnectionsFormLocalState", () => ({
  useConnectionsFormLocalState: (input: unknown) =>
    controllerHooks.useConnectionsFormLocalState(input),
}));

vi.mock("../../../src/features/simple/useConnectionsFormActions", () => ({
  useConnectionsFormActions: (input: unknown) => controllerHooks.useConnectionsFormActions(input),
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

let localState: ReturnType<typeof controllerHooks.useConnectionsFormLocalState>;
let actionsState: ReturnType<typeof controllerHooks.useConnectionsFormActions>;

describe("useConnectionsFormController", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    localState = {
      connections: [createConnection()],
      editingConnectionId: null,
      draft: createEmptyConnectionDraft("120m"),
      loading: false,
      saving: false,
      pickerBusy: false,
      error: null,
      setConnections: vi.fn(),
      setEditingConnectionId: vi.fn(),
      setDraft: vi.fn(),
      setLoading: vi.fn(),
      setSaving: vi.fn(),
      setPickerBusy: vi.fn(),
      setError: vi.fn(),
    };
    controllerHooks.useConnectionsFormLocalState.mockReturnValue(localState);

    actionsState = {
      refreshConnections: vi.fn(async () => undefined),
      resetForm: vi.fn(),
      loadConnectionIntoForm: vi.fn(),
      handleBrowseFile: vi.fn(async () => undefined),
      handleSaveConnection: vi.fn(async () => undefined),
      handleDeleteConnection: vi.fn(async () => undefined),
    };
    controllerHooks.useConnectionsFormActions.mockReturnValue(actionsState);
  });

  it("wires local state and actions into the public controller contract", () => {
    const { result } = renderHook(() =>
      useConnectionsFormController({
        t: en,
        defaultCloudLookback: "120m",
      }),
    );

    expect(controllerHooks.useConnectionsFormLocalState).toHaveBeenCalledWith("120m");
    expect(controllerHooks.useConnectionsFormActions).toHaveBeenCalledWith(
      expect.objectContaining({
        t: en,
        defaultCloudLookback: "120m",
        state: localState,
      }),
    );

    expect(result.current.connections).toEqual(localState.connections);
    expect(result.current.draft).toBe(localState.draft);
    expect(result.current.refreshConnections).toBe(actionsState.refreshConnections);
    expect(result.current.handleSaveConnection).toBe(actionsState.handleSaveConnection);
    expect(result.current.handleDeleteConnection).toBe(actionsState.handleDeleteConnection);
  });

  it("preserves the configured draft lookback and exposes mutation setters", () => {
    localState = {
      ...localState,
      draft: createEmptyConnectionDraft("45m"),
    };
    controllerHooks.useConnectionsFormLocalState.mockReturnValueOnce(localState);

    const { result } = renderHook(() =>
      useConnectionsFormController({
        t: en,
        defaultCloudLookback: "45m",
      }),
    );

    expect(result.current.draft.gcpBackfillFreshness).toBe("45m");
    expect(result.current.setDraft).toBe(localState.setDraft);
    expect(result.current.setError).toBe(localState.setError);
  });

  it("handles empty connection sets without losing the action surface", () => {
    localState = {
      ...localState,
      connections: [],
      draft: createEmptyConnectionDraft("30m"),
    };
    controllerHooks.useConnectionsFormLocalState.mockReturnValueOnce(localState);

    const { result } = renderHook(() =>
      useConnectionsFormController({
        t: en,
        defaultCloudLookback: "30m",
      }),
    );

    expect(result.current.connections).toEqual([]);
    expect(result.current.handleBrowseFile).toBe(actionsState.handleBrowseFile);
    expect(result.current.loadConnectionIntoForm).toBe(actionsState.loadConnectionIntoForm);
  });

  it("keeps edit/loading/saving flags aligned with the underlying local state", () => {
    localState = {
      ...localState,
      editingConnectionId: "conn-1",
      loading: true,
      saving: true,
      pickerBusy: true,
      error: "boom",
    };
    controllerHooks.useConnectionsFormLocalState.mockReturnValueOnce(localState);

    const { result } = renderHook(() =>
      useConnectionsFormController({
        t: en,
        defaultCloudLookback: "30m",
      }),
    );

    expect(result.current.editingConnectionId).toBe("conn-1");
    expect(result.current.loading).toBe(true);
    expect(result.current.saving).toBe(true);
    expect(result.current.pickerBusy).toBe(true);
    expect(result.current.error).toBe("boom");
  });
});
