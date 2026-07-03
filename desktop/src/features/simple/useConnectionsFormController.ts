import {
  deleteLogSourceConnection,
  listLogSourceConnections,
  pickRepositoryFile,
  upsertLogSourceConnection,
} from "../../api/repositories";
import type { AppTranslations } from "../../i18n/types";
import { buildConnectionsFormControllerState } from "./connectionsFormControllerRuntime";
import {
  buildConnectionsFormControllerApi,
  buildConnectionsFormControllerHookResult,
} from "./connectionsFormControllerHookRuntime";
import { useConnectionsFormActions } from "./useConnectionsFormActions";
import { useConnectionsFormLocalState } from "./useConnectionsFormLocalState";

interface UseConnectionsFormControllerInput {
  t: AppTranslations;
  defaultCloudLookback: string;
}

export function useConnectionsFormController(input: UseConnectionsFormControllerInput) {
  const api = buildConnectionsFormControllerApi({
    listLogSourceConnections,
    pickRepositoryFile,
    upsertLogSourceConnection,
    deleteLogSourceConnection,
  });
  const localState = useConnectionsFormLocalState(input.defaultCloudLookback);
  const actions = useConnectionsFormActions({
    api,
    t: input.t,
    defaultCloudLookback: input.defaultCloudLookback,
    state: localState,
  });

  return buildConnectionsFormControllerHookResult(
    buildConnectionsFormControllerState({
      connections: localState.connections,
      editingConnectionId: localState.editingConnectionId,
      draft: localState.draft,
      loading: localState.loading,
      saving: localState.saving,
      pickerBusy: localState.pickerBusy,
      error: localState.error,
      setDraft: localState.setDraft,
      setError: localState.setError,
      refreshConnections: actions.refreshConnections,
      resetForm: actions.resetForm,
      loadConnectionIntoForm: actions.loadConnectionIntoForm,
      handleBrowseFile: actions.handleBrowseFile,
      handleSaveConnection: actions.handleSaveConnection,
      handleDeleteConnection: actions.handleDeleteConnection,
    }),
  );
}
