import type { ActiveMonitorSession } from "./monitorContextTypes";
import { stopAllMonitorAudio } from "./monitorContextRuntime";
import { type stopLiveMonitorSessionState } from "./monitorLiveLifecycleRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export function buildStopMonitorProviderSessionInput(
  input: Pick<
    UseMonitorProviderSessionActionsInput,
    "session" | "audio" | "live" | "runtime" | "api"
  > & {
    currentSession: ActiveMonitorSession | null;
  },
): Parameters<typeof stopLiveMonitorSessionState>[0] {
  return {
    session: input.currentSession,
    wasPlayback: input.session.isPlayback,
    stopAllMonitorAudio,
    currentSegmentRef: input.audio.currentSegmentRef,
    audioContextRef: input.audio.audioContextRef,
    stopPolling: input.runtime.stopPolling,
    sessionRef: input.session.sessionRef,
    directCursorRef: input.live.directCursorRef,
    emptyWindowsRef: input.live.emptyWindowsRef,
    activeRef: input.live.activeRef,
    isPlaybackRef: input.live.isPlaybackRef,
    setSession: input.session.setSession,
    setIsPlayback: input.session.setIsPlayback,
    setMetrics: input.session.setMetrics,
    resetReplayTelemetry: input.runtime.resetReplayTelemetry,
    updatePersistedSessionStatus: input.api.updatePersistedSessionStatus,
    stopStreamSession: input.api.stopStreamSession,
  };
}
