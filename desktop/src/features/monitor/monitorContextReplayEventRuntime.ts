import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";

export function createSyntheticReplayEvent(
  sessionId: string,
  pollIndex: number,
  update: LiveLogStreamUpdate,
): SessionEvent {
  return {
    id: -(pollIndex + 1),
    sessionId,
    pollIndex,
    capturedAt: new Date().toISOString(),
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
