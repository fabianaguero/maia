import {
  buildMonitorProviderRuntimeAudioSlice,
  buildMonitorProviderRuntimeLiveSlice,
  buildMonitorProviderRuntimePersistenceSlice,
  buildMonitorProviderRuntimePlaybackSlice,
  buildMonitorProviderRuntimeSessionSlice,
  buildMonitorProviderRuntimeTemplateSlice,
  buildMonitorProviderRuntimeTransportSlice,
} from "./monitorProviderControllerSliceRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import type { BuildMonitorProviderRuntimeOrchestrationDependencies } from "./monitorProviderControllerInputRuntime";

export function buildMonitorProviderRuntimeOrchestrationInput(
  input: BuildMonitorProviderRuntimeOrchestrationDependencies,
): UseMonitorProviderRuntimeOrchestrationInput {
  return {
    logger: input.logger,
    session: buildMonitorProviderRuntimeSessionSlice({
      sessionRef: input.sessionRef,
      setSession: input.setSession,
      setIsPlayback: input.setIsPlayback,
      setMetrics: input.setMetrics,
    }),
    audio: buildMonitorProviderRuntimeAudioSlice({
      audioContextRef: input.audioContextRef,
      setAudioContext: input.setAudioContext,
      guideTrackRef: input.guideTrackRef,
      guideTrackCursorRef: input.guideTrackCursorRef,
      guideTrackFinishedRef: input.guideTrackFinishedRef,
    }),
    playback: buildMonitorProviderRuntimePlaybackSlice({
      replayEventsRef: input.replayEventsRef,
      replayMetricsRef: input.replayMetricsRef,
      replayIndexRef: input.replayIndexRef,
      replayHydratingRef: input.replayHydratingRef,
      replayHydrationTokenRef: input.replayHydrationTokenRef,
      playbackPausedRef: input.playbackPausedRef,
      setPlaybackProgress: input.setPlaybackProgress,
      setIsPlaybackPaused: input.setIsPlaybackPaused,
      setPlaybackEventIndex: input.setPlaybackEventIndex,
      setPlaybackEventCount: input.setPlaybackEventCount,
    }),
    live: buildMonitorProviderRuntimeLiveSlice({
      activeRef: input.activeRef,
      pollTimerRef: input.pollTimerRef,
      wsRef: input.wsRef,
      wsLineBufferRef: input.wsLineBufferRef,
      httpUrlRef: input.httpUrlRef,
      directCursorRef: input.directCursorRef,
      emptyWindowsRef: input.emptyWindowsRef,
      pollIndexRef: input.pollIndexRef,
      isPlaybackRef: input.isPlaybackRef,
      listenersRef: input.listenersRef,
    }),
    template: buildMonitorProviderRuntimeTemplateSlice({
      activeTemplateRef: input.activeTemplateRef,
      setActiveTemplateState: input.setActiveTemplateState,
      buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
    }),
    transport: buildMonitorProviderRuntimeTransportSlice({
      pollStreamSession: input.pollStreamSession,
      pollLogStream: input.pollLogStream,
      ingestStreamChunk: input.ingestStreamChunk,
      fetchText: input.fetchText,
    }),
    persistence: buildMonitorProviderRuntimePersistenceSlice({
      updatePersistedSessionCursor: input.updatePersistedSessionCursor,
      insertSessionEvent: input.insertSessionEvent,
      updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    }),
  };
}
