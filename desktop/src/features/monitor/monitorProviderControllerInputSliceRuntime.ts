import type { MonitorProviderOrchestrationControllerState } from "./monitorProviderControllerStateTypes";
import type {
  BuildMonitorProviderRuntimeOrchestrationFromStateInput,
  MonitorProviderRuntimeOrchestrationExternalDependencies,
  MonitorProviderRuntimeOrchestrationStateDependencies,
} from "./monitorProviderControllerInputTypes";

export function buildMonitorProviderRuntimeOrchestrationStateDependencies(
  state: MonitorProviderOrchestrationControllerState,
): MonitorProviderRuntimeOrchestrationStateDependencies {
  return {
    sessionRef: state.sessionRef,
    setSession: state.setSession,
    setIsPlayback: state.setIsPlayback,
    setMetrics: state.setMetrics,
    audioContextRef: state.audioContextRef,
    setAudioContext: state.setAudioContext,
    guideTrackRef: state.guideTrackRef,
    guideTrackCursorRef: state.guideTrackCursorRef,
    guideTrackFinishedRef: state.guideTrackFinishedRef,
    replayEventsRef: state.replayEventsRef,
    replayMetricsRef: state.replayMetricsRef,
    replayIndexRef: state.replayIndexRef,
    replayHydratingRef: state.replayHydratingRef,
    replayHydrationTokenRef: state.replayHydrationTokenRef,
    playbackPausedRef: state.playbackPausedRef,
    setPlaybackProgress: state.setPlaybackProgress,
    setIsPlaybackPaused: state.setIsPlaybackPaused,
    setPlaybackEventIndex: state.setPlaybackEventIndex,
    setPlaybackEventCount: state.setPlaybackEventCount,
    activeRef: state.activeRef,
    pollTimerRef: state.pollTimerRef,
    wsRef: state.wsRef,
    wsLineBufferRef: state.wsLineBufferRef,
    httpUrlRef: state.httpUrlRef,
    directCursorRef: state.directCursorRef,
    emptyWindowsRef: state.emptyWindowsRef,
    pollIndexRef: state.pollIndexRef,
    isPlaybackRef: state.isPlaybackRef,
    listenersRef: state.listenersRef,
    activeTemplateRef: state.activeTemplateRef,
    setActiveTemplateState: state.setActiveTemplateState,
  };
}

export function buildMonitorProviderRuntimeOrchestrationExternalDependencies(
  input: BuildMonitorProviderRuntimeOrchestrationFromStateInput,
): MonitorProviderRuntimeOrchestrationExternalDependencies {
  return {
    logger: input.logger,
    buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
    pollStreamSession: input.pollStreamSession,
    pollLogStream: input.pollLogStream,
    ingestStreamChunk: input.ingestStreamChunk,
    fetchText: input.fetchText,
    updatePersistedSessionCursor: input.updatePersistedSessionCursor,
    insertSessionEvent: input.insertSessionEvent,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
  };
}
