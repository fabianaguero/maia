import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionsScreenState } from "../../../src/features/simple/useConnectionsScreenState";
import { createEmptyConnectionDraft } from "../../../src/features/simple/connectionsDraftRuntime";
import type { LogSourceConnection } from "../../../src/types/monitor";

const apiState = vi.hoisted(() => ({
  pollStreamSession: vi.fn(),
  startLogSourceConnection: vi.fn(),
  stopStreamSession: vi.fn(),
}));

const controllerHooks = vi.hoisted(() => ({
  useConnectionsFormController: vi.fn(),
  useConnectionTailController: vi.fn(),
  useConnectionTestController: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => ({
  pollStreamSession: apiState.pollStreamSession,
  startLogSourceConnection: apiState.startLogSourceConnection,
  stopStreamSession: apiState.stopStreamSession,
}));

vi.mock("../../../src/features/simple/useConnectionsFormController", () => ({
  useConnectionsFormController: (input: unknown) =>
    controllerHooks.useConnectionsFormController(input),
}));

vi.mock("../../../src/features/simple/useConnectionTailController", () => ({
  useConnectionTailController: (input: unknown) =>
    controllerHooks.useConnectionTailController(input),
}));

vi.mock("../../../src/features/simple/useConnectionTestController", () => ({
  useConnectionTestController: (input: unknown) =>
    controllerHooks.useConnectionTestController(input),
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

let formControllerState: ReturnType<typeof controllerHooks.useConnectionsFormController>;
let tailControllerState: ReturnType<typeof controllerHooks.useConnectionTailController>;
let testControllerState: ReturnType<typeof controllerHooks.useConnectionTestController>;

describe("useConnectionsScreenState", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    formControllerState = {
      connections: [createConnection()],
      editingConnectionId: null,
      draft: createEmptyConnectionDraft("120m"),
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
    };
    controllerHooks.useConnectionsFormController.mockReturnValue(formControllerState);

    tailControllerState = {
      activeSessionId: "session-1",
      activeConnectionId: "conn-1",
      tailPreview: ["WARN queue depth rising"],
      tailStatus: "2 lines · 1 anomalies · warn",
      handleStartTail: vi.fn(async () => undefined),
      handleStopTail: vi.fn(async () => undefined),
    };
    controllerHooks.useConnectionTailController.mockReturnValue(tailControllerState);

    testControllerState = {
      testStatusById: { "conn-1": "success" },
      testMessageById: { "conn-1": "adapter ready" },
      handleTestConnection: vi.fn(async () => undefined),
    };
    controllerHooks.useConnectionTestController.mockReturnValue(testControllerState);
  });

  it("composes the form, tail, and test controllers into one screen state", () => {
    const { result } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "120m",
      }),
    );

    expect(controllerHooks.useConnectionsFormController).toHaveBeenCalledWith({
      t: en,
      defaultCloudLookback: "120m",
    });
    expect(controllerHooks.useConnectionTailController).toHaveBeenCalledWith(
      expect.objectContaining({
        t: en,
        pollStreamSession: apiState.pollStreamSession,
        startLogSourceConnection: apiState.startLogSourceConnection,
        stopStreamSession: apiState.stopStreamSession,
      }),
    );
    expect(controllerHooks.useConnectionTestController).toHaveBeenCalledWith(
      expect.objectContaining({
        t: en,
        pollStreamSession: apiState.pollStreamSession,
        startLogSourceConnection: apiState.startLogSourceConnection,
        stopStreamSession: apiState.stopStreamSession,
      }),
    );

    expect(result.current.connections).toHaveLength(1);
    expect(result.current.activeConnectionId).toBe("conn-1");
    expect(result.current.tailPreview).toEqual(["WARN queue depth rising"]);
    expect(result.current.testStatusById["conn-1"]).toBe("success");
  });

  it("keeps the form draft and public handlers exposed from the composed state", () => {
    const { result } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "30m",
      }),
    );

    expect(result.current.draft.gcpBackfillFreshness).toBe("120m");
    expect(result.current.handleSaveConnection).toBe(formControllerState.handleSaveConnection);
    expect(result.current.handleStartTail).toBe(tailControllerState.handleStartTail);
    expect(result.current.handleTestConnection).toBe(testControllerState.handleTestConnection);
  });

  it("reflects empty connections without losing controller wiring", () => {
    controllerHooks.useConnectionsFormController.mockReturnValueOnce({
      ...formControllerState,
      connections: [],
      draft: createEmptyConnectionDraft("45m"),
    });

    const { result } = renderHook(() =>
      useConnectionsScreenState({
        t: en,
        defaultCloudLookback: "45m",
      }),
    );

    expect(result.current.connections).toEqual([]);
    expect(result.current.draft.gcpBackfillFreshness).toBe("45m");
    expect(result.current.activeSessionId).toBe("session-1");
  });
});
