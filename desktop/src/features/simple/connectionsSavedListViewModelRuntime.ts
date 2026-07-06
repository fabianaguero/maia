import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection } from "../../types/monitor";
import {
  deriveCloudBackfillLabel,
  type ConnectionKind,
  type ConnectionTestStatus,
} from "./connectionsViewModel";
import type { ConnectionsSavedListRowViewModel } from "./connectionsSavedListViewModel";

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

export function sortConnectionsForSavedList(
  connections: LogSourceConnection[],
  activeConnectionId: string | null,
): LogSourceConnection[] {
  return [...connections].sort((left, right) => {
    const leftActive = activeConnectionId === left.id ? 1 : 0;
    const rightActive = activeConnectionId === right.id ? 1 : 0;
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
}

export function buildConnectionsSavedListMetaChips(input: {
  t: AppTranslations;
  connection: LogSourceConnection;
  activeConnectionId: string | null;
}): ConnectionsSavedListRowViewModel["metaChips"] {
  const backfillValue = deriveCloudBackfillLabel(input.connection);
  const metaChips: ConnectionsSavedListRowViewModel["metaChips"] = [
    {
      key: `${input.connection.id}-adapter`,
      label: resolveAdapterKindLabel(input.t, input.connection.adapterKind),
      tone: "neutral",
    },
  ];

  if (backfillValue) {
    metaChips.push({
      key: `${input.connection.id}-backfill`,
      label: `${input.t.simpleMode.connections.streamLookback}: ${backfillValue}`,
      tone: "neutral",
    });
  }

  if (input.activeConnectionId === input.connection.id) {
    metaChips.push({
      key: `${input.connection.id}-active`,
      label: input.t.simpleMode.connections.tailingNow,
      tone: "live",
    });
  }

  return metaChips;
}

export function buildConnectionsSavedListRow(input: {
  t: AppTranslations;
  connection: LogSourceConnection;
  connectionKindLabel: Record<ConnectionKind, string>;
  activeConnectionId: string | null;
  activeSessionId: string | null;
  editingConnectionId: string | null;
  saving: boolean;
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
}): ConnectionsSavedListRowViewModel {
  const { connection } = input;
  const testState = resolveTestStateLabel(input.t, input.testStatusById[connection.id]);

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
    metaChips: buildConnectionsSavedListMetaChips({
      t: input.t,
      connection,
      activeConnectionId: input.activeConnectionId,
    }),
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
}
