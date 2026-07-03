import { useCallback, useEffect } from "react";

import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection } from "../../types/monitor";
import {
  buildConnectionsFormLoadState,
  buildConnectionsFormResetState,
} from "./connectionsFormControllerRuntime";
import {
  buildConnectionsFormControllerBrowseInput,
  buildConnectionsFormControllerDeleteInput,
  buildConnectionsFormControllerRefreshInput,
  buildConnectionsFormControllerSaveInput,
  type ConnectionsFormControllerApi,
} from "./connectionsFormControllerHookRuntime";
import {
  browseConnectionFileState,
  deleteConnectionState,
  refreshConnectionsState,
  saveConnectionState,
} from "./connectionsScreenStateRuntime";
import type { ConnectionsFormLocalState } from "./useConnectionsFormLocalState";

interface UseConnectionsFormActionsInput {
  api: ConnectionsFormControllerApi;
  t: AppTranslations;
  defaultCloudLookback: string;
  state: ConnectionsFormLocalState;
}

export function useConnectionsFormActions({
  api,
  t,
  defaultCloudLookback,
  state,
}: UseConnectionsFormActionsInput) {
  const refreshConnections = useCallback(async () => {
    await refreshConnectionsState(
      buildConnectionsFormControllerRefreshInput({
        setLoading: state.setLoading,
        setError: state.setError,
        setConnections: state.setConnections,
        api,
      }),
    );
  }, [api, state.setConnections, state.setError, state.setLoading]);

  useEffect(() => {
    void refreshConnections();
  }, [refreshConnections]);

  function resetForm() {
    const nextState = buildConnectionsFormResetState(defaultCloudLookback);
    state.setEditingConnectionId(nextState.editingConnectionId);
    state.setDraft(nextState.draft);
  }

  function loadConnectionIntoForm(connection: LogSourceConnection) {
    const nextState = buildConnectionsFormLoadState(connection);
    state.setEditingConnectionId(nextState.editingConnectionId);
    state.setDraft(nextState.draft);
    state.setError(nextState.error);
  }

  async function handleBrowseFile() {
    await browseConnectionFileState(
      buildConnectionsFormControllerBrowseInput({
        sourcePath: state.draft.sourcePath,
        setPickerBusy: state.setPickerBusy,
        setError: state.setError,
        setDraft: state.setDraft,
        api,
        t,
      }),
    );
  }

  async function handleSaveConnection() {
    await saveConnectionState(
      buildConnectionsFormControllerSaveInput({
        draft: state.draft,
        editingConnectionId: state.editingConnectionId,
        t,
        setSaving: state.setSaving,
        setError: state.setError,
        api,
        onAfterSave: async () => {
          resetForm();
          await refreshConnections();
        },
      }),
    );
  }

  async function handleDeleteConnection(id: string) {
    await deleteConnectionState(
      buildConnectionsFormControllerDeleteInput({
        id,
        editingConnectionId: state.editingConnectionId,
        setError: state.setError,
        api,
        resetForm,
        refreshConnections,
      }),
    );
  }

  return {
    refreshConnections,
    resetForm,
    loadConnectionIntoForm,
    handleBrowseFile,
    handleSaveConnection,
    handleDeleteConnection,
  };
}
