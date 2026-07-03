import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";

export type PollStreamSessionFn = (sessionId: string) => Promise<StreamSessionPollResult>;
export type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;
export type IngestStreamChunkFn = (
  sessionId: string,
  chunk: string,
) => Promise<StreamSessionPollResult>;

export interface MonitorProviderRuntimeTransportSlice {
  pollStreamSession: PollStreamSessionFn;
  pollLogStream: PollLogStreamFn;
  ingestStreamChunk: IngestStreamChunkFn;
  fetchText: (url: string) => Promise<string>;
}

export interface MonitorProviderRuntimePersistenceSlice {
  updatePersistedSessionCursor: (
    sessionId: string,
    toOffset: number,
    lineCount: number,
    anomalyCount: number,
    suggestedBpm: number | null,
  ) => Promise<void>;
  insertSessionEvent: (payload: {
    sessionId: string;
    pollIndex: number;
    fromOffset: number;
    toOffset: number;
    summary: string;
    suggestedBpm: number | null;
    confidence: number;
    dominantLevel: string;
    lineCount: number;
    anomalyCount: number;
    levelCountsJson: string;
    anomalyMarkersJson: string;
    topComponentsJson: string;
    sonificationCuesJson: string;
    parsedLinesJson: string;
    warningsJson: string;
  }) => Promise<unknown>;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
}
