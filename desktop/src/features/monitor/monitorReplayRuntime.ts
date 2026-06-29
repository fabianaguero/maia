import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorMetrics } from "./monitorContextTypes";
import type { GuideTrackPCM } from "./monitorContextRuntime";
import { createSyntheticReplayEvent } from "./monitorContextRuntime";

type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;

export const REPLAY_REBUILD_WINDOW_BYTES = 16 * 1024;
export const MAX_REPLAY_REBUILD_WINDOWS = 48;

export function createEmptyMonitorMetrics(): MonitorMetrics {
  return {
    windowCount: 0,
    processedLines: 0,
    totalAnomalies: 0,
  };
}

export function resetReplayTelemetryState(input: {
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  playbackPausedRef: MutableRefObject<boolean>;
  setPlaybackProgress: (value: number | null) => void;
  setIsPlaybackPaused: (value: boolean) => void;
  setPlaybackEventIndex: (value: number | null) => void;
  setPlaybackEventCount: (value: number | null) => void;
}): void {
  input.replayEventsRef.current = [];
  input.replayMetricsRef.current = [createEmptyMonitorMetrics()];
  input.replayIndexRef.current = 0;
  input.replayHydratingRef.current = false;
  input.replayHydrationTokenRef.current += 1;
  input.playbackPausedRef.current = false;
  input.setPlaybackProgress(null);
  input.setIsPlaybackPaused(false);
  input.setPlaybackEventIndex(null);
  input.setPlaybackEventCount(null);
}

export function syncReplayTelemetryState(input: {
  processedEvents: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  setPlaybackEventCount: (value: number | null) => void;
  setPlaybackEventIndex: (value: number | null) => void;
  setPlaybackProgress: (value: number | null) => void;
  setMetrics: (value: MonitorMetrics) => void;
}): void {
  const total = input.replayEventsRef.current.length;
  const clampedProcessed = Math.max(0, Math.min(input.processedEvents, total));

  input.setPlaybackEventCount(total > 0 ? total : null);
  input.setPlaybackEventIndex(total > 0 ? clampedProcessed : null);
  input.setPlaybackProgress(total > 0 ? clampedProcessed / total : null);
  input.setMetrics(input.replayMetricsRef.current[clampedProcessed] ?? createEmptyMonitorMetrics());
}

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

export function shouldHydrateReplayFromSource(
  eventsLength: number,
  sourcePath: string | null | undefined,
): boolean {
  return eventsLength <= 1 && Boolean(sourcePath);
}

export async function rebuildReplayEventsFromSource(input: {
  sessionId: string;
  sourcePath: string;
  pollLogStream: PollLogStreamFn;
  rebuildWindowBytes?: number;
  maxReplayWindows?: number;
}): Promise<SessionEvent[]> {
  const rebuiltEvents: SessionEvent[] = [];
  let cursor = 0;
  const rebuildWindowBytes = input.rebuildWindowBytes ?? REPLAY_REBUILD_WINDOW_BYTES;
  const maxReplayWindows = input.maxReplayWindows ?? MAX_REPLAY_REBUILD_WINDOWS;

  for (let index = 0; index < maxReplayWindows; index++) {
    const update = await input.pollLogStream(input.sourcePath, cursor, rebuildWindowBytes);

    if (!update.hasData || update.toOffset <= cursor) {
      break;
    }

    rebuiltEvents.push(createSyntheticReplayEvent(input.sessionId, index, update));
    cursor = update.toOffset;
  }

  return rebuiltEvents;
}
