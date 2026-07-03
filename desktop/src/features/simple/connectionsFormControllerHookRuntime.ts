import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection, UpsertLogSourceConnectionInput } from "../../types/monitor";
import type { ConnectionsFormControllerState } from "./connectionsFormControllerRuntime";
import type { ConnectionDraft } from "./connectionsViewModel";

export interface ConnectionsFormControllerApi {
  listLogSourceConnections: () => Promise<LogSourceConnection[]>;
  pickRepositoryFile: (initialPath?: string) => Promise<string | null>;
  upsertLogSourceConnection: (connection: UpsertLogSourceConnectionInput) => Promise<unknown>;
  deleteLogSourceConnection: (id: string) => Promise<unknown>;
}

export function buildConnectionsFormControllerApi(input: ConnectionsFormControllerApi) {
  return input;
}

export function buildConnectionsFormControllerRefreshInput(input: {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setConnections: Dispatch<SetStateAction<LogSourceConnection[]>>;
  api: ConnectionsFormControllerApi;
}) {
  return {
    setLoading: input.setLoading,
    setError: input.setError,
    setConnections: input.setConnections,
    listLogSourceConnections: input.api.listLogSourceConnections,
  };
}

export function buildConnectionsFormControllerBrowseInput(input: {
  sourcePath: string;
  setPickerBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  api: ConnectionsFormControllerApi;
  t: AppTranslations;
}) {
  return {
    sourcePath: input.sourcePath,
    setPickerBusy: input.setPickerBusy,
    setError: input.setError,
    setDraft: input.setDraft,
    pickRepositoryFile: input.api.pickRepositoryFile,
    fallbackErrorMessage: input.t.simpleMode.connections.nativeFilePickerFailed,
  };
}

export function buildConnectionsFormControllerSaveInput(input: {
  draft: ConnectionDraft;
  editingConnectionId: string | null;
  t: AppTranslations;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  api: ConnectionsFormControllerApi;
  onAfterSave: () => Promise<void>;
}) {
  return {
    draft: input.draft,
    editingConnectionId: input.editingConnectionId,
    t: input.t,
    setSaving: input.setSaving,
    setError: input.setError,
    upsertLogSourceConnection: input.api.upsertLogSourceConnection,
    onAfterSave: input.onAfterSave,
  };
}

export function buildConnectionsFormControllerDeleteInput(input: {
  id: string;
  editingConnectionId: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  api: ConnectionsFormControllerApi;
  resetForm: () => void;
  refreshConnections: () => Promise<void>;
}) {
  return {
    id: input.id,
    editingConnectionId: input.editingConnectionId,
    setError: input.setError,
    deleteLogSourceConnection: input.api.deleteLogSourceConnection,
    resetForm: input.resetForm,
    refreshConnections: input.refreshConnections,
  };
}

export function buildConnectionsFormControllerHookResult(input: ConnectionsFormControllerState) {
  return input;
}
