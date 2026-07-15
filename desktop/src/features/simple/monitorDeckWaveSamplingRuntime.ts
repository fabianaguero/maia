import type { BeatGridPoint } from "../../types/library";
import { MONITOR_TRACK_WINDOW_POINTS } from "./monitorDeckTypes";
import { resolveVisibleWindowSeconds } from "./monitorDeckTimelineRuntime";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function densifyWaveformBins(bins: number[] | null | undefined, minimumLength = 512): number[] {
  if (!bins || bins.length === 0) {
    return [];
  }
  if (bins.length >= minimumLength) {
    return bins;
  }

  return Array.from({ length: minimumLength }, (_, index) => {
    const sourceIndex = (index / Math.max(1, minimumLength - 1)) * Math.max(0, bins.length - 1);
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(bins.length - 1, leftIndex + 1);
    const ratio = sourceIndex - leftIndex;
    const left = bins[leftIndex] ?? 0;
    const right = bins[rightIndex] ?? left;
    const interpolated = left + (right - left) * ratio;
    const derivative = Math.abs(right - left);
    const microTexture =
      Math.sin(index * 0.37) * derivative * 0.18 + Math.sin(index * 0.11) * derivative * 0.12;
    return Math.max(0.02, Math.min(1, interpolated + microTexture));
  });
}

function applyVisibleWindowGain(samples: number[]): number[] {
  if (samples.length === 0) return samples;
  const minimum = Math.min(...samples);
  const maximum = Math.max(...samples);
  const range = maximum - minimum;
  if (range < 0.002) {
    return samples.map((value) => Math.max(0.1, Math.min(0.72, value * 1.8)));
  }
  return samples.map((value) => {
    const normalized = (value - minimum) / range;
    return 0.1 + Math.pow(normalized, 0.82) * 0.82;
  });
}

export function sampleTrackWaveWindow(
  bins: number[] | null | undefined,
  progress: number,
  durationSeconds: number | null | undefined,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
  points = MONITOR_TRACK_WINDOW_POINTS,
): number[] {
  if (!bins || bins.length === 0) {
    return Array.from({ length: points }, (_, index) => {
      const movingIndex = index + Math.floor(clamp01(progress) * points * 4);
      const phase = movingIndex / points;
      return (
        0.14 +
        Math.sin(phase * Math.PI * 5) * 0.06 +
        Math.sin(phase * Math.PI * 17) * 0.025 +
        (movingIndex % 17 === 0 ? 0.15 : 0)
      );
    });
  }

  const denseBins = densifyWaveformBins(bins);
  const globalMax = Math.max(...denseBins, 1);
  const normalized = denseBins.map((value) => Math.max(0, Math.min(1, value / globalMax)));
  const isLowResolutionWaveform = bins.length < 64;
  const duration =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : normalized.length;
  const visibleWindowSeconds = resolveVisibleWindowSeconds(bpm, beatGrid);
  const centerSecond = clamp01(progress) * duration;
  const heuristicWindowSeconds = duration * 0.24;
  const visibleSpanSeconds = isLowResolutionWaveform
    ? heuristicWindowSeconds
    : visibleWindowSeconds;

  const windowSamples = Array.from({ length: points }, (_, index) => {
    const viewportRatio = index / Math.max(1, points - 1) - 0.5;
    const second = centerSecond + viewportRatio * visibleSpanSeconds;
    if (second < 0 || second > duration) {
      return 0.02;
    }
    const centerIndex = Math.floor((second / duration) * normalized.length);
    const leftIndex = Math.max(0, centerIndex - 2);
    const rightIndex = Math.min(normalized.length - 1, centerIndex + 2);
    let peak = 0;
    let sum = 0;
    let count = 0;
    for (let sourceIndex = leftIndex; sourceIndex <= rightIndex; sourceIndex += 1) {
      const value = normalized[sourceIndex] ?? 0;
      peak = Math.max(peak, value);
      sum += value;
      count += 1;
    }
    const average =
      count > 0
        ? sum / count
        : (normalized[Math.max(0, Math.min(normalized.length - 1, centerIndex))] ?? 0);
    return peak * 0.68 + average * 0.32;
  });

  const shapedSamples = windowSamples.map((value, index) => {
    const previous = windowSamples[Math.max(0, index - 1)] ?? value;
    const next = windowSamples[Math.min(windowSamples.length - 1, index + 1)] ?? value;
    const localAverage = (previous + value + next) / 3;
    const localDelta = Math.abs(value - previous) + Math.abs(next - value);
    const body = Math.pow(Math.max(0.02, localAverage), 0.92);
    const transientLift = Math.min(0.12, localDelta * 0.72);
    return Math.max(0.06, Math.min(1, body * 0.88 + transientLift));
  });
  return applyVisibleWindowGain(shapedSamples);
}

export function sampleOverviewWave(bins: number[] | null | undefined, points = 320): number[] {
  if (!bins || bins.length === 0) {
    return Array.from({ length: points }, (_, index) => {
      const phase = index / points;
      return 0.12 + Math.sin(phase * Math.PI * 8) * 0.05;
    });
  }

  const denseBins = densifyWaveformBins(bins);
  const max = Math.max(...denseBins, 1);
  return Array.from({ length: points }, (_, index) => {
    const sourceIndex = Math.floor((index / Math.max(1, points - 1)) * denseBins.length);
    const value = denseBins[Math.min(sourceIndex, denseBins.length - 1)] ?? 0;
    return Math.max(0.05, Math.min(1, value / max));
  });
}
