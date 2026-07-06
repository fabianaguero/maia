import type { BuildMonitorProviderRuntimeOrchestrationDependencies } from "./monitorProviderControllerInputBaseTypes";

export type MonitorProviderRuntimeOrchestrationExternalDependencies = Pick<
  BuildMonitorProviderRuntimeOrchestrationDependencies,
  | "logger"
  | "buildReloadPendingGuideTrack"
  | "pollStreamSession"
  | "pollLogStream"
  | "ingestStreamChunk"
  | "fetchText"
  | "updatePersistedSessionCursor"
  | "insertSessionEvent"
  | "updatePersistedSessionStatus"
>;
