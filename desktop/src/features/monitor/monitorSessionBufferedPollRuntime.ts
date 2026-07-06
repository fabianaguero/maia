import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import type { RunMonitorPollCycleInput } from "./monitorSessionPollingTypes";

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

export async function runSessionPollTransport(
  current: ActiveMonitorSession,
  input: RunMonitorPollCycleInput,
): Promise<LiveLogStreamUpdate | null> {
  input.logger.trace("doPoll → pollStreamSession(%s)", current.sessionId);
  const result = await input.pollStreamSession(current.sessionId);
  if (!input.activeRef.current) {
    return null;
  }
  return mapStreamPollResultToUpdate(result, current.sourcePath);
}

export async function runWebsocketPollTransport(
  current: ActiveMonitorSession,
  input: RunMonitorPollCycleInput,
): Promise<LiveLogStreamUpdate | null> {
  const lines = input.wsLineBufferRef.current.splice(0);
  const chunk = lines.join("\n");
  const result = await input.ingestStreamChunk(current.sessionId, chunk);
  if (!input.activeRef.current) {
    return null;
  }
  return mapStreamPollResultToUpdate(result, current.sourcePath);
}

export async function runHttpPollTransport(
  current: ActiveMonitorSession,
  input: RunMonitorPollCycleInput,
): Promise<LiveLogStreamUpdate | null> {
  const text = await input.fetchText(input.httpUrlRef.current);
  if (!input.activeRef.current) {
    return null;
  }
  const result = await input.ingestStreamChunk(current.sessionId, text);
  if (!input.activeRef.current) {
    return null;
  }
  return mapStreamPollResultToUpdate(result, current.sourcePath);
}
