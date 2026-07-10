import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection } from "../../types/monitor";
import { type ConnectionKind, type ConnectionTestStatus } from "./connectionsViewModel";
import {
  buildConnectionsSavedListRow,
  sortConnectionsForSavedList,
} from "./connectionsSavedListViewModelRuntime";

export interface ConnectionsSavedListRowViewModel {
  id: string;
  connection: LogSourceConnection;
  label: string;
  kindLabel: string;
  enabledLabel: string;
  enabledTone: "enabled" | "disabled";
  isSelected: boolean;
  isActive: boolean;
  isPending: boolean;
  pendingLabel: string | null;
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

export function buildConnectionsSavedListViewModel(input: {
  t: AppTranslations;
  connections: LogSourceConnection[];
  connectionKindLabel: Record<ConnectionKind, string>;
  activeConnectionId: string | null;
  activeSessionId: string | null;
  pendingConnectionId: string | null;
  tailPhase: "starting" | "stopping" | null;
  editingConnectionId: string | null;
  saving: boolean;
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
  tailStatus: string | null;
}): ConnectionsSavedListViewModel {
  const sortedConnections = sortConnectionsForSavedList(
    input.connections,
    input.activeConnectionId,
  );

  return {
    title: input.t.simpleMode.connections.savedConnections,
    help: input.t.simpleMode.connections.savedConnectionsHelp,
    loadingLabel: input.t.simpleMode.connections.loading,
    emptyTitle: input.t.simpleMode.connections.noConnections,
    emptyHelp: input.t.simpleMode.connections.noConnectionsHelp,
    tailTitle: input.t.simpleMode.connections.liveTail,
    tailStatusLabel: input.tailStatus ?? input.t.simpleMode.connections.connected,
    refreshTitle: input.t.simpleMode.connections.refreshConnections,
    rows: sortedConnections.map((connection) =>
      buildConnectionsSavedListRow({
        t: input.t,
        connection,
        connectionKindLabel: input.connectionKindLabel,
        activeConnectionId: input.activeConnectionId,
        activeSessionId: input.activeSessionId,
        pendingConnectionId: input.pendingConnectionId,
        tailPhase: input.tailPhase,
        editingConnectionId: input.editingConnectionId,
        saving: input.saving,
        testStatusById: input.testStatusById,
        testMessageById: input.testMessageById,
      }),
    ),
  };
}
