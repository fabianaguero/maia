import type { MutableRefObject } from "react";

import type { InsertSessionEventInput } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import {
  applyMonitorStreamUpdateState,
  type MonitorListenerRuntimeLogger,
  type PersistedMonitorCursorUpdate,
} from "./monitorUpdateRuntime";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";

type SetMetricsState = (
  updater: MonitorMetrics | ((previous: MonitorMetrics) => MonitorMetrics),
) => void;

export function emitMonitorProviderUpdateState(input: {
  update: LiveLogStreamUpdate;
  listenersRef: MutableRefObject<Set<StreamListener>>;
  recentUpdatesRef: MutableRefObject<LiveLogStreamUpdate[]>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  pollIndexRef: MutableRefObject<number>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  setMetrics: SetMetricsState;
  updatePersistedCursor: (payload: PersistedMonitorCursorUpdate) => void;
  insertPersistedEvent: (payload: InsertSessionEventInput) => void;
  logger?: MonitorListenerRuntimeLogger;
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  };
}): {
  nextPollIndex: number;
  dispatchedListeners: number;
} {
  if (
    input.update.hasData ||
    input.update.parsedLines.length > 0 ||
    input.update.warnings.length > 0
  ) {
    input.recentUpdatesRef.current = [...input.recentUpdatesRef.current, input.update].slice(-24);
  }

  const result = applyMonitorStreamUpdateState({
    update: input.update,
    listeners: input.listenersRef.current,
    persistedSessionId: input.sessionRef.current?.persistedSessionId,
    pollIndex: input.pollIndexRef.current,
    accumulateMetrics: input.options?.accumulateMetrics,
    persistPlaybackEvent: input.options?.persistPlaybackEvent,
    setMetrics: input.setMetrics,
    resumeSuspendedAudioContext: () => {
      const ctx = input.audioContextRef.current;
      if (ctx && ctx.state === "suspended") {
        void ctx.resume();
      }
    },
    updatePersistedCursor: input.updatePersistedCursor,
    insertPersistedEvent: input.insertPersistedEvent,
    logger: input.logger,
  });
  input.pollIndexRef.current = result.nextPollIndex;
  return result;
}
