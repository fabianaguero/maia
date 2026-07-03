import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { buildMonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";
import type { BuildLiveStartInputFn } from "./monitorProviderSessionActionTypes";

export interface MonitorProviderAudioStartHookDeps {
  resetReplayTelemetry: () => void;
  doPoll: () => Promise<void>;
  ensureProviderAudioContext: () => Promise<AudioContext>;
}

export function buildMonitorProviderLiveStartHookInput(input: {
  source: UseMonitorProviderRuntimeOrchestrationInput;
  deps: MonitorProviderAudioStartHookDeps;
  reason: Parameters<BuildLiveStartInputFn>[0];
  includeProbe: Parameters<BuildLiveStartInputFn>[1];
  emitProbe: ((context: AudioContext) => void) | undefined;
  runProviderPoll: () => void;
}) {
  const { live, persistence, session, template } = input.source;

  return buildMonitorProviderLiveStartBaseInput({
    directCursorRef: live.directCursorRef,
    emptyWindowsRef: live.emptyWindowsRef,
    pollIndexRef: live.pollIndexRef,
    activeTemplateRef: template.activeTemplateRef,
    setActiveTemplateState: template.setActiveTemplateState,
    updatePersistedSessionStatus: persistence.updatePersistedSessionStatus,
    sessionRef: session.sessionRef,
    activeRef: live.activeRef,
    isPlaybackRef: live.isPlaybackRef,
    setSession: session.setSession,
    setIsPlayback: session.setIsPlayback,
    setMetrics: session.setMetrics,
    resetReplayTelemetry: input.deps.resetReplayTelemetry,
    ensureAudioContext: input.deps.ensureProviderAudioContext,
    emitProbe: input.includeProbe ? input.emitProbe : undefined,
    reloadPendingGuideTrack: template.buildReloadPendingGuideTrack(input.reason),
    doPoll: input.runProviderPoll,
  });
}
