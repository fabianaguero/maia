import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import type { LogSourceConnection } from "../../../src/types/monitor";
import {
  buildConnectionsScreenHookState,
  buildConnectionsScreenViewModel,
} from "../../../src/features/simple/connectionsScreenHookRuntime";

describe("connectionsScreenHookRuntime", () => {
  it("builds the hero view model from the connections list", () => {
    const connections: LogSourceConnection[] = [
      {
        id: "active",
        kind: "file_log",
        label: "active",
        sourceUri: "/tmp/active.log",
        enabled: true,
        adapterKind: "file",
        config: {},
        lastCursor: 0,
        lastSeenAt: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "disabled",
        kind: "file_log",
        label: "disabled",
        sourceUri: "/tmp/disabled.log",
        enabled: false,
        adapterKind: "file",
        config: {},
        lastCursor: 0,
        lastSeenAt: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    expect(buildConnectionsScreenViewModel({ t: en, connections })).toMatchObject({
      heroTitle: en.simpleMode.connections.title,
      heroDescription: en.simpleMode.connections.description,
      refreshTitle: en.simpleMode.connections.refreshConnections,
      heroStats: [
        { key: "total", label: en.simpleMode.connections.total, value: 2 },
        { key: "active", label: en.simpleMode.connections.active, value: 1 },
      ],
    });
  });

  it("builds the hook snapshot without mutating handlers", () => {
    const connection = {
      id: "active",
      kind: "file_log",
      label: "active",
      sourceUri: "/tmp/active.log",
      enabled: true,
      adapterKind: "file",
      config: {},
      lastCursor: 0,
      lastSeenAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    } satisfies LogSourceConnection;
    const refreshConnections = async () => undefined;
    const resetForm = () => undefined;
    const loadConnectionIntoForm = () => undefined;
    const handleBrowseFile = async () => undefined;
    const handleSaveConnection = async () => undefined;
    const handleStartTail = async () => undefined;
    const handleStopTail = async () => undefined;
    const handleDeleteConnection = async () => undefined;
    const handleTestConnection = async () => undefined;
    const setDraft = () => undefined;
    const screenViewModel = buildConnectionsScreenViewModel({ t: en, connections: [connection] });

    const state = buildConnectionsScreenHookState({
      screenViewModel,
      connectionKindLabel: {
        file_log: "File log",
        gcp_cloud_run: "Cloud Run",
      },
      connections: [connection],
      editingConnectionId: null,
      draft: {
        kind: "file_log",
        label: "",
        sourcePath: "",
        gcpProjectId: "",
        gcpServiceName: "",
        gcpRegion: "",
        gcpBackfillFreshness: "10m",
      },
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
      setDraft,
      refreshConnections,
      resetForm,
      loadConnectionIntoForm,
      handleBrowseFile,
      handleSaveConnection,
      handleStartTail,
      handleStopTail,
      handleDeleteConnection,
      handleTestConnection,
    });

    expect(state.connections).toEqual([connection]);
    expect(state.screenViewModel).toBe(screenViewModel);
    expect(state.setDraft).toBe(setDraft);
    expect(state.handleTestConnection).toBe(handleTestConnection);
  });
});
