import type { AppTranslations } from "../../i18n/types";
import type { LogSourceConnection } from "../../types/monitor";
import {
  buildConnectionsScreenHookState,
  buildConnectionsScreenViewModel,
  type ConnectionsScreenHookState,
} from "./connectionsScreenHookRuntime";
import {
  buildConnectionKindLabelMap,
  type ConnectionDraft,
  type ConnectionKind,
} from "./connectionsViewModel";

export interface ConnectionsScreenFormControllerState {
  connections: LogSourceConnection[];
  editingConnectionId: string | null;
  draft: ConnectionDraft;
  loading: boolean;
  saving: boolean;
  pickerBusy: boolean;
  error: string | null;
  setDraft: ConnectionsScreenHookState["setDraft"];
  refreshConnections: ConnectionsScreenHookState["refreshConnections"];
  resetForm: ConnectionsScreenHookState["resetForm"];
  loadConnectionIntoForm: ConnectionsScreenHookState["loadConnectionIntoForm"];
  handleBrowseFile: ConnectionsScreenHookState["handleBrowseFile"];
  handleSaveConnection: ConnectionsScreenHookState["handleSaveConnection"];
  handleDeleteConnection: ConnectionsScreenHookState["handleDeleteConnection"];
}

export interface ConnectionsScreenTailControllerState {
  activeSessionId: string | null;
  activeConnectionId: string | null;
  pendingConnectionId: string | null;
  tailPhase: "starting" | "stopping" | null;
  tailPreview: string[];
  tailStatus: string | null;
  handleStartTail: ConnectionsScreenHookState["handleStartTail"];
  handleStopTail: ConnectionsScreenHookState["handleStopTail"];
}

export interface ConnectionsScreenTestControllerState {
  testStatusById: ConnectionsScreenHookState["testStatusById"];
  testMessageById: ConnectionsScreenHookState["testMessageById"];
  handleTestConnection: ConnectionsScreenHookState["handleTestConnection"];
}

export function buildConnectionsScreenControllerState(input: {
  t: AppTranslations;
  form: ConnectionsScreenFormControllerState;
  tail: ConnectionsScreenTailControllerState;
  test: ConnectionsScreenTestControllerState;
}): ConnectionsScreenHookState {
  const connectionKindLabel: Record<ConnectionKind, string> = {
    ...buildConnectionKindLabelMap(input.t),
  };

  return buildConnectionsScreenHookState({
    screenViewModel: buildConnectionsScreenViewModel({
      t: input.t,
      connections: input.form.connections,
    }),
    connectionKindLabel,
    connections: input.form.connections,
    editingConnectionId: input.form.editingConnectionId,
    draft: input.form.draft,
    loading: input.form.loading,
    saving: input.form.saving,
    pickerBusy: input.form.pickerBusy,
    error: input.form.error,
    activeSessionId: input.tail.activeSessionId,
    activeConnectionId: input.tail.activeConnectionId,
    pendingConnectionId: input.tail.pendingConnectionId,
    tailPhase: input.tail.tailPhase,
    tailPreview: input.tail.tailPreview,
    tailStatus: input.tail.tailStatus,
    testStatusById: input.test.testStatusById,
    testMessageById: input.test.testMessageById,
    setDraft: input.form.setDraft,
    refreshConnections: input.form.refreshConnections,
    resetForm: input.form.resetForm,
    loadConnectionIntoForm: input.form.loadConnectionIntoForm,
    handleBrowseFile: input.form.handleBrowseFile,
    handleSaveConnection: input.form.handleSaveConnection,
    handleStartTail: input.tail.handleStartTail,
    handleStopTail: input.tail.handleStopTail,
    handleDeleteConnection: input.form.handleDeleteConnection,
    handleTestConnection: input.test.handleTestConnection,
  });
}
