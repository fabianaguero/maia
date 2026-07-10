import type { MonitorProviderOrchestrationControllerState } from "./monitorProviderControllerStateTypes";
import type { BuildMonitorProviderRuntimeOrchestrationDependencies } from "./monitorProviderControllerInputBaseTypes";

export interface BuildMonitorProviderRuntimeOrchestrationFromStateInput {
  logger: BuildMonitorProviderRuntimeOrchestrationDependencies["logger"];
  state: MonitorProviderOrchestrationControllerState;
  buildReloadPendingGuideTrack: BuildMonitorProviderRuntimeOrchestrationDependencies["buildReloadPendingGuideTrack"];
  pollStreamSession: BuildMonitorProviderRuntimeOrchestrationDependencies["pollStreamSession"];
  pollLogStream: BuildMonitorProviderRuntimeOrchestrationDependencies["pollLogStream"];
  ingestStreamChunk: BuildMonitorProviderRuntimeOrchestrationDependencies["ingestStreamChunk"];
  fetchText: BuildMonitorProviderRuntimeOrchestrationDependencies["fetchText"];
  updatePersistedSessionCursor: BuildMonitorProviderRuntimeOrchestrationDependencies["updatePersistedSessionCursor"];
  insertSessionEvent: BuildMonitorProviderRuntimeOrchestrationDependencies["insertSessionEvent"];
  updatePersistedSessionStatus: BuildMonitorProviderRuntimeOrchestrationDependencies["updatePersistedSessionStatus"];
}

export type MonitorProviderRuntimeOrchestrationStateDependencies = Pick<
  BuildMonitorProviderRuntimeOrchestrationDependencies,
  | "sessionRef"
  | "setSession"
  | "setIsPlayback"
  | "setMetrics"
  | "audioContextRef"
  | "setAudioContext"
  | "guideTrackRef"
  | "guideTrackCursorRef"
  | "guideTrackFinishedRef"
  | "replayEventsRef"
  | "replayMetricsRef"
  | "replayIndexRef"
  | "replayHydratingRef"
  | "replayHydrationTokenRef"
  | "playbackPausedRef"
  | "setPlaybackProgress"
  | "setIsPlaybackPaused"
  | "setPlaybackEventIndex"
  | "setPlaybackEventCount"
  | "activeRef"
  | "pollTimerRef"
  | "wsRef"
  | "wsLineBufferRef"
  | "httpUrlRef"
  | "directCursorRef"
  | "emptyWindowsRef"
  | "pollIndexRef"
  | "isPlaybackRef"
  | "listenersRef"
  | "recentUpdatesRef"
  | "activeTemplateRef"
  | "setActiveTemplateState"
>;
