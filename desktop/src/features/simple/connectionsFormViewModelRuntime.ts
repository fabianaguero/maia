import type { AppTranslations } from "../../i18n/en";
import type { ConnectionDraft, ConnectionKind } from "./connectionsDraftRuntime";

export interface ConnectionsFormViewModel {
  title: string;
  help: string;
  kindOptions: Array<{
    id: ConnectionKind;
    label: string;
    description: string;
    isActive: boolean;
  }>;
  isFileLog: boolean;
  labelPlaceholder: string;
  primaryActionLabel: string;
}

export function buildConnectionKindLabelMap(t: AppTranslations): Record<ConnectionKind, string> {
  return {
    file_log: t.simpleMode.connections.fileLog,
    gcp_cloud_run: t.simpleMode.connections.gcpCloudRun,
  };
}

export function buildConnectionsFormViewModel(input: {
  draft: ConnectionDraft;
  editingConnectionId: string | null;
  saving: boolean;
  t: AppTranslations;
}): ConnectionsFormViewModel {
  const isEditing = input.editingConnectionId !== null;
  const isFileLog = input.draft.kind === "file_log";

  return {
    title: isEditing
      ? input.t.simpleMode.connections.editConnection
      : input.t.simpleMode.connections.newConnection,
    help: isEditing
      ? input.t.simpleMode.connections.editConnectionHelp
      : input.t.simpleMode.connections.newConnectionHelp,
    kindOptions: [
      {
        id: "file_log",
        label: input.t.simpleMode.connections.fileLog,
        description: input.t.simpleMode.connections.fileLogDescription,
        isActive: isFileLog,
      },
      {
        id: "gcp_cloud_run",
        label: input.t.simpleMode.connections.gcpCloudRun,
        description: input.t.simpleMode.connections.gcpCloudRunDescription,
        isActive: input.draft.kind === "gcp_cloud_run",
      },
    ],
    isFileLog,
    labelPlaceholder: isFileLog
      ? input.t.simpleMode.connections.fileLabelPlaceholder
      : input.t.simpleMode.connections.cloudLabelPlaceholder,
    primaryActionLabel: input.saving
      ? input.t.simpleMode.status.loading
      : isEditing
        ? input.t.simpleMode.connections.updateConnection
        : input.t.simpleMode.connections.saveConnection,
  };
}
