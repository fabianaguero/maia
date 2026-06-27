import type { MutableRefObject } from "react";

import type { InsertSessionEventInput } from "../../api/sessions";
import type {
  LiveLogStreamUpdate,
  StreamSessionPollResult,
} from "../../types/monitor";
import {
  applyMonitorStreamUpdateState,
  type MonitorListenerRuntimeLogger,
  type PersistedMonitorCursorUpdate,
} from "./monitorUpdateRuntime";
import {
  runMonitorPollCycle,
  type MonitorSessionRuntimeLogger,
} from "./monitorSessionRuntime";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";

type SetMetricsState = (
  updater: MonitorMetrics | ((previous: MonitorMetrics) => MonitorMetrics),
) => void;

export function emitMonitorProviderUpdateState(input: {
  update: LiveLogStreamUpdate;
  listenersRef: MutableRefObject<Set<StreamListener>>;
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

export async function runMonitorProviderPollState(input: {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  wsLineBufferRef: MutableRefObject<string[]>;
  httpUrlRef: MutableRefObject<string>;
  pollStreamSession: (sessionId: string) => Promise<StreamSessionPollResult>;
  pollLogStream: (
    sourcePath: string,
    cursor?: number,
    maxBytes?: number,
  ) => Promise<LiveLogStreamUpdate>;
  ingestStreamChunk: (
    sessionId: string,
    chunk: string,
  ) => Promise<StreamSessionPollResult>;
  fetchText: (url: string) => Promise<string>;
  emitUpdate: (update: LiveLogStreamUpdate) => void;
  schedulePoll: (doPoll: () => Promise<void>) => void;
  doPoll: () => Promise<void>;
  logger: MonitorSessionRuntimeLogger;
}): Promise<void> {
  await runMonitorPollCycle({
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    wsLineBufferRef: input.wsLineBufferRef,
    httpUrlRef: input.httpUrlRef,
    pollStreamSession: input.pollStreamSession,
    pollLogStream: input.pollLogStream,
    ingestStreamChunk: input.ingestStreamChunk,
    fetchText: input.fetchText,
    emitUpdate: input.emitUpdate,
    scheduleNext: () => {
      input.schedulePoll(input.doPoll);
    },
    logger: input.logger,
  });
}
