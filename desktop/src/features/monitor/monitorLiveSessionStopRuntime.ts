import type { MutableRefObject } from "react";

import { resetMonitorSessionState } from "./monitorOrchestrationRuntime";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import { clearMonitorAudioState } from "./monitorLiveAudioLifecycleRuntime";
import {
  applyStoppedMonitorSessionEffects,
  resolveStoppedMonitorSessionEffects,
} from "./monitorLiveSessionStopEffectRuntime";

export { resolveStoppedMonitorSessionEffects } from "./monitorLiveSessionStopEffectRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type ResetReplayTelemetryFn = () => void;

export async function stopLiveMonitorSessionState(input: {
  session: ActiveMonitorSession | null;
  wasPlayback: boolean;
  stopAllMonitorAudio: () => void;
  currentSegmentRef: MutableRefObject<unknown | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  stopPolling: () => void;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setMetrics: SetMetricsState;
  resetReplayTelemetry: ResetReplayTelemetryFn;
  updatePersistedSessionStatus: (
    id: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void> | void;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
}): Promise<void> {
  clearMonitorAudioState({
    stopAllMonitorAudio: input.stopAllMonitorAudio,
    currentSegmentRef: input.currentSegmentRef,
    audioContextRef: input.audioContextRef,
  });

  input.stopPolling();
  resetMonitorSessionState({
    sessionRef: input.sessionRef,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setMetrics: input.setMetrics,
    resetReplayTelemetry: input.resetReplayTelemetry,
  });

  const stopEffects = resolveStoppedMonitorSessionEffects({
    session: input.session,
    wasPlayback: input.wasPlayback,
  });
  await applyStoppedMonitorSessionEffects({
    ...stopEffects,
    updatePersistedSessionStatus: input.updatePersistedSessionStatus,
    stopStreamSession: input.stopStreamSession,
  });
}
