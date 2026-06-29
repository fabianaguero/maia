import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  clampMonitorProgress,
  resolveNearestMonitorAnomalyMarker,
  resolveOverviewScrubProgress,
  shouldFocusMonitorAnomalyMarker,
} from "./monitorDeckScrubRuntime";

export interface MonitorDeckSeekState {
  clampedProgress: number;
  currentTime: number;
  focusedAnomalyId: string | null;
  shouldOpenConsole: boolean;
}

export function resolveMonitorDeckSeekState(input: {
  audio: HTMLAudioElement | null | undefined;
  nextProgress: number;
  waveformAnomalies: WaveformAnomalyMarker[];
  isConsoleExpanded: boolean;
}): MonitorDeckSeekState | null {
  const duration = input.audio?.duration;
  if (!input.audio || !duration || !Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const clampedProgress = clampMonitorProgress(input.nextProgress);
  const currentTime = clampedProgress * duration;
  const nearestMarker = resolveNearestMonitorAnomalyMarker(
    input.waveformAnomalies,
    clampedProgress,
  );
  const focusedAnomalyId =
    nearestMarker && shouldFocusMonitorAnomalyMarker(nearestMarker, clampedProgress)
      ? nearestMarker.id
      : null;

  return {
    clampedProgress,
    currentTime,
    focusedAnomalyId,
    shouldOpenConsole: Boolean(focusedAnomalyId && !input.isConsoleExpanded),
  };
}

export function shouldProcessMonitorScrubPointer(input: {
  isScrubbing: boolean;
  activePointerId: number | null;
  eventPointerId: number;
}): boolean {
  return (
    input.isScrubbing &&
    input.activePointerId !== null &&
    input.activePointerId === input.eventPointerId
  );
}

export function buildOverviewScrubPointerState(pointerId: number) {
  return {
    isScrubbing: true,
    activePointerId: pointerId,
  };
}

export function buildDeckScrubPointerState(input: {
  pointerId: number;
  clientX: number;
  left: number;
  width: number;
  trackWaveProgress: number;
}) {
  return {
    isScrubbing: true,
    activePointerId: input.pointerId,
    startRatio: resolveOverviewScrubProgress({
      clientX: input.clientX,
      left: input.left,
      width: input.width,
    }),
    startProgress: input.trackWaveProgress,
  };
}

export function resolveStoppedMonitorScrubPointerState(input: {
  activePointerId: number | null;
  eventPointerId: number;
}) {
  if (input.activePointerId === null || input.activePointerId !== input.eventPointerId) {
    return {
      isScrubbing: true,
      activePointerId: input.activePointerId,
      didStop: false,
    };
  }

  return {
    isScrubbing: false,
    activePointerId: null,
    didStop: true,
  };
}
