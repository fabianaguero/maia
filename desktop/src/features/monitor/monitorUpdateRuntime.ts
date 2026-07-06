import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorMetrics } from "./monitorContextTypes";
import { dispatchMonitorStreamListeners } from "./monitorUpdateListenerRuntime";
import { persistMonitorStreamUpdateState } from "./monitorUpdatePersistenceRuntime";
import type { ApplyMonitorStreamUpdateStateInput } from "./monitorUpdateTypes";

export type {
  MonitorListenerRuntimeLogger,
  PersistedMonitorCursorUpdate,
} from "./monitorUpdateTypes";
export {
  dispatchMonitorStreamListeners,
  subscribeToMonitorStreamState,
} from "./monitorUpdateListenerRuntime";
export {
  buildPersistedMonitorCursorUpdate,
  buildSessionEventInsertInput,
  persistMonitorStreamUpdateState,
} from "./monitorUpdatePersistenceRuntime";

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

export function applyMonitorStreamUpdateState(input: ApplyMonitorStreamUpdateStateInput): {
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

    if (persistPlaybackEvent) {
      nextPollIndex = persistMonitorStreamUpdateState({
        persistedSessionId: input.persistedSessionId,
        pollIndex: nextPollIndex,
        update: input.update,
        updatePersistedCursor: input.updatePersistedCursor,
        insertPersistedEvent: input.insertPersistedEvent,
      });
    }
  }

  input.logger?.trace?.("dispatching to %d listeners", [...input.listeners].length);
  const dispatchedListeners = dispatchMonitorStreamListeners(input.listeners, input.update);
  return {
    nextPollIndex,
    dispatchedListeners,
  };
}
