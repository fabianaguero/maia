import type { Dispatch, SetStateAction } from "react";

import type { LogSourceConnection } from "../../types/monitor";
import {
  createConnectionDraftFromConnection,
  createEmptyConnectionDraft,
  type ConnectionDraft,
} from "./connectionsViewModel";

export interface ConnectionsFormResetState {
  editingConnectionId: null;
  draft: ConnectionDraft;
}

export interface ConnectionsFormLoadState {
  editingConnectionId: string;
  draft: ConnectionDraft;
  error: null;
}

export interface ConnectionsFormControllerState {
  connections: LogSourceConnection[];
  editingConnectionId: string | null;
  draft: ConnectionDraft;
  loading: boolean;
  saving: boolean;
  pickerBusy: boolean;
  error: string | null;
  setDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  setError: Dispatch<SetStateAction<string | null>>;
  refreshConnections: () => Promise<void>;
  resetForm: () => void;
  loadConnectionIntoForm: (connection: LogSourceConnection) => void;
  handleBrowseFile: () => Promise<void>;
  handleSaveConnection: () => Promise<void>;
  handleDeleteConnection: (id: string) => Promise<void>;
}

export function buildConnectionsFormResetState(
  defaultCloudLookback: string,
): ConnectionsFormResetState {
  return {
    editingConnectionId: null,
    draft: createEmptyConnectionDraft(defaultCloudLookback),
  };
}

export function buildConnectionsFormLoadState(
  connection: LogSourceConnection,
): ConnectionsFormLoadState {
  return {
    editingConnectionId: connection.id,
    draft: createConnectionDraftFromConnection(connection),
    error: null,
  };
}

export function buildConnectionsFormControllerState(
  input: ConnectionsFormControllerState,
): ConnectionsFormControllerState {
  return {
    connections: input.connections,
    editingConnectionId: input.editingConnectionId,
    draft: input.draft,
    loading: input.loading,
    saving: input.saving,
    pickerBusy: input.pickerBusy,
    error: input.error,
    setDraft: input.setDraft,
    setError: input.setError,
    refreshConnections: input.refreshConnections,
    resetForm: input.resetForm,
    loadConnectionIntoForm: input.loadConnectionIntoForm,
    handleBrowseFile: input.handleBrowseFile,
    handleSaveConnection: input.handleSaveConnection,
    handleDeleteConnection: input.handleDeleteConnection,
  };
}
