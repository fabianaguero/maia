import type { MutableRefObject } from "react";

import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";

export function buildRunMonitorProviderPollStateInput(input: {
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
  logger: MonitorProviderRuntimeLogger;
}) {
  return {
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
    schedulePoll: input.schedulePoll,
    doPoll: input.doPoll,
    logger: input.logger,
  };
}
