import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";

export function buildReplayUpdateFromEvent(
  event: SessionEvent,
  sourcePath: string,
  replayWindowIndex?: number | null,
): LiveLogStreamUpdate {
  return {
    sourcePath,
    fromOffset: event.fromOffset,
    toOffset: event.toOffset,
    replayWindowIndex: replayWindowIndex ?? null,
    hasData: true,
    summary: event.summary,
    suggestedBpm: event.suggestedBpm,
    confidence: event.confidence,
    dominantLevel: event.dominantLevel,
    lineCount: event.lineCount,
    anomalyCount: event.anomalyCount,
    levelCounts: JSON.parse(event.levelCountsJson),
    anomalyMarkers: JSON.parse(event.anomalyMarkersJson),
    topComponents: JSON.parse(event.topComponentsJson),
    sonificationCues: JSON.parse(event.sonificationCuesJson),
    parsedLines: JSON.parse(event.parsedLinesJson),
    warnings: JSON.parse(event.warningsJson),
  };
}

export function syncGuideTrackCursorToReplayProgress(input: {
  pcm: GuideTrackPCM | null;
  cursorRef: MutableRefObject<{ current: number }>;
  finishedRef: MutableRefObject<boolean>;
  progress: number;
}): void {
  if (!input.pcm) {
    return;
  }

  const clamped = Math.max(0, Math.min(1, input.progress));
  input.cursorRef.current.current = Math.max(
    0,
    Math.min(input.pcm.samples.length - 1, Math.floor(clamped * input.pcm.samples.length)),
  );
  input.finishedRef.current = false;
}
