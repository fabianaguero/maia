import type {
  MonitorProviderLiveStartBaseInput,
  MonitorProviderLiveStartSharedInput,
} from "./monitorProviderStartTypes";

export function buildMonitorProviderLiveStartState(
  input: MonitorProviderLiveStartSharedInput,
): MonitorProviderLiveStartSharedInput {
  return {
    session: input.session,
    sourceTemplateId: input.sourceTemplateId ?? null,
    persistedSessionId: input.persistedSessionId,
    startFromBeginning: input.startFromBeginning,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollIndexRef: input.pollIndexRef,
    activeTemplateRef: input.activeTemplateRef,
    setActiveTemplateState: input.setActiveTemplateState,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
    resetReplayTelemetry: input.resetReplayTelemetry,
    ensureAudioContext: input.ensureAudioContext,
    emitProbe: input.emitProbe,
    reloadPendingGuideTrack: input.reloadPendingGuideTrack,
    doPoll: input.doPoll,
    logger: input.logger,
    logLabel: input.logLabel,
  };
}

export function buildMonitorProviderLiveStartBaseInput(
  input: MonitorProviderLiveStartBaseInput,
): MonitorProviderLiveStartBaseInput {
  return {
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollIndexRef: input.pollIndexRef,
    activeTemplateRef: input.activeTemplateRef,
    setActiveTemplateState: input.setActiveTemplateState,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
    resetReplayTelemetry: input.resetReplayTelemetry,
    ensureAudioContext: input.ensureAudioContext,
    emitProbe: input.emitProbe,
    reloadPendingGuideTrack: input.reloadPendingGuideTrack,
    doPoll: input.doPoll,
    logger: input.logger,
  };
}
