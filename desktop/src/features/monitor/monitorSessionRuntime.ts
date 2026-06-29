import type { MutableRefObject } from "react";

import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";
import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
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

type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;

type PollStreamSessionFn = (sessionId: string) => Promise<StreamSessionPollResult>;
type IngestStreamChunkFn = (sessionId: string, chunk: string) => Promise<StreamSessionPollResult>;

export function stopMonitorPollingState(
  input: MonitorPollingRefs & {
    clearTimeoutFn: (timer: number) => void;
  },
): void {
  input.activeRef.current = false;
  if (input.pollTimerRef.current !== null) {
    input.clearTimeoutFn(input.pollTimerRef.current);
    input.pollTimerRef.current = null;
  }

  if (input.wsRef.current) {
    input.wsRef.current.onmessage = null;
    input.wsRef.current.onerror = null;
    input.wsRef.current.onclose = null;
    try {
      input.wsRef.current.close();
    } catch {
      // ignore cleanup failures
    }
    input.wsRef.current = null;
  }

  input.wsLineBufferRef.current = [];
  input.httpUrlRef.current = "";
}

export function scheduleMonitorPoll(input: {
  activeRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  intervalMs?: number;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  doPoll: () => Promise<void>;
}): void {
  if (!input.activeRef.current) {
    return;
  }

  input.pollTimerRef.current = input.setTimeoutFn(() => {
    void input.doPoll();
  }, input.intervalMs ?? POLL_INTERVAL_MS);
}

export function mapStreamPollResultToUpdate(
  result: StreamSessionPollResult,
  sourcePath: string,
): LiveLogStreamUpdate {
  return {
    sourcePath,
    fromOffset: result.session.fileCursor ?? 0,
    toOffset: result.session.fileCursor ?? 0,
    hasData: result.hasData,
    summary: result.summary,
    suggestedBpm: result.suggestedBpm,
    confidence: result.confidence,
    dominantLevel: result.dominantLevel,
    lineCount: result.lineCount,
    anomalyCount: result.anomalyCount,
    levelCounts: result.levelCounts,
    anomalyMarkers: result.anomalyMarkers,
    topComponents: result.topComponents,
    sonificationCues: result.sonificationCues,
    parsedLines: result.parsedLines,
    warnings: result.warnings,
  };
}

export async function runMonitorPollCycle(input: {
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
}): Promise<void> {
  const current = input.sessionRef.current;
  if (!current || !input.activeRef.current) {
    input.logger.trace("doPoll skipped — no active session");
    return;
  }

  input.logger.trace("doPoll mode=%s id=%s", current.pollMode, current.sessionId);

  try {
    let update: LiveLogStreamUpdate;

    if (current.pollMode === "session") {
      input.logger.trace("doPoll → pollStreamSession(%s)", current.sessionId);
      const result = await input.pollStreamSession(current.sessionId);
      if (!input.activeRef.current) {
        return;
      }
      update = mapStreamPollResultToUpdate(result, current.sourcePath);
    } else if (current.pollMode === "direct") {
      input.logger.trace(
        "doPoll → pollLogStream(%s, cursor=%s)",
        current.sourcePath,
        input.directCursorRef.current,
      );
      update = await input.pollLogStream(current.sourcePath, input.directCursorRef.current);
      if (!input.activeRef.current) {
        return;
      }
      input.directCursorRef.current = update.toOffset;
      if (update.hasData) {
        input.logger.debug(
          "direct poll → hasData lines=%d cues=%d offset=%d",
          update.lineCount,
          update.sonificationCues.length,
          update.toOffset,
        );
        input.emptyWindowsRef.current = 0;
      } else {
        input.emptyWindowsRef.current += 1;
        input.logger.trace("direct poll → empty (%d consecutive)", input.emptyWindowsRef.current);
        if (input.emptyWindowsRef.current >= 3) {
          input.directCursorRef.current = undefined;
          input.emptyWindowsRef.current = 0;
          input.logger.debug("direct poll → reset cursor (3 empty windows)");
        }
      }
    } else if (current.pollMode === "websocket") {
      const lines = input.wsLineBufferRef.current.splice(0);
      const chunk = lines.join("\n");
      const result = await input.ingestStreamChunk(current.sessionId, chunk);
      if (!input.activeRef.current) {
        return;
      }
      update = mapStreamPollResultToUpdate(result, current.sourcePath);
    } else {
      const text = await input.fetchText(input.httpUrlRef.current);
      if (!input.activeRef.current) {
        return;
      }
      const result = await input.ingestStreamChunk(current.sessionId, text);
      if (!input.activeRef.current) {
        return;
      }
      update = mapStreamPollResultToUpdate(result, current.sourcePath);
    }

    input.emitUpdate(update);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    input.logger.error("poll error (non-fatal, will retry): " + message);
  } finally {
    input.scheduleNext();
  }
}

export function createActiveMonitorSession(input: {
  sessionId: string;
  persistedSessionId?: string | null;
  repoId: string;
  repoTitle: string;
  trackId?: string;
  trackTitle?: string;
  sourcePath: string;
  adapterKind: StartSessionInput["adapterKind"];
  pollMode: ActiveMonitorSession["pollMode"];
  startedAt?: number;
}): ActiveMonitorSession {
  return {
    sessionId: input.sessionId,
    persistedSessionId: input.persistedSessionId ?? null,
    repoId: input.repoId,
    repoTitle: input.repoTitle,
    trackId: input.trackId,
    trackName: input.trackTitle || "Dynamic Track",
    sourcePath: input.sourcePath,
    adapterKind: input.adapterKind,
    pollMode: input.pollMode,
    startedAt: input.startedAt ?? Date.now(),
  };
}

export function createLiveMonitorSession(input: {
  repo: RepositoryAnalysis;
  sessionInput: StartSessionInput;
  pollMode: ActiveMonitorSession["pollMode"];
  persistedSessionId?: string;
}): ActiveMonitorSession {
  return createActiveMonitorSession({
    sessionId: input.sessionInput.sessionId,
    persistedSessionId: input.persistedSessionId ?? null,
    repoId: input.repo.id,
    repoTitle: input.repo.title,
    trackId: input.sessionInput.trackId,
    trackTitle: input.sessionInput.trackTitle,
    sourcePath: input.sessionInput.source,
    adapterKind: input.sessionInput.adapterKind,
    pollMode: input.pollMode,
  });
}
