import type { MutableRefObject } from "react";

import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";
import { runMonitorPollCycle, type MonitorSessionRuntimeLogger } from "./monitorSessionRuntime";
import type { ActiveMonitorSession } from "./monitorContextTypes";

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
  ingestStreamChunk: (sessionId: string, chunk: string) => Promise<StreamSessionPollResult>;
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
