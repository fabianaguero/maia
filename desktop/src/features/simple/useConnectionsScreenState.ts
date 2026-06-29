import {
  pollStreamSession,
  startLogSourceConnection,
  stopStreamSession,
} from "../../api/repositories";
import type { AppTranslations } from "../../i18n/en";
import {
  buildConnectionKindLabelMap,
  type ConnectionKind,
} from "./connectionsViewModel";
import {
  buildConnectionsScreenHookState,
  buildConnectionsScreenViewModel,
} from "./connectionsRuntime";
import { useConnectionTailController } from "./useConnectionTailController";
import { useConnectionTestController } from "./useConnectionTestController";
import { useConnectionsFormController } from "./useConnectionsFormController";

export function useConnectionsScreenState(input: {
  t: AppTranslations;
  defaultCloudLookback: string;
}) {
  const {
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
  } = useConnectionsFormController({
    t: input.t,
    defaultCloudLookback: input.defaultCloudLookback,
  });

  const screenViewModel = buildConnectionsScreenViewModel({
    t: input.t,
    connections,
  });
  const connectionKindLabel: Record<ConnectionKind, string> = {
    ...buildConnectionKindLabelMap(input.t),
  };

  const {
    activeSessionId,
    activeConnectionId,
    tailPreview,
    tailStatus,
    handleStartTail,
    handleStopTail,
  } = useConnectionTailController({
    t: input.t,
    setError,
    pollStreamSession,
    startLogSourceConnection,
    stopStreamSession,
  });

  const { testStatusById, testMessageById, handleTestConnection } =
    useConnectionTestController({
      t: input.t,
      setError,
      startLogSourceConnection,
      pollStreamSession,
      stopStreamSession,
    });

  return buildConnectionsScreenHookState({
    screenViewModel,
    connectionKindLabel,
    connections,
    editingConnectionId,
    draft,
    loading,
    saving,
    pickerBusy,
    error,
    activeSessionId,
    activeConnectionId,
    tailPreview,
    tailStatus,
    testStatusById,
    testMessageById,
    setDraft,
    refreshConnections,
    resetForm,
    loadConnectionIntoForm,
    handleBrowseFile,
    handleSaveConnection,
    handleStartTail,
    handleStopTail,
    handleDeleteConnection,
    handleTestConnection,
  });
}
