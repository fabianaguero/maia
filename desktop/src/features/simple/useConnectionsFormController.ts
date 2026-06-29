import { useEffect, useState } from "react";

import {
  deleteLogSourceConnection,
  listLogSourceConnections,
  pickRepositoryFile,
  upsertLogSourceConnection,
} from "../../api/repositories";
import type { AppTranslations } from "../../i18n/en";
import type { LogSourceConnection } from "../../types/monitor";
import {
  createConnectionDraftFromConnection,
  createEmptyConnectionDraft,
  type ConnectionDraft,
} from "./connectionsViewModel";
import {
  browseConnectionFileState,
  deleteConnectionState,
  refreshConnectionsState,
  saveConnectionState,
} from "./connectionsScreenStateRuntime";

interface UseConnectionsFormControllerInput {
  t: AppTranslations;
  defaultCloudLookback: string;
}

export function useConnectionsFormController(input: UseConnectionsFormControllerInput) {
  const [connections, setConnections] = useState<LogSourceConnection[]>([]);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ConnectionDraft>(() =>
    createEmptyConnectionDraft(input.defaultCloudLookback),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshConnections() {
    await refreshConnectionsState({
      setLoading,
      setError,
      setConnections,
      listLogSourceConnections,
    });
  }

  useEffect(() => {
    void refreshConnections();
  }, []);

  function resetForm() {
    setEditingConnectionId(null);
    setDraft(createEmptyConnectionDraft(input.defaultCloudLookback));
  }

  function loadConnectionIntoForm(connection: LogSourceConnection) {
    setEditingConnectionId(connection.id);
    setDraft(createConnectionDraftFromConnection(connection));
    setError(null);
  }

  async function handleBrowseFile() {
    await browseConnectionFileState({
      sourcePath: draft.sourcePath,
      setPickerBusy,
      setError,
      setDraft,
      pickRepositoryFile,
      fallbackErrorMessage: input.t.simpleMode.connections.nativeFilePickerFailed,
    });
  }

  async function handleSaveConnection() {
    await saveConnectionState({
      draft,
      editingConnectionId,
      t: input.t,
      setSaving,
      setError,
      upsertLogSourceConnection,
      onAfterSave: async () => {
        resetForm();
        await refreshConnections();
      },
    });
  }

  async function handleDeleteConnection(id: string) {
    await deleteConnectionState({
      id,
      editingConnectionId,
      setError,
      deleteLogSourceConnection,
      resetForm,
      refreshConnections,
    });
  }

  return {
    connections,
    editingConnectionId,
    draft,
    loading,
    saving,
    pickerBusy,
    error,
    setDraft,
    setError,
    refreshConnections,
    resetForm,
    loadConnectionIntoForm,
    handleBrowseFile,
    handleSaveConnection,
    handleDeleteConnection,
  };
}
