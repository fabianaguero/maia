import type { MutableRefObject } from "react";

import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";

export const POLL_INTERVAL_MS = 600;

export interface MonitorSessionRuntimeLogger {
  trace: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export interface MonitorPollingRefs {
  activeRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  wsRef: MutableRefObject<WebSocket | null>;
  wsLineBufferRef: MutableRefObject<string[]>;
  httpUrlRef: MutableRefObject<string>;
}

export type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;

export type PollStreamSessionFn = (sessionId: string) => Promise<StreamSessionPollResult>;
export type IngestStreamChunkFn = (
  sessionId: string,
  chunk: string,
) => Promise<StreamSessionPollResult>;

export interface RunMonitorPollCycleInput {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  wsLineBufferRef: MutableRefObject<string[]>;
  httpUrlRef: MutableRefObject<string>;
  pollStreamSession: PollStreamSessionFn;
  pollLogStream: PollLogStreamFn;
  ingestStreamChunk: IngestStreamChunkFn;
  fetchText: (url: string) => Promise<string>;
  emitUpdate: (update: LiveLogStreamUpdate) => void;
  scheduleNext: () => void;
  logger: MonitorSessionRuntimeLogger;
}
