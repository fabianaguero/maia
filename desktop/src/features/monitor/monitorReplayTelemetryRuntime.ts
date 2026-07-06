import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { MonitorMetrics } from "./monitorContextTypes";

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
