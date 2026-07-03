import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { InsertSessionEventInput } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type { PersistedMonitorCursorUpdate } from "./monitorUpdateRuntime";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";

type SetMetricsState = Dispatch<SetStateAction<MonitorMetrics>>;

export function buildEmitMonitorProviderUpdateStateInput(input: {
  update: LiveLogStreamUpdate;
  listenersRef: MutableRefObject<Set<StreamListener>>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  pollIndexRef: MutableRefObject<number>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  setMetrics: SetMetricsState;
  updatePersistedSessionCursor: (
    sessionId: string,
    toOffset: number,
    lineCount: number,
    anomalyCount: number,
    suggestedBpm: number | null,
  ) => Promise<void>;
  insertSessionEvent: (payload: InsertSessionEventInput) => Promise<unknown>;
  logger: MonitorProviderRuntimeLogger;
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  };
}) {
  return {
    update: input.update,
    listenersRef: input.listenersRef,
    sessionRef: input.sessionRef,
    pollIndexRef: input.pollIndexRef,
    audioContextRef: input.audioContextRef,
    setMetrics: input.setMetrics,
    updatePersistedCursor: (payload: PersistedMonitorCursorUpdate) =>
      void input.updatePersistedSessionCursor(
        payload.sessionId,
        payload.toOffset,
        payload.lineCount,
        payload.anomalyCount,
        payload.suggestedBpm,
      ),
    insertPersistedEvent: (payload: InsertSessionEventInput) => {
      void input.insertSessionEvent(payload);
    },
    logger: input.logger,
    options: input.options,
  };
}
