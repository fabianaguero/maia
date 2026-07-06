import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import { activatePlaybackMonitorSessionState } from "./monitorOrchestrationRuntime";
import { buildReplayCumulativeMetrics } from "../../utils/replay";
import type { PreparedPlaybackMonitorSession } from "./monitorPlaybackSessionTypes";

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type SetBooleanState = (value: boolean) => void;
type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetMetricsState = (value: MonitorMetrics) => void;

export type {
  MonitorPlaybackRuntimeLogger,
  PlaybackSessionSelection,
  PreparedPlaybackMonitorSession,
} from "./monitorPlaybackSessionTypes";
export { createPlaybackMonitorSession } from "./monitorPlaybackSessionFactoryRuntime";
export { finalizePlaybackMonitorSessionSetupState } from "./monitorPlaybackSessionSetupRuntime";
export { preparePlaybackMonitorSessionState } from "./monitorPlaybackSessionPrepareRuntime";

export function activatePreparedPlaybackMonitorSessionState(input: {
  prepared: PreparedPlaybackMonitorSession;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setIsPlaybackPaused: SetBooleanState;
  setMetrics: SetMetricsState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
}): number {
  return activatePlaybackMonitorSessionState({
    session: input.prepared.session,
    events: input.prepared.events,
    cumulativeMetrics: buildReplayCumulativeMetrics(input.prepared.events),
    shouldHydrateReplay: input.prepared.shouldHydrateReplay,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    playbackPausedRef: input.playbackPausedRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setMetrics: input.setMetrics,
    syncReplayTelemetry: input.syncReplayTelemetry,
  });
}
