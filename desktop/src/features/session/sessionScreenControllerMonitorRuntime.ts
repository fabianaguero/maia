import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";

export function buildSessionScreenControllerMonitorSnapshot(input: {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  isPlaybackPaused: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
}) {
  return {
    monitorSessionId: input.session?.sessionId ?? null,
    monitorHasSession: Boolean(input.session),
    monitorSession: input.session,
    monitorMetrics: input.metrics,
    subscribeToMonitor: input.subscribe,
    isPlaybackPaused: input.isPlaybackPaused,
    playbackEventIndex: input.playbackEventIndex,
    playbackEventCount: input.playbackEventCount,
  };
}
