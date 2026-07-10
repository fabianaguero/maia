import type { AppTranslations } from "../../i18n/types";
import type { Dispatch, SetStateAction } from "react";
import type { LogSourceConnection } from "../../types/monitor";
import type { ConnectionDraft, ConnectionKind, ConnectionTestStatus } from "./connectionsViewModel";

export interface ConnectionsHeroStat {
  key: string;
  label: string;
  value: number;
}

export interface ConnectionsScreenViewModel {
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  heroStats: ConnectionsHeroStat[];
  refreshTitle: string;
}

export interface ConnectionsScreenHookState {
  screenViewModel: ConnectionsScreenViewModel;
  connectionKindLabel: Record<ConnectionKind, string>;
  connections: LogSourceConnection[];
  editingConnectionId: string | null;
  draft: ConnectionDraft;
  loading: boolean;
  saving: boolean;
  pickerBusy: boolean;
  error: string | null;
  activeSessionId: string | null;
  activeConnectionId: string | null;
  pendingConnectionId: string | null;
  tailPhase: "starting" | "stopping" | null;
  tailPreview: string[];
  tailStatus: string | null;
  testStatusById: Record<string, ConnectionTestStatus>;
  testMessageById: Record<string, string>;
  setDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  refreshConnections: () => Promise<void>;
  resetForm: () => void;
  loadConnectionIntoForm: (connection: LogSourceConnection) => void;
  handleBrowseFile: () => Promise<void>;
  handleSaveConnection: () => Promise<void>;
  handleStartTail: (connection: LogSourceConnection) => Promise<void>;
  handleStopTail: () => Promise<void>;
  handleDeleteConnection: (id: string) => Promise<void>;
  handleTestConnection: (connection: LogSourceConnection) => Promise<void>;
}

export function buildConnectionsScreenViewModel(input: {
  t: AppTranslations;
  connections: LogSourceConnection[];
}): ConnectionsScreenViewModel {
  const activeCount = input.connections.filter((connection) => connection.enabled).length;

  return {
    heroKicker: input.t.simpleMode.connections.persistentAdapters,
    heroTitle: input.t.simpleMode.connections.title,
    heroDescription: input.t.simpleMode.connections.description,
    heroStats: [
      {
        key: "total",
        label: input.t.simpleMode.connections.total,
        value: input.connections.length,
      },
      {
        key: "active",
        label: input.t.simpleMode.connections.active,
        value: activeCount,
      },
    ],
    refreshTitle: input.t.simpleMode.connections.refreshConnections,
  };
}

export function buildConnectionsScreenHookState(
  input: ConnectionsScreenHookState,
): ConnectionsScreenHookState {
  return {
    screenViewModel: input.screenViewModel,
    connectionKindLabel: input.connectionKindLabel,
    connections: input.connections,
    editingConnectionId: input.editingConnectionId,
    draft: input.draft,
    loading: input.loading,
    saving: input.saving,
    pickerBusy: input.pickerBusy,
    error: input.error,
    activeSessionId: input.activeSessionId,
    activeConnectionId: input.activeConnectionId,
    pendingConnectionId: input.pendingConnectionId,
    tailPhase: input.tailPhase,
    tailPreview: input.tailPreview,
    tailStatus: input.tailStatus,
    testStatusById: input.testStatusById,
    testMessageById: input.testMessageById,
    setDraft: input.setDraft,
    refreshConnections: input.refreshConnections,
    resetForm: input.resetForm,
    loadConnectionIntoForm: input.loadConnectionIntoForm,
    handleBrowseFile: input.handleBrowseFile,
    handleSaveConnection: input.handleSaveConnection,
    handleStartTail: input.handleStartTail,
    handleStopTail: input.handleStopTail,
    handleDeleteConnection: input.handleDeleteConnection,
    handleTestConnection: input.handleTestConnection,
  };
}
