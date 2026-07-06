export type { ConnectionDraft, ConnectionKind } from "./connectionsDraftRuntime";
export {
  createConnectionDraftFromConnection,
  createEmptyConnectionDraft,
  deriveCloudBackfillLabel,
  deriveFileConnectionLabel,
  readConfigString,
} from "./connectionsDraftRuntime";

export type { ConnectionsFormViewModel } from "./connectionsFormViewModelRuntime";
export {
  buildConnectionKindLabelMap,
  buildConnectionsFormViewModel,
} from "./connectionsFormViewModelRuntime";

export { buildConnectionUpsertInput } from "./connectionsUpsertRuntime";

export type ConnectionTestStatus = "idle" | "testing" | "success" | "error";
