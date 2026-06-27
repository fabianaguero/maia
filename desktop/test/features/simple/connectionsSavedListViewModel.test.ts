import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import type { LogSourceConnection } from "../../../src/types/monitor";
import { buildConnectionsSavedListViewModel } from "../../../src/features/simple/connectionsSavedListViewModel";

function makeConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "gcp_cloud_run",
    label: "services",
    sourceUri: "gcp-cloud-run://proj/us-central1/services",
    enabled: true,
    adapterKind: "process",
    config: { backfillFreshness: "120m" },
    lastCursor: 0,
    lastSeenAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("connectionsSavedListViewModel", () => {
  it("builds saved connection rows with ordered meta chips and test state labels", () => {
    const viewModel = buildConnectionsSavedListViewModel({
      t: en,
      connections: [makeConnection()],
      connectionKindLabel: { file_log: "File log", gcp_cloud_run: "GCP Cloud Run" },
      activeConnectionId: "conn-1",
      activeSessionId: "session-1",
      editingConnectionId: "conn-1",
      saving: false,
      testStatusById: { "conn-1": "success" },
      testMessageById: { "conn-1": "OK" },
      tailStatus: "2 lines · 0 anomalies",
    });

    expect(viewModel.title).toBe(en.simpleMode.connections.savedConnections);
    expect(viewModel.rows[0]).toMatchObject({
      label: "services",
      kindLabel: "GCP Cloud Run",
      enabledLabel: en.simpleMode.connections.enabled,
      testLabel: en.simpleMode.connections.connectionOk,
      testMessage: "OK",
      isSelected: true,
      isActive: true,
      disableStartAction: true,
      disableEditAction: false,
      disableTestAction: true,
    });
    expect(viewModel.rows[0]?.metaChips).toEqual([
      { key: "conn-1-adapter", label: en.simpleMode.connections.adapterProcess, tone: "neutral" },
      {
        key: "conn-1-backfill",
        label: `${en.simpleMode.connections.streamLookback}: 120m`,
        tone: "neutral",
      },
      { key: "conn-1-active", label: en.simpleMode.connections.tailingNow, tone: "live" },
    ]);
    expect(viewModel.tailStatusLabel).toBe("2 lines · 0 anomalies");
  });

  it("falls back to connected tail label and error test state", () => {
    const viewModel = buildConnectionsSavedListViewModel({
      t: en,
      connections: [makeConnection({ enabled: false })],
      connectionKindLabel: { file_log: "File log", gcp_cloud_run: "GCP Cloud Run" },
      activeConnectionId: null,
      activeSessionId: null,
      editingConnectionId: null,
      saving: true,
      testStatusById: { "conn-1": "error" },
      testMessageById: { "conn-1": "Permission denied" },
      tailStatus: null,
    });

    expect(viewModel.rows[0]).toMatchObject({
      enabledTone: "disabled",
      testTone: "error",
      testLabel: en.simpleMode.connections.testFailed,
      disableEditAction: true,
    });
    expect(viewModel.tailStatusLabel).toBe(en.simpleMode.connections.connected);
  });

  it("sorts active and enabled connections ahead of inactive ones", () => {
    const viewModel = buildConnectionsSavedListViewModel({
      t: en,
      connections: [
        makeConnection({
          id: "disabled",
          label: "disabled",
          enabled: false,
          updatedAt: "2026-01-01T00:00:00Z",
        }),
        makeConnection({
          id: "enabled",
          label: "enabled",
          updatedAt: "2026-01-01T01:00:00Z",
        }),
        makeConnection({
          id: "active",
          label: "active",
          updatedAt: "2026-01-01T02:00:00Z",
        }),
      ],
      connectionKindLabel: { file_log: "File log", gcp_cloud_run: "GCP Cloud Run" },
      activeConnectionId: "active",
      activeSessionId: "session-1",
      editingConnectionId: null,
      saving: false,
      testStatusById: {},
      testMessageById: {},
      tailStatus: null,
    });

    expect(viewModel.rows.map((row) => row.id)).toEqual(["active", "enabled", "disabled"]);
  });
});
