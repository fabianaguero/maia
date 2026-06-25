import type { BeatGridPoint } from "../../types/library";

export interface WaveformAnomalyMarker {
  id: string;
  lineId: string;
  timestamp: string;
  message: string;
  severity: number;
  progress: number;
}

export interface LogWaveOverlayPoint {
  level: number;
  heat: number;
}

export interface DeckSelectedMarker {
  id: string;
  severity: number;
  progress: number;
  timestamp: string;
  message: string;
}

export interface OverviewAnomalyDensityPoint {
  warning: number;
  critical: number;
}

export interface AnomalyBurstRegion {
  id: string;
  startProgress: number;
  endProgress: number;
  severity: number;
  count: number;
}

export interface OverviewAnomalyMarker extends WaveformAnomalyMarker {
  leftPercent: number;
}

export interface MonitorDeckDerivedState {
  overviewWaveSamples: number[];
  overviewAnomalyDensity: OverviewAnomalyDensityPoint[];
  anomalyBurstRegions: AnomalyBurstRegion[];
  overviewWindowWidthPercent: number;
  overviewWindowLeftPercent: number;
  overviewPlayheadLeftPercent: number;
  logWaveOverlay: LogWaveOverlayPoint[];
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstRegion: AnomalyBurstRegion | null;
}

const MONITOR_TRACK_WINDOW_POINTS = 420;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function formatDeckTime(seconds: number | null): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds < 0) {
    return "--:--";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
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

export function resolveBeatDurationSeconds(
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): number {
  if (beatGrid && beatGrid.length > 1) {
    const spacing = beatGrid[1]!.second - beatGrid[0]!.second;
    if (spacing > 0 && Number.isFinite(spacing)) {
      return spacing;
    }
  }

  if (typeof bpm === "number" && Number.isFinite(bpm) && bpm > 0) {
    return 60 / bpm;
  }

  return 60 / 124;
}

export function resolveVisibleWindowSeconds(
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): number {
  return Math.max(6, Math.min(18, resolveBeatDurationSeconds(bpm, beatGrid) * 16));
}

export function quantizeProgressToBeatGrid(
  progress: number,
  durationSeconds: number | null | undefined,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
  subdivision = 0.25,
): number {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return clamp01(progress);
  }

  const currentSecond = clamp01(progress) * durationSeconds;
  const beatDuration = resolveBeatDurationSeconds(bpm, beatGrid);
  const gridStep = Math.max(0.05, beatDuration * subdivision);
  const quantizedSecond = Math.round(currentSecond / gridStep) * gridStep;
  return clamp01(quantizedSecond / durationSeconds);
}

export function buildDeckTimelineMarkers(
  progress: number,
  durationSeconds: number | null,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
  markerCount = 7,
): Array<{
  id: string;
  leftPercent: number;
  label: string;
  emphasis: "major" | "minor" | "playhead";
}> {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return [];
  }

  const visibleWindowSeconds = resolveVisibleWindowSeconds(bpm, beatGrid);
  const halfWindowSeconds = visibleWindowSeconds / 2;
  const centerSecond = clamp01(progress) * durationSeconds;
  const startSecond = Math.max(0, centerSecond - halfWindowSeconds);
  const endSecond = Math.min(durationSeconds, centerSecond + halfWindowSeconds);
  const visibleSpan = Math.max(1, endSecond - startSecond);
  const step = visibleSpan / (markerCount - 1);

  return Array.from({ length: markerCount }, (_, index) => {
    const second = Math.min(durationSeconds, startSecond + step * index);
    const leftPercent = ((second - startSecond) / visibleSpan) * 100;
    const emphasis =
      index === Math.floor(markerCount / 2) ? "playhead" : index % 2 === 0 ? "major" : "minor";
    return {
      id: `deck-marker-${index}-${second.toFixed(2)}`,
      leftPercent,
      label: formatDeckTime(second),
      emphasis,
    };
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
      const phase = index / points;
      return 0.14 + Math.sin(phase * Math.PI * 5) * 0.06 + (index % 17 === 0 ? 0.15 : 0);
    });
  }

  const denseBins = densifyWaveformBins(bins);
  const globalMax = Math.max(...denseBins, 1);
  const normalized = denseBins.map((value) => Math.max(0, Math.min(1, value / globalMax)));
  const duration =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : normalized.length;
  const visibleWindowSeconds = resolveVisibleWindowSeconds(bpm, beatGrid);
  const halfWindowSeconds = visibleWindowSeconds / 2;
  const centerSecond = clamp01(progress) * duration;
  const startSecond = Math.max(0, centerSecond - halfWindowSeconds);
  const endSecond = Math.min(duration, centerSecond + halfWindowSeconds);
  const visibleSpanSeconds = Math.max(1, endSecond - startSecond);

  const windowSamples = Array.from({ length: points }, (_, index) => {
    const second = startSecond + (index / Math.max(1, points - 1)) * visibleSpanSeconds;
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

  return windowSamples.map((value, index) => {
    const previous = windowSamples[Math.max(0, index - 1)] ?? value;
    const next = windowSamples[Math.min(windowSamples.length - 1, index + 1)] ?? value;
    const localAverage = (previous + value + next) / 3;
    const localDelta = Math.abs(value - previous) + Math.abs(next - value);
    const body = Math.pow(Math.max(0.02, localAverage), 0.92);
    const transientLift = Math.min(0.12, localDelta * 0.72);
    return Math.max(0.06, Math.min(1, body * 0.88 + transientLift));
  });
}

export function buildDeckBeatMarkers(
  progress: number,
  durationSeconds: number | null,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): Array<{ id: string; leftPercent: number; major: boolean }> {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return [];
  }

  const beatDuration = resolveBeatDurationSeconds(bpm, beatGrid);
  const visibleWindowSeconds = resolveVisibleWindowSeconds(bpm, beatGrid);
  const halfWindowSeconds = visibleWindowSeconds / 2;
  const centerSecond = clamp01(progress) * durationSeconds;
  const startSecond = Math.max(0, centerSecond - halfWindowSeconds);
  const endSecond = Math.min(durationSeconds, centerSecond + halfWindowSeconds);
  const visibleSpan = Math.max(1, endSecond - startSecond);

  const beats =
    beatGrid && beatGrid.length > 0
      ? beatGrid.filter((beat) => beat.second >= startSecond && beat.second <= endSecond)
      : Array.from({ length: Math.ceil(visibleSpan / beatDuration) + 2 }, (_, index) => ({
          index,
          second: startSecond + index * beatDuration,
        })).filter((beat) => beat.second <= endSecond);

  return beats.map((beat, index) => ({
    id: `deck-beat-${beat.index}-${beat.second.toFixed(3)}`,
    leftPercent: ((beat.second - startSecond) / visibleSpan) * 100,
    major: (beat.index ?? index) % 4 === 0,
  }));
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

export function sampleOverviewAnomalyDensity(
  markers: WaveformAnomalyMarker[],
  points = 160,
): OverviewAnomalyDensityPoint[] {
  if (markers.length === 0) {
    return Array.from({ length: points }, () => ({ warning: 0, critical: 0 }));
  }

  return Array.from({ length: points }, (_, index) => {
    const progress = index / Math.max(1, points - 1);
    let warning = 0;
    let critical = 0;

    markers.forEach((marker) => {
      const distance = Math.abs(marker.progress - progress);
      if (distance > 0.08) {
        return;
      }

      const falloff = Math.max(0, 1 - distance / 0.08);
      const weight = falloff * falloff * (0.45 + marker.severity * 0.55);
      if (marker.severity >= 0.9) {
        critical += weight;
      } else {
        warning += weight;
      }
    });

    return {
      warning: Math.min(1, warning),
      critical: Math.min(1, critical),
    };
  });
}

export function buildAnomalyBurstRegions(
  markers: WaveformAnomalyMarker[],
  gapThreshold = 0.03,
  padding = 0.008,
): AnomalyBurstRegion[] {
  if (markers.length === 0) {
    return [];
  }

  const sorted = [...markers].sort((left, right) => left.progress - right.progress);
  const regions: AnomalyBurstRegion[] = [];

  let current = {
    start: sorted[0]!.progress,
    end: sorted[0]!.progress,
    severity: sorted[0]!.severity,
    count: 1,
  };

  for (let index = 1; index < sorted.length; index += 1) {
    const marker = sorted[index]!;
    if (marker.progress - current.end <= gapThreshold) {
      current.end = marker.progress;
      current.severity = Math.max(current.severity, marker.severity);
      current.count += 1;
      continue;
    }

    regions.push({
      id: `burst-${regions.length}-${current.start.toFixed(4)}`,
      startProgress: clamp01(current.start - padding),
      endProgress: clamp01(current.end + padding),
      severity: current.severity,
      count: current.count,
    });

    current = {
      start: marker.progress,
      end: marker.progress,
      severity: marker.severity,
      count: 1,
    };
  }

  regions.push({
    id: `burst-${regions.length}-${current.start.toFixed(4)}`,
    startProgress: clamp01(current.start - padding),
    endProgress: clamp01(current.end + padding),
    severity: current.severity,
    count: current.count,
  });

  return regions;
}

export function sampleLogWaveOverlay(
  buffer: Array<{ val: number; heat: number }>,
  points = MONITOR_TRACK_WINDOW_POINTS,
): LogWaveOverlayPoint[] {
  if (buffer.length === 0) {
    return Array.from({ length: points }, () => ({ level: 0.08, heat: 0 }));
  }

  return Array.from({ length: points }, (_, index) => {
    const sourceIndex = (index / Math.max(1, points - 1)) * Math.max(0, buffer.length - 1);
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(buffer.length - 1, leftIndex + 1);
    const ratio = sourceIndex - leftIndex;
    const left = buffer[leftIndex] ?? { val: 20, heat: 0 };
    const right = buffer[rightIndex] ?? left;
    const value = left.val + (right.val - left.val) * ratio;
    const heat = left.heat + (right.heat - left.heat) * ratio;

    return {
      level: Math.max(0.04, Math.min(1, value / 140)),
      heat: Math.max(0, Math.min(1, heat)),
    };
  });
}

export function buildMonitorDeckDerivedState({
  waveformBins,
  waveformAnomalies,
  trackWaveProgress,
  deckDurationSeconds,
  visibleWindowSeconds,
  logSignalBuffer,
  selectedAnomalyId,
}: {
  waveformBins: number[] | null | undefined;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  visibleWindowSeconds: number;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
}): MonitorDeckDerivedState {
  const overviewWaveSamples = sampleOverviewWave(waveformBins ?? null);
  const overviewAnomalyDensity = sampleOverviewAnomalyDensity(waveformAnomalies);
  const anomalyBurstRegions = buildAnomalyBurstRegions(waveformAnomalies);
  const overviewWindowWidthPercent =
    typeof deckDurationSeconds === "number" && deckDurationSeconds > 0
      ? Math.min(100, (visibleWindowSeconds / deckDurationSeconds) * 100)
      : 0;
  const overviewWindowLeftPercent =
    typeof deckDurationSeconds === "number" && deckDurationSeconds > 0
      ? Math.max(
          0,
          Math.min(
            100 - overviewWindowWidthPercent,
            trackWaveProgress * 100 - overviewWindowWidthPercent / 2,
          ),
        )
      : 0;
  const overviewPlayheadLeftPercent =
    overviewWindowWidthPercent > 0
      ? overviewWindowLeftPercent + overviewWindowWidthPercent / 2
      : trackWaveProgress * 100;
  const logWaveOverlay = sampleLogWaveOverlay(logSignalBuffer);
  const overviewAnomalyMarkers = waveformAnomalies
    .map((marker) => ({
      ...marker,
      leftPercent: marker.progress * 100,
    }))
    .filter((marker) => marker.leftPercent >= 0 && marker.leftPercent <= 100);
  const selectedDeckMarker = selectedAnomalyId
    ? (waveformAnomalies.find((marker) => marker.id === selectedAnomalyId) ?? null)
    : null;
  const selectedBurstRegion = selectedDeckMarker
    ? (anomalyBurstRegions.find(
        (region) =>
          selectedDeckMarker.progress >= region.startProgress &&
          selectedDeckMarker.progress <= region.endProgress,
      ) ?? null)
    : null;

  return {
    overviewWaveSamples,
    overviewAnomalyDensity,
    anomalyBurstRegions,
    overviewWindowWidthPercent,
    overviewWindowLeftPercent,
    overviewPlayheadLeftPercent,
    logWaveOverlay,
    overviewAnomalyMarkers,
    selectedDeckMarker,
    selectedBurstRegion,
  };
}
