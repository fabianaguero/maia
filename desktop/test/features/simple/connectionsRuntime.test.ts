import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import type { LogSourceConnection, StreamSessionPollResult } from "../../../src/types/monitor";
import {
  buildConnectionTailPollViewState,
  buildConnectionTailFailureState,
  buildConnectionTailStartPlan,
  buildConnectionTailStopState,
  buildConnectionTestPendingState,
  buildConnectionTestResolvedState,
  buildConnectionsScreenHookState,
  appendConnectionTailPreview,
  buildConnectionsScreenViewModel,
  buildConnectionSessionId,
  evaluateConnectionProbeStep,
  formatConnectionTailStatus,
  resolveConnectionProbeSuccessMessage,
  runConnectionProbeLoop,
} from "../../../src/features/simple/connectionsRuntime";

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: {
      sessionId: "session-1",
      adapterKind: "file",
      source: "/var/log/app.log",
      label: "app",
      createdAt: "2026-06-25T18:00:00.000Z",
      lastPolledAt: "2026-06-25T18:00:01.000Z",
      totalPolls: 1,
      fileCursor: 64,
    },
    hasData: false,
    summary: "Idle",
    suggestedBpm: null,
    confidence: 0.5,
    dominantLevel: "info",
    lineCount: 0,
    anomalyCount: 0,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
    ...overrides,
  };
}

describe("connectionsRuntime", () => {
  it("builds deterministic session ids by prefix and connection id", () => {
    expect(buildConnectionSessionId("conn", "abc", 123)).toBe("conn-abc-123");
    expect(buildConnectionSessionId("test", "xyz", 456)).toBe("test-xyz-456");
  });

  it("formats live tail status from poll results", () => {
    expect(
      formatConnectionTailStatus(
        en,
        createPollResult({
          hasData: true,
          lineCount: 9,
          anomalyCount: 2,
          dominantLevel: "warn",
        }),
      ),
    ).toBe("9 lines · 2 anomalies · warn");

    expect(formatConnectionTailStatus(en, createPollResult())).toBe("Idle");
  });

  it("builds live-tail poll, start and stop view state", () => {
    expect(
      buildConnectionTailPollViewState({
        t: en,
        currentPreview: ["INFO old line"],
        result: createPollResult({
          hasData: true,
          lineCount: 2,
          anomalyCount: 1,
          dominantLevel: "warn",
          parsedLines: ["WARN queue depth rising"],
        }),
      }),
    ).toEqual({
      tailStatus: "2 lines · 1 anomalies · warn",
      tailPreview: ["INFO old line", "WARN queue depth rising"],
    });

    expect(
      buildConnectionTailStartPlan({
        t: en,
        connectionId: "conn-1",
        buildSessionId: (prefix, connectionId) => `${prefix}-${connectionId}-fixed`,
      }),
    ).toEqual({
      nextSessionId: "conn-conn-1-fixed",
      openingStatus: en.simpleMode.connections.openingLiveTail,
      connectedStatus: en.simpleMode.connections.waitingCloudEntries,
      clearedPreview: [],
      activeConnectionId: "conn-1",
    });

    expect(buildConnectionTailStopState()).toEqual({
      activeSessionId: null,
      activeConnectionId: null,
      tailStatus: null,
    });

    expect(buildConnectionTailFailureState("boom")).toEqual({
      activeSessionId: null,
      activeConnectionId: null,
      error: "boom",
    });
  });

  it("appends tail preview lines using a bounded window", () => {
    expect(appendConnectionTailPreview(["a", "b"], [])).toEqual(["a", "b"]);
    expect(appendConnectionTailPreview(["a", "b"], ["c", "d"], 3)).toEqual(["b", "c", "d"]);
  });

  it("resolves file probe success summaries", () => {
    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "file_log",
        result: createPollResult({
          hasData: true,
          lineCount: 12,
          parsedLines: ["INFO boot complete"],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      sawData: true,
      errorMessage: null,
      summary: "12 lines available from the tail",
      done: true,
    });
  });

  it("detects cloud startup errors and ready states", () => {
    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "gcp_cloud_run",
        result: createPollResult({
          warnings: ["ERROR: Permission denied while opening Cloud Logging"],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      errorMessage: "ERROR: Permission denied while opening Cloud Logging",
      done: true,
    });

    expect(
      evaluateConnectionProbeStep({
        t: en,
        connectionKind: "gcp_cloud_run",
        result: createPollResult({
          warnings: ["Waiting for new log lines from Cloud Logging"],
        }),
        currentSummary: en.simpleMode.connections.connectionOpened,
      }),
    ).toMatchObject({
      sawReady: true,
      errorMessage: null,
      summary: "Idle",
      done: true,
    });
  });

  it("resolves probe success summaries by connection kind", () => {
    expect(
      resolveConnectionProbeSuccessMessage({
        t: en,
        connectionKind: "file_log",
        latestSummary: "",
        sawData: false,
        sawReady: false,
      }),
    ).toBe(en.simpleMode.connections.fileTailOpenedCorrectly);

    expect(
      resolveConnectionProbeSuccessMessage({
        t: en,
        connectionKind: "gcp_cloud_run",
        latestSummary: "",
        sawData: false,
        sawReady: false,
      }),
    ).toBe(en.simpleMode.connections.connectionOpenedWaitingLogs);
  });

  it("runs a probe loop until it resolves a successful file-tail summary", async () => {
    const sleep = async () => undefined;
    const pollStreamSession = async () =>
      createPollResult({
        hasData: true,
        lineCount: 7,
        parsedLines: ["INFO boot complete"],
      });

    await expect(
      runConnectionProbeLoop({
        t: en,
        connectionKind: "file_log",
        sessionId: "test-conn-1",
        pollStreamSession,
        sleep,
      }),
    ).resolves.toEqual({
      status: "success",
      message: "7 lines available from the tail",
    });
  });

  it("builds connection test pending and resolved states", () => {
    const pending = buildConnectionTestPendingState({
      t: en,
      connectionId: "conn-1",
      currentStatusById: {},
      currentMessageById: {},
    });

    expect(pending).toEqual({
      testStatusById: { "conn-1": "testing" },
      testMessageById: {
        "conn-1": en.simpleMode.connections.openingAdapter,
      },
    });

    const resolved = buildConnectionTestResolvedState({
      connectionId: "conn-1",
      status: "success",
      message: "ready",
      currentStatusById: pending.testStatusById,
      currentMessageById: pending.testMessageById,
    });

    expect(resolved).toEqual({
      testStatusById: { "conn-1": "success" },
      testMessageById: { "conn-1": "ready" },
    });
  });

  it("returns cloud probe startup errors when the adapter reports one", async () => {
    const sleep = async () => undefined;
    const pollStreamSession = async () =>
      createPollResult({
        warnings: ["ERROR: Permission denied while opening Cloud Logging"],
      });

    await expect(
      runConnectionProbeLoop({
        t: en,
        connectionKind: "gcp_cloud_run",
        sessionId: "test-conn-1",
        pollStreamSession,
        sleep,
      }),
    ).resolves.toEqual({
      status: "error",
      message: "ERROR: Permission denied while opening Cloud Logging",
    });
  });

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
        {
          key: "total",
          label: en.simpleMode.connections.total,
          value: 2,
        },
        {
          key: "active",
          label: en.simpleMode.connections.active,
          value: 1,
        },
      ],
    });
  });

  it("builds the connections hook state as a pure snapshot", () => {
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
    expect(state.refreshConnections).toBe(refreshConnections);
    expect(state.handleTestConnection).toBe(handleTestConnection);
  });
});
