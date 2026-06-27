import type { InsertSessionEventInput } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type {
  MonitorMetrics,
  StreamListener,
} from "./monitorContextTypes";

export interface MonitorListenerRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
  trace?: (message: string, ...args: unknown[]) => void;
}

type SetMetricsState = (
  updater: MonitorMetrics | ((previous: MonitorMetrics) => MonitorMetrics),
) => void;

export interface PersistedMonitorCursorUpdate {
  sessionId: string;
  toOffset: number;
  lineCount: number;
  anomalyCount: number;
  suggestedBpm: number | null;
}

export function accumulateMonitorMetrics(
  previous: MonitorMetrics,
  update: LiveLogStreamUpdate,
): MonitorMetrics {
  return {
    windowCount: previous.windowCount + 1,
    processedLines: previous.processedLines + update.lineCount,
    totalAnomalies: previous.totalAnomalies + update.anomalyCount,
  };
}

export function buildSessionEventInsertInput(input: {
  sessionId: string;
  pollIndex: number;
  update: LiveLogStreamUpdate;
}): InsertSessionEventInput {
  const { sessionId, pollIndex, update } = input;
  return {
    sessionId,
    pollIndex,
    fromOffset: update.fromOffset,
    toOffset: update.toOffset,
    summary: update.summary,
    suggestedBpm: update.suggestedBpm ?? null,
    confidence: update.confidence,
    dominantLevel: update.dominantLevel,
    lineCount: update.lineCount,
    anomalyCount: update.anomalyCount,
    levelCountsJson: JSON.stringify(update.levelCounts),
    anomalyMarkersJson: JSON.stringify(update.anomalyMarkers),
    topComponentsJson: JSON.stringify(update.topComponents),
    sonificationCuesJson: JSON.stringify(update.sonificationCues),
    parsedLinesJson: JSON.stringify(update.parsedLines),
    warningsJson: JSON.stringify(update.warnings),
  };
}

export function dispatchMonitorStreamListeners(
  listeners: Iterable<StreamListener>,
  update: LiveLogStreamUpdate,
): number {
  let dispatched = 0;
  for (const listener of listeners) {
    listener(update);
    dispatched += 1;
  }
  return dispatched;
}

export function applyMonitorStreamUpdateState(input: {
  update: LiveLogStreamUpdate;
  listeners: Iterable<StreamListener>;
  persistedSessionId?: string | null;
  pollIndex: number;
  accumulateMetrics?: boolean;
  persistPlaybackEvent?: boolean;
  setMetrics: SetMetricsState;
  resumeSuspendedAudioContext: () => void;
  updatePersistedCursor: (payload: PersistedMonitorCursorUpdate) => void;
  insertPersistedEvent: (payload: InsertSessionEventInput) => void;
  logger?: MonitorListenerRuntimeLogger;
}): {
  nextPollIndex: number;
  dispatchedListeners: number;
} {
  const accumulateMetrics = input.accumulateMetrics ?? true;
  const persistPlaybackEvent = input.persistPlaybackEvent ?? true;
  let nextPollIndex = input.pollIndex;

  if (input.update.hasData) {
    input.resumeSuspendedAudioContext();
    input.logger?.info?.(
      "poll hasData=true lines=%d anomalies=%d cues=%d bpm=%s",
      input.update.lineCount,
      input.update.anomalyCount,
      input.update.sonificationCues.length,
      input.update.suggestedBpm,
    );
    input.logger?.debug?.(
      "dominantLevel=%s topComponents=%d warnings=%d",
      input.update.dominantLevel,
      input.update.topComponents.length,
      input.update.warnings.length,
    );

    if (accumulateMetrics) {
      input.setMetrics((previous) => accumulateMonitorMetrics(previous, input.update));
    }

    if (input.persistedSessionId && persistPlaybackEvent) {
      input.updatePersistedCursor({
        sessionId: input.persistedSessionId,
        toOffset: input.update.toOffset,
        lineCount: input.update.lineCount,
        anomalyCount: input.update.anomalyCount,
        suggestedBpm: input.update.suggestedBpm ?? null,
      });
      input.insertPersistedEvent(
        buildSessionEventInsertInput({
          sessionId: input.persistedSessionId,
          pollIndex: nextPollIndex,
          update: input.update,
        }),
      );
      nextPollIndex += 1;
    }
  }

  input.logger?.trace?.("dispatching to %d listeners", [...input.listeners].length);
  const dispatchedListeners = dispatchMonitorStreamListeners(input.listeners, input.update);
  return {
    nextPollIndex,
    dispatchedListeners,
  };
}

export function subscribeToMonitorStreamState(input: {
  listeners: Set<StreamListener>;
  listener: StreamListener;
  logger?: MonitorListenerRuntimeLogger;
}): () => void {
  input.listeners.add(input.listener);
  input.logger?.info("subscribe → listeners=%d", input.listeners.size);

  return () => {
    input.listeners.delete(input.listener);
    input.logger?.info("unsubscribe → listeners=%d", input.listeners.size);
  };
}
