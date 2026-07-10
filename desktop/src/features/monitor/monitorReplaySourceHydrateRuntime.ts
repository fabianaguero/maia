import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import { buildReplayCumulativeMetrics } from "../../utils/replay";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type { MonitorPlaybackRuntimeLogger } from "./monitorPlaybackSessionRuntime";

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type RebuildReplayEventsFromSourceFn = (input: {
  sessionId: string;
  sourcePath: string;
}) => Promise<SessionEvent[]>;

function countParsedReplayLines(events: SessionEvent[]): number {
  return events.reduce((total, event) => {
    try {
      const parsedLines: unknown = JSON.parse(event.parsedLinesJson);
      if (!Array.isArray(parsedLines)) {
        return total;
      }

      return (
        total +
        parsedLines.filter((line) => {
          if (typeof line !== "string") {
            return true;
          }
          return !line.includes("MAIA_MONITOR_INITIALIZED");
        }).length
      );
    } catch {
      return total;
    }
  }, 0);
}

function shouldReplaceReplayEvents(input: {
  currentEvents: SessionEvent[];
  rebuiltEvents: SessionEvent[];
}): boolean {
  if (input.rebuiltEvents.length === 0) {
    return false;
  }

  if (input.rebuiltEvents.length > input.currentEvents.length) {
    return true;
  }

  return countParsedReplayLines(input.rebuiltEvents) > countParsedReplayLines(input.currentEvents);
}

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

    if (
      shouldReplaceReplayEvents({
        currentEvents: input.replayEventsRef.current,
        rebuiltEvents,
      })
    ) {
      input.replayEventsRef.current = rebuiltEvents;
      input.replayMetricsRef.current = buildReplayCumulativeMetrics(rebuiltEvents);
      input.replayIndexRef.current = Math.min(input.replayIndexRef.current, rebuiltEvents.length);
      if (input.replayIndexRef.current >= rebuiltEvents.length) {
        input.replayIndexRef.current = 0;
      }
      input.syncReplayTelemetry(input.replayIndexRef.current);
      input.logger.info(
        "playbackSession rebuilt replay windows from source → %d events, %d parsed lines",
        rebuiltEvents.length,
        countParsedReplayLines(rebuiltEvents),
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
