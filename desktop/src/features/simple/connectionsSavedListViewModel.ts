import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection } from "../../types/monitor";
import {
  deriveCloudBackfillLabel,
  type ConnectionKind,
  type ConnectionTestStatus,
} from "./connectionsViewModel";

export interface ConnectionsSavedListRowViewModel {
  id: string;
  connection: LogSourceConnection;
  label: string;
  kindLabel: string;
  enabledLabel: string;
  enabledTone: "enabled" | "disabled";
  isSelected: boolean;
  isActive: boolean;
  disableStartAction: boolean;
  disableEditAction: boolean;
  disableTestAction: boolean;
  metaChips: Array<{
    key: string;
    label: string;
    tone: "neutral" | "live";
  }>;
  testLabel: string | null;
  testTone: "success" | "error" | "testing" | null;
  testMessage: string | null;
  sourceUri: string;
  rowActionTitle: string;
  startActionTitle: string;
  stopActionTitle: string;
  editActionTitle: string;
  testActionTitle: string;
  deleteActionTitle: string;
}

export interface ConnectionsSavedListViewModel {
  title: string;
  help: string;
  loadingLabel: string;
  emptyTitle: string;
  emptyHelp: string;
  tailTitle: string;
  tailStatusLabel: string;
  refreshTitle: string;
  rows: ConnectionsSavedListRowViewModel[];
}

function resolveTestStateLabel(
  t: AppTranslations,
  status: ConnectionTestStatus | undefined,
): { label: string | null; tone: "success" | "error" | "testing" | null } {
  if (!status || status === "idle") {
    return { label: null, tone: null };
  }

  if (status === "testing") {
    return { label: t.simpleMode.connections.testing, tone: "testing" };
  }
  if (status === "success") {
    return { label: t.simpleMode.connections.connectionOk, tone: "success" };
  }
  return { label: t.simpleMode.connections.testFailed, tone: "error" };
}

function resolveAdapterKindLabel(
  t: AppTranslations,
  adapterKind: LogSourceConnection["adapterKind"],
): string {
  switch (adapterKind) {
    case "file":
      return t.simpleMode.connections.adapterFile;
    case "process":
      return t.simpleMode.connections.adapterProcess;
    default:
      return t.simpleMode.common.unknown;
  }
}

export function buildConnectionsSavedListViewModel(input: {
  t: AppTranslations;
  connections: LogSourceConnection[];
  connectionKindLabel: Record<ConnectionKind, string>;
  activeConnectionId: string | null;
  activeSessionId: string | null;
  editingConnectionId: string | null;
  saving: boolean;
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
  tailStatus: string | null;
}): ConnectionsSavedListViewModel {
  const sortedConnections = [...input.connections].sort((left, right) => {
    const leftActive = input.activeConnectionId === left.id ? 1 : 0;
    const rightActive = input.activeConnectionId === right.id ? 1 : 0;
    if (leftActive !== rightActive) {
      return rightActive - leftActive;
    }

    const leftEnabled = left.enabled ? 1 : 0;
    const rightEnabled = right.enabled ? 1 : 0;
    if (leftEnabled !== rightEnabled) {
      return rightEnabled - leftEnabled;
    }

    const leftUpdated = Date.parse(left.updatedAt);
    const rightUpdated = Date.parse(right.updatedAt);
    if (
      Number.isFinite(leftUpdated) &&
      Number.isFinite(rightUpdated) &&
      leftUpdated !== rightUpdated
    ) {
      return rightUpdated - leftUpdated;
    }

    return left.label.localeCompare(right.label);
  });

  return {
    title: input.t.simpleMode.connections.savedConnections,
    help: input.t.simpleMode.connections.savedConnectionsHelp,
    loadingLabel: input.t.simpleMode.connections.loading,
    emptyTitle: input.t.simpleMode.connections.noConnections,
    emptyHelp: input.t.simpleMode.connections.noConnectionsHelp,
    tailTitle: input.t.simpleMode.connections.liveTail,
    tailStatusLabel: input.tailStatus ?? input.t.simpleMode.connections.connected,
    refreshTitle: input.t.simpleMode.connections.refreshConnections,
    rows: sortedConnections.map((connection) => {
      const testState = resolveTestStateLabel(input.t, input.testStatusById[connection.id]);
      const backfillValue = deriveCloudBackfillLabel(connection);
      const metaChips: ConnectionsSavedListRowViewModel["metaChips"] = [
        {
          key: `${connection.id}-adapter`,
          label: resolveAdapterKindLabel(input.t, connection.adapterKind),
          tone: "neutral",
        },
      ];

      if (backfillValue) {
        metaChips.push({
          key: `${connection.id}-backfill`,
          label: `${input.t.simpleMode.connections.streamLookback}: ${backfillValue}`,
          tone: "neutral",
        });
      }

      if (input.activeConnectionId === connection.id) {
        metaChips.push({
          key: `${connection.id}-active`,
          label: input.t.simpleMode.connections.tailingNow,
          tone: "live",
        });
      }

      return {
        id: connection.id,
        connection,
        label: connection.label,
        kindLabel: input.connectionKindLabel[connection.kind as ConnectionKind] ?? connection.kind,
        enabledLabel: connection.enabled
          ? input.t.simpleMode.connections.enabled
          : input.t.simpleMode.connections.disabled,
        enabledTone: connection.enabled ? "enabled" : "disabled",
        isSelected: input.editingConnectionId === connection.id,
        isActive: input.activeConnectionId === connection.id,
        disableStartAction: input.activeSessionId !== null,
        disableEditAction: input.saving,
        disableTestAction:
          input.activeSessionId !== null || input.testStatusById[connection.id] === "testing",
        metaChips,
        testLabel: testState.label,
        testTone: testState.tone,
        testMessage: input.testMessageById[connection.id] ?? null,
        sourceUri: connection.sourceUri,
        rowActionTitle: `${input.t.simpleMode.connections.editConnectionAction}: ${connection.label}`,
        startActionTitle: input.t.simpleMode.connections.startLiveTail,
        stopActionTitle: input.t.simpleMode.connections.stopLiveTail,
        editActionTitle: input.t.simpleMode.connections.editConnectionAction,
        testActionTitle: input.t.simpleMode.connections.testPersistentConnection,
        deleteActionTitle: input.t.simpleMode.connections.deleteConnection,
      };
    }),
  };
}
