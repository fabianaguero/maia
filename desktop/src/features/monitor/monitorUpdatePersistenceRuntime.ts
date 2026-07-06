import type { InsertSessionEventInput } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type {
  MonitorStreamUpdatePersistenceInput,
  PersistedMonitorCursorUpdate,
} from "./monitorUpdateTypes";

export function buildSessionEventInsertInput(input: {
  sessionId: string;
  pollIndex: number;
  update: LiveLogStreamUpdate;
}): InsertSessionEventInput {
  const { sessionId, pollIndex, update } = input;
  return {
    sessionId,
    pollIndex,
    fromOffset: update.fromOffset,
    toOffset: update.toOffset,
    summary: update.summary,
    suggestedBpm: update.suggestedBpm ?? null,
    confidence: update.confidence,
    dominantLevel: update.dominantLevel,
    lineCount: update.lineCount,
    anomalyCount: update.anomalyCount,
    levelCountsJson: JSON.stringify(update.levelCounts),
    anomalyMarkersJson: JSON.stringify(update.anomalyMarkers),
    topComponentsJson: JSON.stringify(update.topComponents),
    sonificationCuesJson: JSON.stringify(update.sonificationCues),
    parsedLinesJson: JSON.stringify(update.parsedLines),
    warningsJson: JSON.stringify(update.warnings),
  };
}

export function buildPersistedMonitorCursorUpdate(
  input: Pick<MonitorStreamUpdatePersistenceInput, "persistedSessionId" | "update">,
): PersistedMonitorCursorUpdate | null {
  if (!input.persistedSessionId) {
    return null;
  }

  return {
    sessionId: input.persistedSessionId,
    toOffset: input.update.toOffset,
    lineCount: input.update.lineCount,
    anomalyCount: input.update.anomalyCount,
    suggestedBpm: input.update.suggestedBpm ?? null,
  };
}

export function persistMonitorStreamUpdateState(
  input: MonitorStreamUpdatePersistenceInput,
): number {
  const cursorUpdate = buildPersistedMonitorCursorUpdate({
    persistedSessionId: input.persistedSessionId,
    update: input.update,
  });
  if (!cursorUpdate) {
    return input.pollIndex;
  }

  input.updatePersistedCursor(cursorUpdate);
  input.insertPersistedEvent(
    buildSessionEventInsertInput({
      sessionId: input.persistedSessionId!,
      pollIndex: input.pollIndex,
      update: input.update,
    }),
  );
  return input.pollIndex + 1;
}
