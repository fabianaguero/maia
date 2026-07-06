import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionsScreen } from "../../src/features/simple/ConnectionsScreen";
import { createEmptyConnectionDraft } from "../../src/features/simple/connectionsDraftRuntime";
import {
  buildConnectionsScreenViewModel,
  type ConnectionsScreenHookState,
} from "../../src/features/simple/connectionsScreenHookRuntime";
import { buildConnectionKindLabelMap } from "../../src/features/simple/connectionsFormViewModelRuntime";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { LogSourceConnection } from "../../src/types/monitor";

const mockedUseConnectionsScreenState = vi.fn();

vi.mock("../../src/features/simple/useConnectionsScreenState", () => ({
  useConnectionsScreenState: (input: unknown) => mockedUseConnectionsScreenState(input),
}));

function createConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "file_log",
    label: "visits-service",
    sourceUri: "/var/log/visits-service.log",
    enabled: true,
    adapterKind: "file",
    config: {
      path: "/var/log/visits-service.log",
    },
    lastCursor: 0,
    lastSeenAt: "2026-06-25T18:00:00.000Z",
    createdAt: "2026-06-25T17:00:00.000Z",
    updatedAt: "2026-06-25T18:00:00.000Z",
    ...overrides,
  };
}

function createState(
  overrides: Partial<ConnectionsScreenHookState> = {},
): ConnectionsScreenHookState {
  const connection = createConnection();
  return {
    screenViewModel: buildConnectionsScreenViewModel({
      t: en,
      connections: overrides.connections ?? [connection],
    }),
    connectionKindLabel: buildConnectionKindLabelMap(en),
    connections: [connection],
    editingConnectionId: null,
    draft: createEmptyConnectionDraft("10m"),
    loading: false,
    saving: false,
    pickerBusy: false,
    error: null,
    activeSessionId: null,
    activeConnectionId: null,
    tailPreview: [],
    tailStatus: null,
    testStatusById: {},
    testMessageById: {},
    setDraft: vi.fn(),
    refreshConnections: vi.fn(async () => undefined),
    resetForm: vi.fn(),
    loadConnectionIntoForm: vi.fn(),
    handleBrowseFile: vi.fn(async () => undefined),
    handleSaveConnection: vi.fn(async () => undefined),
    handleStartTail: vi.fn(async () => undefined),
    handleStopTail: vi.fn(async () => undefined),
    handleDeleteConnection: vi.fn(async () => undefined),
    handleTestConnection: vi.fn(async () => undefined),
    ...overrides,
  };
}

function renderScreen(state: ConnectionsScreenHookState) {
  mockedUseConnectionsScreenState.mockReturnValue(state);
  return render(
    <I18nContext.Provider value={en}>
      <ConnectionsScreen />
    </I18nContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ConnectionsScreen", () => {
  it("renders the hero, form, and saved rows from the composed screen state", () => {
    const state = createState({
      activeSessionId: "session-1",
      activeConnectionId: "conn-1",
      tailStatus: "2 lines · 1 anomalies · warn",
      tailPreview: ["WARN queue depth rising"],
    });

    renderScreen(state);

    expect(screen.getByText(en.simpleMode.connections.title)).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.connections.savedConnections)).toBeInTheDocument();
    expect(screen.getByText("visits-service")).toBeInTheDocument();
    expect(screen.getByText("WARN queue depth rising")).toBeInTheDocument();
  });

  it("shows the current draft and calls save from the form footer", () => {
    const state = createState({
      draft: {
        ...createEmptyConnectionDraft("10m"),
        sourcePath: "/tmp/app.log",
        label: "app.log",
      },
    });

    renderScreen(state);

    expect(screen.getByDisplayValue("/tmp/app.log")).toBeInTheDocument();
    expect(screen.getByDisplayValue("app.log")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Save connection/i }));

    expect(state.handleSaveConnection).toHaveBeenCalledTimes(1);
  });

  it("wires row actions for edit, test, start, and delete", () => {
    const connection = createConnection();
    const state = createState({
      connections: [connection],
      screenViewModel: buildConnectionsScreenViewModel({ t: en, connections: [connection] }),
    });

    renderScreen(state);

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.connections.editConnection }));
    expect(state.loadConnectionIntoForm).toHaveBeenCalledWith(connection);

    fireEvent.click(
      screen.getByRole("button", { name: en.simpleMode.connections.testPersistentConnection }),
    );
    expect(state.handleTestConnection).toHaveBeenCalledWith(connection);

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.connections.startLiveTail }));
    expect(state.handleStartTail).toHaveBeenCalledWith(connection);

    fireEvent.click(
      screen.getByRole("button", { name: en.simpleMode.connections.deleteConnection }),
    );
    expect(state.handleDeleteConnection).toHaveBeenCalledWith(connection.id);
  });

  it("shows the stop action for the active connection", () => {
    const connection = createConnection();
    const state = createState({
      connections: [connection],
      screenViewModel: buildConnectionsScreenViewModel({ t: en, connections: [connection] }),
      activeSessionId: "session-1",
      activeConnectionId: connection.id,
    });

    renderScreen(state);

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.connections.stopLiveTail }));

    expect(state.handleStopTail).toHaveBeenCalledTimes(1);
  });
});
