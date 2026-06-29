import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import { buildReplayCumulativeMetrics } from "../../utils/replay";
import type {
  MonitorPlaybackRuntimeLogger,
  PreparedPlaybackMonitorSession,
} from "./monitorPlaybackSessionRuntime";

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type RebuildReplayEventsFromSourceFn = (input: {
  sessionId: string;
  sourcePath: string;
}) => Promise<SessionEvent[]>;

export async function hydrateReplayFromSourceState(input: {
  sessionId: string;
  sourcePath: string;
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
}): Promise<void> {
  try {
    const rebuiltEvents = await input.rebuildReplayEventsFromSource({
      sessionId: input.sessionId,
      sourcePath: input.sourcePath,
    });
    if (
      input.replayHydrationTokenRef.current !== input.hydrationToken ||
      input.sessionRef.current?.persistedSessionId !== input.sessionId
    ) {
      return;
    }

    if (rebuiltEvents.length > input.replayEventsRef.current.length) {
      input.replayEventsRef.current = rebuiltEvents;
      input.replayMetricsRef.current = buildReplayCumulativeMetrics(rebuiltEvents);
      input.syncReplayTelemetry(Math.min(input.replayIndexRef.current, rebuiltEvents.length));
      input.logger.info(
        "playbackSession rebuilt replay windows from source → %d events",
        rebuiltEvents.length,
      );
    }
  } catch (error) {
    if (input.replayHydrationTokenRef.current !== input.hydrationToken) {
      return;
    }
    input.logger.warn(
      "playbackSession replay rebuild failed: %s",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (input.replayHydrationTokenRef.current === input.hydrationToken) {
      input.replayHydratingRef.current = false;
      if (
        input.activeRef.current &&
        !input.playbackPausedRef.current &&
        input.pollTimerRef.current === null
      ) {
        input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, 0);
      }
    }
  }
}

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
