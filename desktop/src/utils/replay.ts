interface ReplayEventMetricsLike {
  lineCount: number;
  anomalyCount: number;
}

interface ReplayMetrics {
  windowCount: number;
  processedLines: number;
  totalAnomalies: number;
}

export function buildReplayCumulativeMetrics<T extends ReplayEventMetricsLike>(
  events: T[],
): ReplayMetrics[] {
  const cumulative: ReplayMetrics[] = [
    { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
  ];

  for (const event of events) {
    const previous = cumulative[cumulative.length - 1]!;
    cumulative.push({
      windowCount: previous.windowCount + 1,
      processedLines: previous.processedLines + event.lineCount,
      totalAnomalies: previous.totalAnomalies + event.anomalyCount,
    });
  }

  return cumulative;
}

export function resolveReplayTargetIndex(
  progress: number,
  totalEvents: number,
): number {
  if (!Number.isFinite(progress) || totalEvents <= 0) {
    return 0;
  }

  const clamped = Math.max(0, Math.min(1, progress));
  return Math.max(0, Math.min(totalEvents - 1, Math.round(clamped * (totalEvents - 1))));
}

export function resolveSteppedReplayIndex(
  processedEvents: number,
  totalEvents: number,
  direction: -1 | 1,
): number {
  if (totalEvents <= 0) {
    return 0;
  }

  const currentDisplayedIndex = Math.max(
    0,
    Math.min(totalEvents - 1, processedEvents - 1),
  );

  return Math.max(
    0,
    Math.min(totalEvents - 1, currentDisplayedIndex + direction),
  );
}

export function resolveReplayProgressForWindow(
  replayWindowIndex: number,
  totalEvents: number,
): number {
  if (totalEvents <= 1) {
    return 0;
  }

  const clampedWindow = Math.max(1, Math.min(totalEvents, replayWindowIndex));
  return (clampedWindow - 1) / (totalEvents - 1);
}
