import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { MonitorMetrics, ActiveMonitorSession } from "./monitorContextTypes";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetBooleanState = (value: boolean) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SyncReplayTelemetryFn = (processedEvents: number) => void;

export function activatePlaybackMonitorSessionState(input: {
  session: ActiveMonitorSession;
  events: SessionEvent[];
  cumulativeMetrics: MonitorMetrics[];
  shouldHydrateReplay: boolean;
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
  input.sessionRef.current = input.session;
  input.setSession(input.session);
  input.setIsPlayback(true);
  input.isPlaybackRef.current = true;
  input.playbackPausedRef.current = false;
  input.setIsPlaybackPaused(false);
  input.replayEventsRef.current = input.events;
  input.replayMetricsRef.current = input.cumulativeMetrics;
  input.replayIndexRef.current = 0;
  const hydrationToken = input.replayHydrationTokenRef.current + 1;
  input.replayHydrationTokenRef.current = hydrationToken;
  input.replayHydratingRef.current = input.shouldHydrateReplay;
  input.syncReplayTelemetry(0);
  input.setMetrics(createEmptyMonitorMetrics());
  input.activeRef.current = true;
  return hydrationToken;
}
