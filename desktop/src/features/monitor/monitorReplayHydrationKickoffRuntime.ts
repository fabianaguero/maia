import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type {
  MonitorPlaybackRuntimeLogger,
  PreparedPlaybackMonitorSession,
} from "./monitorPlaybackSessionRuntime";
import { hydrateReplayFromSourceState } from "./monitorReplaySourceHydrateRuntime";

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type RebuildReplayEventsFromSourceFn = (input: {
  sessionId: string;
  sourcePath: string;
}) => Promise<SessionEvent[]>;

export function maybeHydratePlaybackReplayState(input: {
  prepared: PreparedPlaybackMonitorSession;
  hydrationToken: number;
  replayHydrationTokenRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  rebuildReplayEventsFromSource: RebuildReplayEventsFromSourceFn;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  replayTick: () => void;
  logger: MonitorPlaybackRuntimeLogger;
}): void {
  if (!input.prepared.shouldHydrateReplay) {
    return;
  }

  void hydrateReplayFromSourceState({
    sessionId: input.prepared.session.persistedSessionId ?? input.prepared.session.sessionId,
    sourcePath: input.prepared.session.sourcePath,
    hydrationToken: input.hydrationToken,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    sessionRef: input.sessionRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    activeRef: input.activeRef,
    playbackPausedRef: input.playbackPausedRef,
    pollTimerRef: input.pollTimerRef,
    syncReplayTelemetry: input.syncReplayTelemetry,
    rebuildReplayEventsFromSource: input.rebuildReplayEventsFromSource,
    setTimeoutFn: input.setTimeoutFn,
    replayTick: input.replayTick,
    logger: input.logger,
  });
}
