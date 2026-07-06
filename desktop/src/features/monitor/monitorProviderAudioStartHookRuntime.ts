import type {
  MonitorProviderRuntimeLiveSlice,
  MonitorProviderRuntimePersistenceSlice,
  MonitorProviderRuntimeSessionSlice,
  MonitorProviderRuntimeTemplateSlice,
} from "./monitorProviderRuntimeOrchestrationTypes";
import { buildMonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";
import type { BuildLiveStartInputFn } from "./monitorProviderSessionActionTypes";

export interface MonitorProviderAudioStartHookDeps {
  resetReplayTelemetry: () => void;
  doPoll: () => Promise<void>;
  ensureProviderAudioContext: () => Promise<AudioContext>;
}

export function buildMonitorProviderLiveStartHookInput(input: {
  live: MonitorProviderRuntimeLiveSlice;
  persistence: MonitorProviderRuntimePersistenceSlice;
  session: MonitorProviderRuntimeSessionSlice;
  template: MonitorProviderRuntimeTemplateSlice;
  deps: MonitorProviderAudioStartHookDeps;
  reason: Parameters<BuildLiveStartInputFn>[0];
  includeProbe: Parameters<BuildLiveStartInputFn>[1];
  emitProbe: ((context: AudioContext) => void) | undefined;
  runProviderPoll: () => void;
}) {
  return buildMonitorProviderLiveStartBaseInput({
    directCursorRef: input.live.directCursorRef,
    emptyWindowsRef: input.live.emptyWindowsRef,
    pollIndexRef: input.live.pollIndexRef,
    activeTemplateRef: input.template.activeTemplateRef,
    setActiveTemplateState: input.template.setActiveTemplateState,
    updatePersistedSessionStatus: input.persistence.updatePersistedSessionStatus,
    sessionRef: input.session.sessionRef,
    activeRef: input.live.activeRef,
    isPlaybackRef: input.live.isPlaybackRef,
    setSession: input.session.setSession,
    setIsPlayback: input.session.setIsPlayback,
    setMetrics: input.session.setMetrics,
    resetReplayTelemetry: input.deps.resetReplayTelemetry,
    ensureAudioContext: input.deps.ensureProviderAudioContext,
    emitProbe: input.includeProbe ? input.emitProbe : undefined,
    reloadPendingGuideTrack: input.template.buildReloadPendingGuideTrack(input.reason),
    doPoll: input.runProviderPoll,
  });
}
