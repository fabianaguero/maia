import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Music, AlertCircle, Clock } from "lucide-react";

import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/MonitorContext";
import type { PersistedSession } from "../../api/sessions";
import type { BeatGridPoint, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import { getTrackTitle as getLibraryTrackTitle, resolvePlayableTrackPath } from "../../utils/track";
import { resolvePreviewAudioUrl, revokePreviewAudioUrl } from "../../utils/audioPreview";
import { TrackWaveformMini } from "../../components/TrackWaveformMini";

interface SimpleMonitorScreenProps {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStop: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  onStartMonitoring: (repoId: string, trackId?: string) => void;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: any) => void) => () => void;
  trackName?: string;
  waveformBins?: number[]; // New prop
  isConsoleExpanded?: boolean;
  onToggleConsole?: () => void;
}

interface SessionRecord {
  id: string;
  name: string;
  source: string;
  anomalies: number;
  duration: string;
}

interface BackgroundTrackGraph {
  context: AudioContext;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  filter: BiquadFilterNode;
  dryGain: GainNode;
  driveNode: WaveShaperNode;
  driveWetGain: GainNode;
  outputGain: GainNode;
  deckGain: GainNode;
}

interface MonitorLogLine {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  isAnomaly: boolean;
  anomalyId: string | null;
}

interface WaveformAnomalyMarker {
  id: string;
  lineId: string;
  timestamp: string;
  message: string;
  severity: number;
  progress: number;
}

interface LogWaveOverlayPoint {
  level: number;
  heat: number;
}

function getTrackTitle(track: LibraryTrack): string {
  return getLibraryTrackTitle(track);
}

function resolveSessionSortTimestamp(session: PersistedSession): number {
  const updatedAt = Date.parse(session.updatedAt);
  if (Number.isFinite(updatedAt)) {
    return updatedAt;
  }

  const createdAt = Date.parse(session.createdAt);
  return Number.isFinite(createdAt) ? createdAt : 0;
}

function formatSessionUpdatedAt(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "No recent update";
  }

  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return "No recent update";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function formatSessionLineCount(value: number): string {
  return `${value.toLocaleString()} lines`;
}

function createDriveCurve(amount: number): Float32Array {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const drive = Math.max(0.1, amount);
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(x * drive);
  }
  return curve;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function safeDisconnect(node: { disconnect: () => void } | null | undefined): void {
  if (!node) {
    return;
  }

  try {
    node.disconnect();
  } catch (error) {
    console.warn("WebAudio disconnect skipped", error);
  }
}

function safeRevokePreviewAudioUrl(url: string | null | undefined): void {
  if (!url) {
    return;
  }

  try {
    revokePreviewAudioUrl(url);
  } catch (error) {
    console.warn("Preview URL revoke skipped", error);
  }
}

function getBasename(path: string | null | undefined): string {
  if (!path) {
    return "unknown-source";
  }

  const segments = path.split("/");
  return segments[segments.length - 1] || path;
}

function safeElementScrollTo(
  element: HTMLDivElement,
  top: number,
  behavior: ScrollBehavior,
): void {
  if (typeof element.scrollTo === "function") {
    element.scrollTo({ top, behavior });
    return;
  }

  element.scrollTop = top;
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

function resolveBeatDurationSeconds(
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

function resolveVisibleWindowSeconds(
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): number {
  return Math.max(6, Math.min(18, resolveBeatDurationSeconds(bpm, beatGrid) * 16));
}

function quantizeProgressToBeatGrid(
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

function buildDeckTimelineMarkers(
  progress: number,
  durationSeconds: number | null,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
  markerCount = 7,
): Array<{ id: string; leftPercent: number; label: string; emphasis: "major" | "minor" | "playhead" }> {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
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
      index === Math.floor(markerCount / 2)
        ? "playhead"
        : index % 2 === 0
          ? "major"
          : "minor";
    return {
      id: `deck-marker-${index}-${second.toFixed(2)}`,
      leftPercent,
      label: formatDeckTime(second),
      emphasis,
    };
  });
}

const MONITOR_TRACK_WINDOW_POINTS = 420;
const MONITOR_TRACK_STRIP_MULTIPLIER = 3;
const SAFE_MONITOR_RUNTIME = true;

function densifyWaveformBins(
  bins: number[] | null | undefined,
  minimumLength = 512,
): number[] {
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
      Math.sin(index * 0.37) * derivative * 0.18 +
      Math.sin(index * 0.11) * derivative * 0.12;
    return Math.max(0.02, Math.min(1, interpolated + microTexture));
  });
}

function sampleTrackWaveWindow(
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
    const average = count > 0 ? sum / count : normalized[Math.max(0, Math.min(normalized.length - 1, centerIndex))] ?? 0;
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

function buildDeckBeatMarkers(
  progress: number,
  durationSeconds: number | null,
  bpm: number | null | undefined,
  beatGrid: readonly BeatGridPoint[] | null | undefined,
): Array<{ id: string; leftPercent: number; major: boolean }> {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
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

function sampleOverviewWave(
  bins: number[] | null | undefined,
  points = 320,
): number[] {
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

function sampleLogWaveOverlay(
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

function drawContinuousWaveform(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  centerY: number,
  amplitudeScale: number,
  fillStyle: CanvasGradient | string,
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  context.moveTo(0, centerY);

  samples.forEach((value, index) => {
    const x = index * stepX;
    const y = centerY - value * amplitudeScale;
    context.lineTo(x, y);
  });

  for (let index = samples.length - 1; index >= 0; index -= 1) {
    const x = index * stepX;
    const y = centerY + samples[index]! * amplitudeScale;
    context.lineTo(x, y);
  }

  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

function drawAnomalyWash(
  context: CanvasRenderingContext2D,
  markers: WaveformAnomalyMarker[],
  currentProgress: number,
  width: number,
  baseY: number,
  amplitudeScale: number,
): void {
  if (markers.length === 0) {
    return;
  }

  markers.forEach((marker) => {
    const relative = 0.5 + (marker.progress - currentProgress) * MONITOR_TRACK_STRIP_MULTIPLIER;
    if (relative < -0.08 || relative > 1.08) {
      return;
    }

    const x = relative * width;
    const zoneWidth = 10 + marker.severity * 18;
    const zoneHeight = amplitudeScale * (0.58 + marker.severity * 0.22);
    const alpha = marker.severity >= 0.9 ? 0.26 : 0.18;
    const glow = context.createLinearGradient(0, baseY - zoneHeight, 0, baseY + 2);
    glow.addColorStop(0, "rgba(255,72,108,0)");
    glow.addColorStop(0.32, marker.severity >= 0.9 ? `rgba(255,72,108,${alpha})` : `rgba(255,188,96,${alpha * 0.9})`);
    glow.addColorStop(0.76, marker.severity >= 0.9 ? `rgba(255,132,84,${alpha * 0.92})` : `rgba(255,220,112,${alpha * 0.86})`);
    glow.addColorStop(1, "rgba(255,72,108,0)");
    context.fillStyle = glow;
    context.fillRect(x - zoneWidth / 2, baseY - zoneHeight, zoneWidth, zoneHeight + 4);

    context.fillStyle = marker.severity >= 0.9 ? "rgba(255,76,110,0.54)" : "rgba(255,194,102,0.42)";
    context.fillRect(x - 1.25, baseY - zoneHeight * 0.76, 2.5, zoneHeight * 0.72);
  });
}

function drawQuantizedLogBlocks(
  context: CanvasRenderingContext2D,
  samples: LogWaveOverlayPoint[],
  width: number,
  baseY: number,
  amplitudeScale: number,
  steps = 56,
): void {
  if (
    samples.length === 0 ||
    steps <= 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(baseY) ||
    !Number.isFinite(amplitudeScale)
  ) {
    return;
  }
  const blockWidth = width / steps;
  for (let step = 0; step < steps; step += 1) {
    const sampleIndex = Math.min(
      samples.length - 1,
      Math.floor((step / Math.max(1, steps - 1)) * samples.length),
    );
    const sample = samples[sampleIndex];
    if (!sample) {
      continue;
    }

    const x = step * blockWidth;
    const drawWidth = Math.max(2, blockWidth - 1);
    const height = amplitudeScale * (0.12 + Math.max(0.06, sample.level) * 0.72);
    if (![x, drawWidth, height].every(Number.isFinite)) {
      continue;
    }

    context.fillStyle = sample.heat >= 0.68
      ? "rgba(255,96,110,0.68)"
      : sample.heat >= 0.28
        ? "rgba(255,194,92,0.58)"
        : "rgba(120,198,255,0.28)";
    context.fillRect(x, baseY - height, drawWidth, height);

    if (sample.heat >= 0.68) {
      context.fillStyle = "rgba(255,232,236,0.18)";
      context.fillRect(x, baseY - height, drawWidth, Math.max(4, height * 0.45));
    }
  }
}

function drawSingleSidedWaveform(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  baseY: number,
  amplitudeScale: number,
  fillStyle: CanvasGradient | string,
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  context.moveTo(0, baseY);

  samples.forEach((value, index) => {
    const x = index * stepX;
    const y = baseY - value * amplitudeScale;
    context.lineTo(x, y);
  });

  context.lineTo(width, baseY);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

function drawWaveContour(
  context: CanvasRenderingContext2D,
  samples: number[],
  width: number,
  centerY: number,
  amplitudeScale: number,
  strokeStyle: string,
  lineWidth: number,
  direction: "top" | "bottom",
): void {
  if (samples.length === 0) {
    return;
  }

  const stepX = width / Math.max(1, samples.length - 1);
  context.beginPath();
  samples.forEach((value, index) => {
    const x = index * stepX;
    const y = direction === "top"
      ? centerY - value * amplitudeScale
      : centerY + value * amplitudeScale;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function MiniWave({ color = "var(--color-accent)", count = 20, active = true, seed = "maia" }) {
  // Deterministic heights based on seed string using a better generator
  const getHeights = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let t = Math.abs(hash);
    return Array.from({ length: count }).map((_, i) => {
      t = (t * 1664525 + 1013904223) >>> 0;
      const h = (t % 70) + 15;
      return h;
    });
  };

  const heights = getHeights(seed);

  return (
    <div className={`visual-wave-static ${active ? "active" : ""}`}>
      {heights.map((h, i) => (
        <div 
          key={i} 
          className="wave-bar-static" 
          style={{ 
            backgroundColor: active ? color : 'var(--text-muted)',
            height: `${h}%`,
            opacity: active ? 1 : 0.3
          }} 
        />
      ))}
    </div>
  );
}

interface ModernSelectorProps<T> {
  label: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderTitle: (item: T) => string;
  renderSub: (item: T) => string;
  color: string;
  seedPrefix?: string;
  renderAction?: (item: T, isSelected: boolean) => React.ReactNode;
  renderWave?: (item: T, isSelected: boolean) => React.ReactNode;
}

function ModernSelector<T extends { id: string }>({ 
  label, 
  items, 
  selectedId, 
  onSelect, 
  renderTitle, 
  renderSub,
  color,
  seedPrefix = "item",
  renderAction,
  renderWave,
}: ModernSelectorProps<T>) {
  return (
    <div className="modern-selector">
      <label className="setup-label">{label}</label>
      <div className="selector-grid">
        {items.map(item => {
          const isSelected = item.id === selectedId;
          return (
            <div 
              key={item.id} 
              className={`selector-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="card-content">
                <span className="card-title">{renderTitle(item)}</span>
                <span className="card-sub">{renderSub(item)}</span>
              </div>
              {renderAction ? (
                <div
                  onClick={(event) => event.stopPropagation()}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  {renderAction(item, isSelected)}
                </div>
              ) : null}
              <div className="card-wave">
                {renderWave ? (
                  renderWave(item, isSelected)
                ) : (
                  <MiniWave 
                    color={color} 
                    count={isSelected ? 14 : 6} 
                    active={isSelected} 
                    seed={`${seedPrefix}-${item.id}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SimpleMonitorScreen({ 
  session, 
  metrics, 
  pastSessions,
  repositories,
  tracks,
  onStop,
  onResumeAudio,
  audioStatus,
  audioContext,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  trackName,
  waveformBins,
  isConsoleExpanded = false,
  onToggleConsole
}: SimpleMonitorScreenProps) {
  const isListening = !!session;
  const safePastSessions = Array.isArray(pastSessions) ? pastSessions : [];
  const safeRepositories = Array.isArray(repositories) ? repositories : [];
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const [liveLines, setLiveLines] = useState<MonitorLogLine[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedSoundId, setSelectedSoundId] = useState("");
  const [logSignalBuffer, setLogSignalBuffer] = useState<{val: number, heat: number}[]>(new Array(120).fill({val: 10, heat: 0}));
  const [isAnomalyFilterActive, setIsAnomalyFilterActive] = useState(false);
  const [waveformScale, setWaveformScale] = useState(1.0);
  const [trackWaveProgress, setTrackWaveProgress] = useState(0);
  const [trackElapsedSeconds, setTrackElapsedSeconds] = useState(0);
  const [trackDurationSeconds, setTrackDurationSeconds] = useState<number | null>(null);
  const [liveSuggestedBpm, setLiveSuggestedBpm] = useState<number | null>(null);
  const [waveformAnomalies, setWaveformAnomalies] = useState<WaveformAnomalyMarker[]>([]);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundGraphRef = useRef<BackgroundTrackGraph | null>(null);
  const backgroundAudioUrlRef = useRef<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const audioProbePlayedRef = useRef(false);
  const lastCueAccentAtRef = useRef(0);
  const smoothedPressureRef = useRef(0);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const waveformStageRef = useRef<HTMLDivElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isOverviewScrubbingRef = useRef(false);
  const activeOverviewPointerIdRef = useRef<number | null>(null);
  const isDeckScrubbingRef = useRef(false);
  const activeDeckPointerIdRef = useRef<number | null>(null);
  const terminalLinesRef = useRef<HTMLDivElement | null>(null);
  const isTailPinnedRef = useRef(true);
  const focusSelectedLogRef = useRef(false);
  const deckScrubStartProgressRef = useRef(0);
  const deckScrubStartRatioRef = useRef(0.5);
  const lineRefs = useRef(new Map<string, HTMLDivElement>());
  const activeTrack =
    safeTracks.find((track) => getTrackTitle(track) === (trackName || session?.trackName)) ?? null;
  const deckBpm = liveSuggestedBpm ?? activeTrack?.analysis?.bpm ?? null;
  const deckDurationSeconds = trackDurationSeconds ?? activeTrack?.analysis?.durationSeconds ?? null;
  const activeBeatGrid = activeTrack?.analysis?.beatGrid ?? activeTrack?.beatGrid ?? [];

  const playTestTone = () => {
    if (!audioContext || audioContext.state !== "running") {
      return;
    }

    const now = audioContext.currentTime + 0.02;
    [164.81, 220, 329.63].forEach((frequency, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startAt = now + index * 0.16;
      osc.type = index === 2 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(0.14, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.24);
    });
  };

  const playCueBatch = (cues: Array<{ noteHz?: number; gain?: number; durationMs?: number; waveform?: OscillatorType }>) => {
    if (!audioContext || audioContext.state !== "running") {
      return;
    }

    const now = audioContext.currentTime + 0.03;
    cues.slice(0, 2).forEach((cue, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startAt = now + index * 0.05;
      const noteHz = typeof cue.noteHz === "number" ? cue.noteHz : 180 + index * 30;
      const duration = Math.max(0.12, (cue.durationMs ?? 140) / 1000);
      const level = backgroundGraphRef.current
        ? Math.max(0.003, Math.min(0.012, (cue.gain ?? 0.04) * 0.12))
        : Math.max(0.02, Math.min(0.12, (cue.gain ?? 0.08) * 1.2));
      osc.type = cue.waveform ?? "sine";
      osc.frequency.setValueAtTime(noteHz, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(level, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.03);
    });
  };

  const toggleTrackPreview = async (track: LibraryTrack) => {
    const playablePath = resolvePlayableTrackPath(track);
    if (!playablePath) {
      return;
    }

    if (previewTrackId === track.id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const previewUrl = await resolvePreviewAudioUrl(playablePath);
    previewUrlRef.current = previewUrl;
    const nextAudio = new Audio(previewUrl);
    nextAudio.volume = 0.92;
    nextAudio.preload = "auto";
    previewAudioRef.current = nextAudio;
    setPreviewTrackId(track.id);
    nextAudio.addEventListener(
      "ended",
      () => {
        if (previewAudioRef.current === nextAudio) {
          previewAudioRef.current = null;
          revokePreviewAudioUrl(previewUrlRef.current);
          previewUrlRef.current = null;
          setPreviewTrackId(null);
        }
      },
      { once: true },
    );

    try {
      await nextAudio.play();
    } catch (error) {
      console.warn("Track preview playback failed", error);
      if (previewAudioRef.current === nextAudio) {
        previewAudioRef.current = null;
      }
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
    }
  };

  const ensureBackgroundGraph = (audio: HTMLAudioElement, context: AudioContext): BackgroundTrackGraph | null => {
    const existing = backgroundGraphRef.current;
    if (existing && existing.context === context && existing.audio === audio) {
      return existing;
    }

    try {
      const source = context.createMediaElementSource(audio);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 18000;
      filter.Q.value = 1;

      const dryGain = context.createGain();
      dryGain.gain.value = 1;

      const driveNode = context.createWaveShaper();
      driveNode.curve = createDriveCurve(1.2);
      driveNode.oversample = "4x";

      const driveWetGain = context.createGain();
      driveWetGain.gain.value = 0.0001;

      const outputGain = context.createGain();
      outputGain.gain.value = 0.82;

      const deckGain = context.createGain();
      deckGain.gain.value = 1;

      source.connect(filter);
      filter.connect(dryGain);
      dryGain.connect(outputGain);
      filter.connect(driveNode);
      driveNode.connect(driveWetGain);
      driveWetGain.connect(outputGain);
      outputGain.connect(deckGain);
      deckGain.connect(context.destination);

      const graph = {
        context,
        audio,
        source,
        filter,
        dryGain,
        driveNode,
        driveWetGain,
        outputGain,
        deckGain,
      };
      backgroundGraphRef.current = graph;
      return graph;
    } catch (error) {
      console.warn("Simple monitor graph setup failed", error);
      return null;
    }
  };

  const applyTrackMutation = (update: {
    lineCount?: number;
    anomalyCount?: number;
    levelCounts?: Record<string, number>;
  }) => {
    const graph = backgroundGraphRef.current;
    const audio = backgroundAudioRef.current;
    if (!graph || !audio || graph.context.state !== "running") {
      return;
    }

    const lineCount = Math.max(1, update.lineCount ?? 0);
    const levelCounts = update.levelCounts ?? {};
    const warnCount = levelCounts.WARN ?? levelCounts.warn ?? 0;
    const errorCount = levelCounts.ERROR ?? levelCounts.error ?? 0;
    const anomalyRatio = clamp01((update.anomalyCount ?? 0) / lineCount);
    const severityRatio = clamp01((warnCount * 0.45 + errorCount) / lineCount);
    const densityRatio = clamp01(lineCount / 18);
    const instantPressure = clamp01(anomalyRatio * 0.58 + severityRatio * 0.27 + densityRatio * 0.15);
    const pressure = clamp01(smoothedPressureRef.current * 0.74 + instantPressure * 0.26);
    smoothedPressureRef.current = pressure;
    const now = graph.context.currentTime;
    const recoverAt = now + 1.8;

    const filterHz = Math.max(5200, 21000 - 6200 * pressure);
    const filterQ = 0.6 + pressure * 1.2;
    const bedGain = Math.max(0.8, 0.92 - pressure * 0.05);
    const driveWet = pressure > 0.32 ? clamp01((pressure - 0.32) * 0.18) : 0;
    const deckGain = Math.max(0.94, 1 - pressure * 0.03);
    const playbackRate = 1;

    graph.filter.frequency.cancelScheduledValues(now);
    graph.filter.frequency.setValueAtTime(graph.filter.frequency.value, now);
    graph.filter.frequency.exponentialRampToValueAtTime(filterHz, now + 0.18);
    graph.filter.frequency.exponentialRampToValueAtTime(18000, recoverAt);

    graph.filter.Q.cancelScheduledValues(now);
    graph.filter.Q.setValueAtTime(graph.filter.Q.value, now);
    graph.filter.Q.linearRampToValueAtTime(filterQ, now + 0.18);
    graph.filter.Q.linearRampToValueAtTime(1, recoverAt);

    graph.outputGain.gain.cancelScheduledValues(now);
    graph.outputGain.gain.setValueAtTime(graph.outputGain.gain.value, now);
    graph.outputGain.gain.linearRampToValueAtTime(bedGain, now + 0.16);
    graph.outputGain.gain.linearRampToValueAtTime(0.82, recoverAt);

    graph.dryGain.gain.cancelScheduledValues(now);
    graph.dryGain.gain.setValueAtTime(graph.dryGain.gain.value, now);
    graph.dryGain.gain.linearRampToValueAtTime(Math.max(0.9, 1 - driveWet * 0.12), now + 0.16);
    graph.dryGain.gain.linearRampToValueAtTime(1, recoverAt);

    graph.driveWetGain.gain.cancelScheduledValues(now);
    graph.driveWetGain.gain.setValueAtTime(graph.driveWetGain.gain.value, now);
    graph.driveWetGain.gain.linearRampToValueAtTime(Math.max(0.0001, driveWet), now + 0.16);
    graph.driveWetGain.gain.linearRampToValueAtTime(0.0001, recoverAt);

    graph.driveNode.curve = createDriveCurve(1.1 + driveWet * 1.8);

    graph.deckGain.gain.cancelScheduledValues(now);
    graph.deckGain.gain.setValueAtTime(graph.deckGain.gain.value, now);
    graph.deckGain.gain.linearRampToValueAtTime(deckGain, now + 0.14);
    graph.deckGain.gain.linearRampToValueAtTime(1, recoverAt);

    if (pressure > 0.8 && errorCount > 1) {
      const gateDepth = Math.min(0.08, 0.02 + pressure * 0.04);
      const gateFloor = Math.max(0.92, deckGain * (1 - gateDepth));
      const pulseAt = now + 0.18;
      graph.deckGain.gain.linearRampToValueAtTime(gateFloor, pulseAt + 0.04);
      graph.deckGain.gain.linearRampToValueAtTime(deckGain, pulseAt + 0.18);
    }

    audio.playbackRate = playbackRate;
  };

  const simulateLog = () => {
    const levels = ["info", "warn", "error", "debug"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const messages = [
      "SYNTH_PULSE_DETECTED: Signal strength at 89%",
      "NODE_HANDSHAKE: Peer connection established",
      "ANOMALY_TRIGGER: Out-of-bounds telemetry detected",
      "BUFFER_FLUSH: Real-time stream synchronized",
      "MAIA_CORE: Sonification engine optimized"
    ];
    const mock = {
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      level,
      message: messages[Math.floor(Math.random() * messages.length)]
    };
    setLiveLines(prev => [mock, ...prev].slice(0, 50));
    setLogSignalBuffer(prev => {
      const heat = level === "error" ? 1.0 : level === "warn" ? 0.5 : 0;
      const val = 40 + (heat * 100);
      const newBuffer = [...prev];
      for (let i = 0; i < 60; i++) {
        newBuffer[i] = prev[i + 1] || {val: 20, heat: 0};
      }
      newBuffer[60] = { val, heat }; // Insert EXACTLY at the center playhead
      for (let i = 61; i < 120; i++) {
        newBuffer[i] = { val: 20, heat: 0 }; // Future is empty
      }
      return newBuffer;
    });
  };

  useEffect(() => {
    try {
      if (isListening) {
        setLiveLines([{
          id: "maia-monitor-init",
          timestamp: new Date().toLocaleTimeString().split(' ')[0],
          level: "info",
          message: `MAIA_MONITOR_INITIALIZED: Handshake successful. Tailing ${getBasename(session?.sourcePath)}...`,
          isAnomaly: false,
          anomalyId: null,
        }]);
      } else {
        setLiveLines([]);
        setLogSignalBuffer(new Array(120).fill({val: 10, heat: 0}));
        setLiveSuggestedBpm(null);
        setTrackElapsedSeconds(0);
        setTrackDurationSeconds(null);
        setWaveformAnomalies([]);
        setSelectedAnomalyId(null);
        audioProbePlayedRef.current = false;
        backgroundAudioRef.current = null;
        safeRevokePreviewAudioUrl(backgroundAudioUrlRef.current);
        backgroundAudioUrlRef.current = null;
        backgroundGraphRef.current = null;
      }
    } catch (error) {
      console.error("[MAIA:UI] monitor reset effect failed", error);
      backgroundAudioRef.current = null;
      backgroundGraphRef.current = null;
    }
  }, [isListening, session?.sourcePath]);

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    if (!isListening) {
      setTrackWaveProgress(0);
      return;
    }

    let frameId = 0;
    const updateProgress = () => {
      const audio = backgroundAudioRef.current;
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        setTrackWaveProgress(clamp01(audio.currentTime / audio.duration));
        setTrackElapsedSeconds(audio.currentTime);
        setTrackDurationSeconds(audio.duration);
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    frameId = window.requestAnimationFrame(updateProgress);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isListening]);

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    if (!isListening || !session?.trackName) {
      return;
    }

    let cancelled = false;

    const bindBackgroundTrack = async () => {
    const selectedTrack = safeTracks.find(
      (track) => getTrackTitle(track) === session.trackName,
    );
    const playablePath = selectedTrack ? resolvePlayableTrackPath(selectedTrack) : null;
    if (!playablePath) {
      return;
    }

      const playbackUrl = await resolvePreviewAudioUrl(playablePath);
      if (cancelled) {
        revokePreviewAudioUrl(playbackUrl);
        return;
      }

      const audio = backgroundAudioRef.current ?? new Audio();
      backgroundAudioRef.current = audio;
      audio.loop = true;
      audio.volume = 1;
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      if (audio.src !== playbackUrl) {
        audio.pause();
        revokePreviewAudioUrl(backgroundAudioUrlRef.current);
        backgroundAudioUrlRef.current = playbackUrl;
        audio.src = playbackUrl;
        audio.currentTime = 0;
      } else if (!backgroundAudioUrlRef.current) {
        backgroundAudioUrlRef.current = playbackUrl;
      }

      if (audioContext && audioContext.state === "running") {
        ensureBackgroundGraph(audio, audioContext);
      }

      void audio.play().catch((error) => {
        console.warn("Simple monitor background playback failed", error);
      });
    };

    void bindBackgroundTrack();

    return () => {
      cancelled = true;
      const audio = backgroundAudioRef.current;
      if (audio) {
        audio.pause();
      }
    };
  }, [audioContext, isListening, safeTracks, session?.trackName]);

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    if (!isListening) return;
    
    const unsub = subscribe((update) => {
      setLiveSuggestedBpm(
        typeof update.suggestedBpm === "number" && Number.isFinite(update.suggestedBpm)
          ? update.suggestedBpm
          : null,
      );
      const cues = Array.isArray(update.sonificationCues) ? update.sonificationCues : [];
      if (audioContext?.state === "running") {
        if (!audioProbePlayedRef.current) {
          audioProbePlayedRef.current = true;
          playTestTone();
        }
        const activeAudio = backgroundAudioRef.current;
        if (activeAudio) {
          ensureBackgroundGraph(activeAudio, audioContext);
          applyTrackMutation(update);
        }
        const hasBackgroundTrack = Boolean(backgroundGraphRef.current || backgroundAudioRef.current);
        const nowMs = Date.now();
        const lineCount = Math.max(1, update.lineCount ?? 0);
        const anomalyPressure = Math.max(
          (update.anomalyCount ?? 0) / lineCount,
          ((update.levelCounts?.ERROR ?? update.levelCounts?.error ?? 0) + (update.levelCounts?.WARN ?? update.levelCounts?.warn ?? 0) * 0.4) / lineCount,
        );
        const anomalyDrivenCue =
          cues.find((cue) => cue.accent === "anomaly") ??
          cues.find((cue) => (cue.gain ?? 0) >= 0.12) ??
          null;
        if (
          anomalyPressure >= 0.18 &&
          anomalyDrivenCue &&
          (!hasBackgroundTrack || nowMs - lastCueAccentAtRef.current >= 1800)
        ) {
          lastCueAccentAtRef.current = nowMs;
          playCueBatch(cues);
        }
      }

      if (update.parsedLines && update.parsedLines.length > 0) {
        // Parse raw lines into objects for UI display and signal mapping
        const parsed = update.parsedLines.map((raw, lineIndex) => {
          const levelMatch = raw.match(/\[(ERROR|WARN|INFO|DEBUG|TRACE)\]/i);
          const level = levelMatch ? levelMatch[1].toLowerCase() : "info";
          const tsMatch = raw.match(/\[(.*?)\]/);
          const timestamp = tsMatch ? tsMatch[1] : new Date().toLocaleTimeString().split(' ')[0];
          
          // Clean message: remove the tags if they exist to keep it readable
          const message = raw.replace(/\[.*?\]\s*\[.*?\]\s*/, '');
          const isAnomaly =
            level === "error" ||
            level === "warn" ||
            /anomal|timeout|exception|failed|retry|fatal/i.test(message);
          const anomalyId = isAnomaly
            ? `${timestamp}-${lineIndex}-${message.slice(0, 48)}`
            : null;

          return {
            id: `${timestamp}-${lineIndex}-${message.slice(0, 64)}`,
            timestamp,
            level,
            message,
            isAnomaly,
            anomalyId,
          } satisfies MonitorLogLine;
        });

        setLiveLines((prev) => [...prev, ...parsed].slice(-200));
        setWaveformAnomalies((prev) => {
          const retained = prev.filter((marker) => marker.progress >= 0 && marker.progress <= 1);

          const anomalyLines = parsed.filter((line) => line.isAnomaly && line.anomalyId);
          const durationSeconds = backgroundAudioRef.current?.duration ?? deckDurationSeconds;
          const beatGrid = activeTrack?.analysis?.beatGrid ?? activeTrack?.beatGrid ?? [];
          const bpm = liveSuggestedBpm ?? activeTrack?.analysis?.bpm ?? null;
          const currentProgress = backgroundAudioRef.current?.duration
            ? clamp01(backgroundAudioRef.current.currentTime / backgroundAudioRef.current.duration)
            : trackWaveProgress;
          const nextMarkers = anomalyLines.slice(0, 3).map((line, index) => ({
            id: line.anomalyId ?? `${line.id}-marker`,
            lineId: line.id,
            timestamp: line.timestamp,
            message: line.message,
            severity: line.level === "error" ? 1 : 0.72,
            progress: quantizeProgressToBeatGrid(
              clamp01(currentProgress + index * 0.0025),
              durationSeconds,
              bpm,
              beatGrid,
              0.25,
            ),
          }));

          return [...retained, ...nextMarkers].slice(-24);
        });
        if (parsed.some((line) => line.isAnomaly && line.anomalyId)) {
          const firstAnomaly = parsed.find((line) => line.isAnomaly && line.anomalyId);
          if (firstAnomaly?.anomalyId) {
            setSelectedAnomalyId((current) => current ?? firstAnomaly.anomalyId);
          }
        }
        
        // Push EXACTLY ONE value to the log signal buffer per stream update.
        // This ensures the visual waveform moves at the exact same rate as the 
        // crossfade audio engine (1 block = 1 poll interval), syncing sight and sound.
        setLogSignalBuffer(prev => {
          let val = 20;
          let heat = 0;
          const cues = update.sonificationCues || [];
          const anomalies = update.anomalyMarkers || [];
          
          if (cues.length > 0 || anomalies.length > 0) {
            // Volume logic: based purely on sonification gain (how loud the output is)
            const avgGain = cues.length > 0 ? cues.reduce((s, c) => s + c.gain, 0) / cues.length : 0;
            // Map gain to visual height (0 to 140)
            val = 20 + Math.min(120, avgGain * 150);
            
            // Heat logic: based purely on anomaly presence (triggers red color)
            heat = anomalies.length > 0 ? 0.5 + Math.min(0.5, anomalies.length * 0.1) : 0;
          } else {
            // Low resting pulse if lines arrived but no cues/anomalies
            val = 30 + Math.random() * 10;
          }
          
          const newBuffer = [...prev];
          // Shift the past leftwards
          for (let i = 0; i < 60; i++) {
             newBuffer[i] = prev[i + 1] || {val: 20, heat: 0};
          }
          // Insert the new live data EXACTLY at the center playhead
          const previousCenter = prev[60] || { val: 20, heat: 0 };
          newBuffer[60] = {
            val: previousCenter.val * 0.52 + val * 0.48,
            heat: previousCenter.heat * 0.35 + heat * 0.65,
          };
          // The future side keeps a soft decay tail so the wave does not collapse abruptly.
          for (let i = 61; i < 120; i++) {
             const decay = 1 - (i - 60) / 60;
             const eased = Math.max(0, decay * decay);
             const prevFuture = prev[i] || { val: 20, heat: 0 };
             newBuffer[i] = {
               val: 20 + (newBuffer[60].val - 20) * eased * 0.52 + (prevFuture.val - 20) * 0.26,
               heat: newBuffer[60].heat * eased * 0.62 + prevFuture.heat * 0.18,
             };
          }
          return newBuffer;
        });
      } else {
        // Idle pulse when no data
        setLogSignalBuffer(prev => {
          const idle = (Math.sin(Date.now() / 300) * 8 + 18);
          const newBuffer = [...prev];
          for (let i = 0; i < 60; i++) {
             newBuffer[i] = prev[i + 1] || {val: 20, heat: 0};
          }
          newBuffer[60] = { val: idle, heat: 0 };
          for (let i = 61; i < 120; i++) {
             const prevFuture = prev[i] || { val: 20, heat: 0 };
             newBuffer[i] = {
               val: 20 + (prevFuture.val - 20) * 0.82,
               heat: prevFuture.heat * 0.78,
             };
          }
          return newBuffer;
        });
      }
    });
    return unsub;
  }, [activeTrack, audioContext, deckDurationSeconds, isListening, liveSuggestedBpm, subscribe, trackWaveProgress]);

  useEffect(() => {
    const container = terminalLinesRef.current;
    if (!container) {
      return;
    }

    if (focusSelectedLogRef.current && selectedAnomalyId) {
      const line = liveLines.find((entry) => entry.anomalyId === selectedAnomalyId);
      if (line) {
        const node = lineRefs.current.get(line.id);
        if (node) {
          node.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
      focusSelectedLogRef.current = false;
      return;
    }

    if (isTailPinnedRef.current) {
      safeElementScrollTo(container, container.scrollHeight, "auto");
    }
  }, [liveLines, selectedAnomalyId]);

  const uptimeSeconds = session
    ? Math.floor((Date.now() - session.startedAt) / 1000)
    : 0;
  const uptimeLabel =
    uptimeSeconds < 60
      ? `${uptimeSeconds}s`
      : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;
  const deckRemainingSeconds =
    typeof deckDurationSeconds === "number"
      ? Math.max(0, deckDurationSeconds - trackElapsedSeconds)
      : null;
  const visibleWindowSeconds = resolveVisibleWindowSeconds(deckBpm, activeBeatGrid);
  const trackWaveSamples = sampleTrackWaveWindow(
    waveformBins ?? null,
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
  );
  const deckTimelineMarkers = buildDeckTimelineMarkers(
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
  );
  const deckBeatMarkers = buildDeckBeatMarkers(
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
  );
  const overviewWaveSamples = sampleOverviewWave(waveformBins ?? null);
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
  const sortedPastSessions = [...safePastSessions].sort((left, right) => {
    const statusWeight = (session: PersistedSession) =>
      session.status === "active" ? 3 : session.status === "paused" ? 2 : 1;
    const statusDelta = statusWeight(right) - statusWeight(left);
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const timeDelta = resolveSessionSortTimestamp(right) - resolveSessionSortTimestamp(left);
    if (timeDelta !== 0) {
      return timeDelta;
    }

    const anomalyDelta = right.totalAnomalies - left.totalAnomalies;
    if (anomalyDelta !== 0) {
      return anomalyDelta;
    }

    return right.totalLines - left.totalLines;
  });

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    const canvas = overviewCanvasRef.current;
    if (!canvas) {
      return;
    }

    const width = Math.max(1, Math.floor(canvas.clientWidth));
    const height = Math.max(1, Math.floor(canvas.clientHeight));
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const floorY = height - 2;
    const amplitude = Math.max(8, height - 6);
    const baseGlow = context.createLinearGradient(0, floorY - 8, 0, floorY + 4);
    baseGlow.addColorStop(0, "rgba(72,215,255,0)");
    baseGlow.addColorStop(0.72, "rgba(72,215,255,0.18)");
    baseGlow.addColorStop(1, "rgba(72,215,255,0.04)");
    context.fillStyle = baseGlow;
    context.fillRect(0, floorY - 8, width, 12);

    const fillGradient = context.createLinearGradient(0, 0, width, 0);
    fillGradient.addColorStop(0, "rgba(255,120,92,0.82)");
    fillGradient.addColorStop(0.16, "rgba(244,214,94,0.84)");
    fillGradient.addColorStop(0.3, "rgba(195,255,108,0.86)");
    fillGradient.addColorStop(0.5, "rgba(255,198,82,0.88)");
    fillGradient.addColorStop(0.68, "rgba(120,198,255,0.88)");
    fillGradient.addColorStop(1, "rgba(176,222,255,0.78)");
    drawSingleSidedWaveform(context, overviewWaveSamples, width, floorY, amplitude, fillGradient);
    drawWaveContour(context, overviewWaveSamples, width, floorY, amplitude, "rgba(255,255,255,0.38)", 1, "top");

    waveformAnomalies.forEach((marker) => {
      const x = marker.progress * width;
      const markerHeight = Math.max(8, 6 + marker.severity * 10);
      const isCritical = marker.severity >= 0.9;
      const glow = context.createLinearGradient(0, floorY - markerHeight - 8, 0, floorY + 2);
      if (isCritical) {
        glow.addColorStop(0, "rgba(255,72,108,0)");
        glow.addColorStop(0.45, "rgba(255,72,108,0.2)");
        glow.addColorStop(0.8, "rgba(255,188,112,0.24)");
        glow.addColorStop(1, "rgba(255,72,108,0)");
      } else {
        glow.addColorStop(0, "rgba(255,196,92,0)");
        glow.addColorStop(0.45, "rgba(255,196,92,0.16)");
        glow.addColorStop(0.8, "rgba(255,232,164,0.2)");
        glow.addColorStop(1, "rgba(255,196,92,0)");
      }
      context.fillStyle = glow;
      context.fillRect(x - 2, floorY - markerHeight - 8, 4, markerHeight + 10);

      context.fillStyle = isCritical ? "rgba(255,72,108,0.62)" : "rgba(255,196,92,0.56)";
      context.fillRect(x - 1, floorY - markerHeight, 2, markerHeight);
    });
  }, [overviewWaveSamples, waveformAnomalies]);

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    const canvas = waveformCanvasRef.current;
    const stage = waveformStageRef.current;
    if (!canvas || !stage) {
      return;
    }

    const width = Math.max(1, Math.floor(stage.clientWidth));
    const height = Math.max(1, Math.floor(stage.clientHeight));
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const bgGradient = context.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "rgba(9,14,19,0.98)");
    bgGradient.addColorStop(0.45, "rgba(3,6,10,0.99)");
    bgGradient.addColorStop(1, "rgba(0,0,0,1)");
    context.fillStyle = bgGradient;
    context.fillRect(0, 0, width, height);

    const headerInset = Math.max(46, height * 0.16);
    const footerInset = Math.max(10, height * 0.08);
    const deckHeight = Math.max(48, height - headerInset - footerInset);
    const trackBaseY = headerInset + deckHeight * 0.22;
    const trackAmplitude = Math.max(12, deckHeight * 0.16);
    const logBaseY = headerInset + deckHeight * 0.88;
    const logAmplitude = Math.max(18, deckHeight * 0.26);
    const separatorY = headerInset + deckHeight * 0.56;
    const centerBandHeight = Math.max(2, height * 0.012);

    context.fillStyle = "rgba(255,255,255,0.04)";
    context.fillRect(0, headerInset - 1, width, 1);
    context.fillRect(0, separatorY, width, 1);

    const trackLaneGlow = context.createLinearGradient(0, trackBaseY - trackAmplitude - 10, 0, trackBaseY + 8);
    trackLaneGlow.addColorStop(0, "rgba(72,215,255,0)");
    trackLaneGlow.addColorStop(0.5, "rgba(72,215,255,0.12)");
    trackLaneGlow.addColorStop(1, "rgba(72,215,255,0.04)");
    context.fillStyle = trackLaneGlow;
    context.fillRect(0, trackBaseY - trackAmplitude - 10, width, trackAmplitude + 20);

    const logLaneGlow = context.createLinearGradient(0, logBaseY - logAmplitude - 12, 0, logBaseY + 10);
    logLaneGlow.addColorStop(0, "rgba(255,176,84,0)");
    logLaneGlow.addColorStop(0.5, "rgba(255,176,84,0.08)");
    logLaneGlow.addColorStop(1, "rgba(72,215,255,0.06)");
    context.fillStyle = logLaneGlow;
    context.fillRect(0, logBaseY - logAmplitude - 12, width, logAmplitude + 22);

    context.fillStyle = "rgba(72,215,255,0.88)";
    context.fillRect(0, logBaseY - centerBandHeight / 2, width, centerBandHeight);

    const trackFillGradient = context.createLinearGradient(0, trackBaseY - trackAmplitude, 0, trackBaseY + 2);
    trackFillGradient.addColorStop(0, "rgba(236,246,255,0.92)");
    trackFillGradient.addColorStop(0.14, "rgba(182,223,255,0.9)");
    trackFillGradient.addColorStop(0.52, "rgba(92,188,255,0.84)");
    trackFillGradient.addColorStop(1, "rgba(34,120,196,0.68)");
    context.globalAlpha = 0.96;
    drawSingleSidedWaveform(context, trackWaveSamples, width, trackBaseY, trackAmplitude, trackFillGradient);

    const glossGradient = context.createLinearGradient(0, trackBaseY - trackAmplitude, 0, trackBaseY);
    glossGradient.addColorStop(0, "rgba(255,255,255,0.28)");
    glossGradient.addColorStop(0.4, "rgba(255,255,255,0.06)");
    glossGradient.addColorStop(1, "rgba(255,255,255,0.04)");
    context.globalCompositeOperation = "screen";
    context.globalAlpha = 0.56;
    drawSingleSidedWaveform(context, trackWaveSamples, width, trackBaseY, trackAmplitude * 0.9, glossGradient);
    context.globalCompositeOperation = "source-over";

    const logLaneBed = context.createLinearGradient(0, logBaseY - logAmplitude, 0, logBaseY + 2);
    logLaneBed.addColorStop(0, "rgba(255,176,84,0.04)");
    logLaneBed.addColorStop(0.6, "rgba(255,196,92,0.08)");
    logLaneBed.addColorStop(1, "rgba(72,215,255,0.08)");
    context.fillStyle = logLaneBed;
    context.fillRect(0, logBaseY - logAmplitude, width, logAmplitude + 4);

    const logSamples = logWaveOverlay.map((point) => Math.max(0.04, point.level * (0.2 + point.heat * 0.45)));
    const logGradient = context.createLinearGradient(0, logBaseY - logAmplitude, 0, logBaseY + 2);
    logGradient.addColorStop(0, "rgba(255,132,96,0.42)");
    logGradient.addColorStop(0.6, "rgba(255,196,92,0.34)");
    logGradient.addColorStop(1, "rgba(120,198,255,0.16)");
    context.globalCompositeOperation = "screen";
    context.globalAlpha = 0.82;
    drawSingleSidedWaveform(context, logSamples, width, logBaseY, logAmplitude * 0.88, logGradient);
    context.globalCompositeOperation = "source-over";

    context.globalAlpha = 1;
    drawAnomalyWash(context, waveformAnomalies, trackWaveProgress, width, logBaseY, logAmplitude);

    drawWaveContour(context, trackWaveSamples, width, trackBaseY, trackAmplitude, "rgba(238,248,255,0.64)", 1.4, "top");
    context.fillStyle = "rgba(255,255,255,0.08)";
    context.fillRect(width * 0.5 - 1, headerInset, 2, height - headerInset - footerInset);

    const playheadGlow = context.createLinearGradient(width * 0.5 - 18, 0, width * 0.5 + 18, 0);
    playheadGlow.addColorStop(0, "rgba(255,255,255,0)");
    playheadGlow.addColorStop(0.45, "rgba(255,255,255,0.14)");
    playheadGlow.addColorStop(0.5, "rgba(255,255,255,0.92)");
    playheadGlow.addColorStop(0.55, "rgba(255,255,255,0.14)");
    playheadGlow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = playheadGlow;
    context.fillRect(width * 0.5 - 18, headerInset, 36, height - headerInset - footerInset);

    context.globalAlpha = 1;
  }, [logWaveOverlay, trackWaveSamples, trackWaveProgress, waveformAnomalies, waveformScale]);

  const seekToTrackProgress = (nextProgress: number) => {
    const audio = backgroundAudioRef.current;
    const duration = audio?.duration;
    if (!audio || !duration || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const clampedProgress = clamp01(nextProgress);
    audio.currentTime = clampedProgress * duration;
    setTrackWaveProgress(clampedProgress);
    setTrackElapsedSeconds(audio.currentTime);

    const nearestMarker = waveformAnomalies.reduce<WaveformAnomalyMarker | null>((closest, marker) => {
      if (!closest) {
        return marker;
      }
      return Math.abs(marker.progress - clampedProgress) < Math.abs(closest.progress - clampedProgress)
        ? marker
        : closest;
    }, null);

    if (nearestMarker && Math.abs(nearestMarker.progress - clampedProgress) <= 0.03) {
      focusSelectedLogRef.current = true;
      setSelectedAnomalyId(nearestMarker.id);
      if (!isConsoleExpanded) {
        onToggleConsole?.();
      }
    }
  };

  const seekTrackFromViewport = (clientX: number) => {
    const stage = waveformStageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const pointerRatio = clamp01((clientX - rect.left) / rect.width);
    const rawDeltaRatio = pointerRatio - deckScrubStartRatioRef.current;
    const signedCurve = Math.sign(rawDeltaRatio) * Math.pow(Math.abs(rawDeltaRatio), 1.35);
    const delta = signedCurve / (MONITOR_TRACK_STRIP_MULTIPLIER * 0.82);
    const nextProgress = clamp01(deckScrubStartProgressRef.current + delta);
    seekToTrackProgress(nextProgress);
  };

  const seekTrackFromOverviewViewport = (clientX: number) => {
    const canvas = overviewCanvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const nextProgress = clamp01((clientX - rect.left) / rect.width);
    seekToTrackProgress(nextProgress);
  };

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (
        isOverviewScrubbingRef.current &&
        activeOverviewPointerIdRef.current !== null &&
        event.pointerId === activeOverviewPointerIdRef.current
      ) {
        seekTrackFromOverviewViewport(event.clientX);
      }

      if (
        isDeckScrubbingRef.current &&
        activeDeckPointerIdRef.current !== null &&
        event.pointerId === activeDeckPointerIdRef.current
      ) {
        seekTrackFromViewport(event.clientX);
      }
    };

    const stopScrubbing = (event: PointerEvent) => {
      if (
        activeOverviewPointerIdRef.current !== null &&
        event.pointerId === activeOverviewPointerIdRef.current
      ) {
        isOverviewScrubbingRef.current = false;
        activeOverviewPointerIdRef.current = null;
      }

      if (
        activeDeckPointerIdRef.current !== null &&
        event.pointerId === activeDeckPointerIdRef.current
      ) {
        isDeckScrubbingRef.current = false;
        activeDeckPointerIdRef.current = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopScrubbing);
    window.addEventListener("pointercancel", stopScrubbing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopScrubbing);
      window.removeEventListener("pointercancel", stopScrubbing);
    };
  }, []);

  return (
    <div className="simple-monitor-screen">
      {isListening ? (
        <>
          {/* Active Listening State */}
          <div className="monitor-active">
            {/* Now Listening Header - Streamlined */}
            <div className="now-listening-header">
              <div className="brand-header-mini">
                <img src="/assets/branding/maia-icon-site.png" alt="MAIA" className="logo-mini" />
                <div className="status-indicator">
                  <div className="pulsing-dot teal"></div>
                  <span className="status-text">SYSTEM_ACTIVE</span>
                </div>
              </div>
              <div className="source-info">
                <span className="source-name-hd">{session?.repoTitle}</span>
                <span className="source-path-mini">{session?.sourcePath}</span>
              </div>
              <div className="metrics-row-hd">
                <div 
                  className={`metric-pill clickable ${isAnomalyFilterActive ? 'active' : ''}`}
                  onClick={() => {
                    setIsAnomalyFilterActive(!isAnomalyFilterActive);
                    if (!isConsoleExpanded) onToggleConsole?.();
                  }}
                >
                  <span className="pill-label">ANOMALIES</span>
                  <span className="pill-value alert">{metrics.totalAnomalies}</span>
                </div>
                <div className="metric-pill">
                  <span className="pill-label">UPTIME</span>
                  <span className="pill-value">{uptimeLabel}</span>
                </div>
              </div>
              <button
                className="btn-stop-hd"
                onClick={onStop}
              >
                STOP
              </button>
            </div>

            {/* Professional Terminal Tail */}
            <div className={`terminal-tail-container ${isConsoleExpanded ? 'expanded' : ''}`}>
              <div className="terminal-header" onClick={() => onToggleConsole?.()}>
                <div className="terminal-dots">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                </div>
                <span className="terminal-title">
                  {isAnomalyFilterActive ? "ANOMALY_DETECTION_STREAM" : "LIVE_SYSTEM_INGESTION"}
                </span>
                <div className="terminal-controls">
                  <button className="btn-refresh-hd" onClick={(e) => {
                    e.stopPropagation();
                    window.location.reload();
                  }} style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.6rem",
                    cursor: "pointer",
                    marginRight: "0.5rem"
                  }}>REFRESH</button>
                  <button className="btn-simulate-hd" onClick={(e) => {
                    e.stopPropagation();
                    simulateLog();
                  }}>SIMULATE_DATA</button>
                  {isAnomalyFilterActive && (
                    <button className="btn-filter-clear" onClick={(e) => {
                      e.stopPropagation();
                      setIsAnomalyFilterActive(false);
                    }}>SHOW ALL</button>
                  )}
                  <span className="terminal-action-hint">{isConsoleExpanded ? "CLOSE" : "INSPECT"}</span>
                </div>
              </div>
              <div
                className="terminal-lines"
                ref={terminalLinesRef}
                onScroll={(event) => {
                  const target = event.currentTarget;
                  const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                  isTailPinnedRef.current = distanceFromBottom <= 8;
                }}
              >
                {liveLines.length === 0 ? (
                  <div className="terminal-empty">
                    <div className="pulsing-dot teal"></div>
                    <span>WAITING_FOR_LIVE_INGESTION_STREAM...</span>
                    <p className="terminal-hint">Listening to {session?.sourcePath} in real-time</p>
                    <div className="terminal-status-badge">DIRECTORY_POLL: ACTIVE (0 LINES DETECTED)</div>
                  </div>
                ) : (
                  liveLines
                    .filter(line => !isAnomalyFilterActive || line.level === "error")
                    .map((line, i) => (
                    <div
                      key={line.id}
                      ref={(node) => {
                        if (node) {
                          lineRefs.current.set(line.id, node);
                        } else {
                          lineRefs.current.delete(line.id);
                        }
                      }}
                      className={`terminal-line ${line.level}${line.isAnomaly ? " anomaly-line" : ""}${selectedAnomalyId && line.anomalyId === selectedAnomalyId ? " linked-anomaly" : ""}`}
                      onClick={() => {
                        if (line.anomalyId) {
                          focusSelectedLogRef.current = true;
                          setSelectedAnomalyId(line.anomalyId);
                        }
                      }}
                    >
                      <span className="line-ts">[{line.timestamp}]</span>
                      <span className="line-level">{line.level.toUpperCase()}</span>
                      {line.isAnomaly ? (
                        <span className="line-anomaly-link">
                          {selectedAnomalyId === line.anomalyId ? "LINKED" : "ANOMALY"}
                        </span>
                      ) : null}
                      <span className="line-msg">{line.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Waveform Area - Rekordbox Style */}
            <div className="waveform-section-hd">
              <div className="monitor-deck-shell">
                <div className="section-controls-hd monitor-deck-topbar">
                  <div className="monitor-deck-heading">
                    <span className="section-label-hd">HD_WAVEFORM_ENGINE // SCAN_ACTIVE</span>
                    <span className="monitor-deck-trackline">
                      {trackName || "Live Ingestion"}
                      {activeTrack?.tags?.musicStyleLabel ? ` · ${activeTrack.tags.musicStyleLabel}` : ""}
                    </span>
                  </div>
                  <div className="monitor-deck-meta">
                    <div className="monitor-deck-legend" aria-label="Anomaly severity legend">
                      <span className="monitor-deck-legend__item">
                        <span className="monitor-deck-legend__swatch track" />
                        TRACK
                      </span>
                      <span className="monitor-deck-legend__item">
                        <span className="monitor-deck-legend__swatch warn" />
                        WARN
                      </span>
                      <span className="monitor-deck-legend__item">
                        <span className="monitor-deck-legend__swatch error" />
                        ERROR
                      </span>
                    </div>
                    <span className="monitor-deck-meta__chip">
                      BPM {typeof deckBpm === "number" ? deckBpm.toFixed(0) : "--"}
                    </span>
                    <span className="monitor-deck-meta__chip">
                      {formatDeckTime(trackElapsedSeconds)}
                    </span>
                    <span className="monitor-deck-meta__chip subtle">
                      -{formatDeckTime(deckRemainingSeconds)}
                    </span>
                  </div>
                </div>
                <div className="zoom-control-vertical">
                  <span className="zoom-label-vertical">H</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3.5" 
                    step="0.1" 
                    value={waveformScale}
                    onChange={(e) => setWaveformScale(parseFloat(e.target.value))}
                    className="zoom-slider-vertical"
                    /* @ts-ignore - non-standard attribute for vertical slider */
                    orient="vertical"
                  />
                  <span className="zoom-value-vertical">{waveformScale.toFixed(1)}</span>
                </div>

                <div className="waveform-dual-channel" style={{ height: `${190 * waveformScale}px` }}>
                  <div className="monitor-overview-shell">
                    <div
                      className="monitor-overview-wave"
                      aria-hidden="true"
                      onPointerDown={(event) => {
                        isOverviewScrubbingRef.current = true;
                        activeOverviewPointerIdRef.current = event.pointerId;
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        seekTrackFromOverviewViewport(event.clientX);
                      }}
                      onClick={(event) => seekTrackFromOverviewViewport(event.clientX)}
                    >
                      <canvas ref={overviewCanvasRef} className="monitor-overview-wave__canvas" />
                      <span className="monitor-overview-wave__label">TRACK OVERVIEW</span>
                      <div className="monitor-overview-wave__anomalies">
                        {overviewAnomalyMarkers.map((marker) => (
                          <button
                            key={`overview-${marker.id}`}
                            type="button"
                            className={`monitor-overview-wave__anomaly${selectedAnomalyId === marker.id ? " active" : ""}${marker.severity >= 0.9 ? " critical" : " warning"}`}
                            style={{ left: `${marker.leftPercent}%` }}
                            title={`${marker.timestamp} · ${marker.message}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              seekToTrackProgress(marker.progress);
                              focusSelectedLogRef.current = true;
                              setSelectedAnomalyId(marker.id);
                              if (!isConsoleExpanded) {
                                onToggleConsole?.();
                              }
                            }}
                            onPointerDown={(event) => {
                              event.stopPropagation();
                            }}
                          />
                        ))}
                      </div>
                      <div
                        className="monitor-overview-wave__window"
                        style={{
                          left: `${overviewWindowLeftPercent}%`,
                          width: `${overviewWindowWidthPercent}%`,
                        }}
                      />
                      <span
                        className="monitor-overview-wave__playhead"
                        style={{ left: `${overviewPlayheadLeftPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="waveform-channel-hd monitor-deck-body monitor-deck-main" style={{ height: "100%", borderBottom: "none", position: "relative" }}>
                    <div className="monitor-deck-timeline" aria-hidden="true">
                      {deckTimelineMarkers.map((marker) => (
                        <div
                          key={marker.id}
                          className={`monitor-deck-timeline__marker ${marker.emphasis}`}
                          style={{ left: `${marker.leftPercent}%` }}
                        >
                          <span className="monitor-deck-timeline__tick" />
                          <span className="monitor-deck-timeline__label">{marker.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="channel-label-mini" style={{ zIndex: 30 }}>
                      <span className="label-blue">HYBRID MONITOR</span>
                    </div>

                    <div
                      ref={waveformStageRef}
                      className="waveform-container-hd monitor-deck-stage"
                      onPointerDown={(event) => {
                        isDeckScrubbingRef.current = true;
                        activeDeckPointerIdRef.current = event.pointerId;
                        const rect = event.currentTarget.getBoundingClientRect();
                        deckScrubStartRatioRef.current = clamp01((event.clientX - rect.left) / rect.width);
                        deckScrubStartProgressRef.current = trackWaveProgress;
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                        seekTrackFromViewport(event.clientX);
                      }}
                      onClick={(event) => seekTrackFromViewport(event.clientX)}
                    >
                      <canvas ref={waveformCanvasRef} className="monitor-wave-canvas" />
                      <div className="monitor-deck-lane-labels" aria-hidden="true">
                        <span className="monitor-deck-lane-label track">TRACK</span>
                        <span className="monitor-deck-lane-label log">LOG STREAM</span>
                      </div>
                      <div className="monitor-deck-beat-grid" aria-hidden="true">
                        {deckBeatMarkers.map((marker) => (
                          <span
                            key={marker.id}
                            className={`monitor-deck-beat-grid__line${marker.major ? " major" : ""}`}
                            style={{ left: `${marker.leftPercent}%` }}
                          />
                        ))}
                      </div>
                      <div className="monitor-wave-guides" aria-hidden="true">
                        <span className="monitor-wave-guides__line separator" />
                        <span className="monitor-wave-guides__line base" />
                        <span className="monitor-wave-guides__line mid" />
                        <span className="monitor-wave-guides__line top" />
                      </div>
                    </div>

                    <div className="monitor-deck-footer">
                      <div className="monitor-deck-footer__lane">
                        <span className="monitor-deck-footer__tag track">TRACK</span>
                        <span className="monitor-deck-footer__text">{trackName || "No track selected"}</span>
                      </div>
                      <div className="monitor-deck-footer__lane">
                        <span className="monitor-deck-footer__tag log">LOG STREAM</span>
                        <span className="monitor-deck-footer__text">
                          {getBasename(session?.sourcePath)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reverb/Tail visualizer */}
                <div className="waveform-glow-bg"></div>
              </div>
            </div>

              {/* Sound Status */}
              <div className="sound-status">
                <span className={metrics.totalAnomalies > 0 ? "status-alert" : "status-healthy"}>
                  {metrics.totalAnomalies > 0 
                    ? `Warning: ${metrics.totalAnomalies} anomalies detected in session` 
                    : "Signal healthy — monitoring flow"}
                </span>
              </div>
            

            {/* Action Footer */}
            <div className="monitor-footer">
              <button className="btn-secondary" onClick={onStop}>
                End session
              </button>
              <button className="btn-ghost" onClick={() => void onResumeAudio()}>
                {audioStatus === "running" ? "Audio active" : "Resume audio"}
              </button>
              <button className="btn-ghost">Bookmark anomaly</button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Idle State - Ready to Monitor */}
          <div className="monitor-idle">
            <div className="idle-container">
              <h2 className="idle-title">Start monitoring</h2>

              <div className="setup-actions-fixed setup-actions-fixed--hero">
                <button
                  className={`btn-start-listening-impactful ${selectedSourceId && selectedSoundId ? 'ready' : ''}`}
                  onClick={async () => {
                    if (selectedSourceId && selectedSoundId) {
                      await onResumeAudio();
                      onStartMonitoring(selectedSourceId, selectedSoundId);
                    }
                  }}
                  disabled={!selectedSourceId || !selectedSoundId}
                >
                  <div className="btn-impact-glitch" />
                  <Play size={28} fill="currentColor" />
                  <span className="btn-text">INITIALIZE MONITORING</span>
                  <div className="btn-impact-scan" />
                </button>
                <p className="setup-hero-hint">
                  {selectedSourceId && selectedSoundId
                    ? "Ready to start passive monitoring."
                    : "Select a log source and a sound profile below."}
                </p>
              </div>

              <div className="idle-main-grid">
                <div className="setup-container-modern">
                  <ModernSelector
                    label="Log source"
                    items={safeRepositories}
                    selectedId={selectedSourceId}
                    onSelect={setSelectedSourceId}
                    renderTitle={r => r.title}
                    renderSub={r => r.sourcePath}
                    color="var(--color-calm)"
                    seedPrefix="repo"
                  />

                  <ModernSelector
                    label="Sound profile"
                    items={safeTracks}
                    selectedId={selectedSoundId}
                    onSelect={setSelectedSoundId}
                    renderTitle={t => getTrackTitle(t)}
                    renderSub={t => t.tags.musicStyleLabel || "Ambient"}
                    color="var(--color-accent)"
                    seedPrefix="track"
                    renderAction={(track) => (
                      <button
                        type="button"
                        className="track-preview-button"
                        title={previewTrackId === track.id ? "Pause preview" : "Preview track"}
                        onClick={() => {
                          void toggleTrackPreview(track);
                        }}
                      >
                        {previewTrackId === track.id ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    )}
                    renderWave={(track, isSelected) => (
                      <TrackWaveformMini
                        bins={track.analysis?.waveformBins ?? null}
                        active={isSelected}
                      />
                    )}
                  />
                </div>

                <div className="sessions-column">
                  <h3 className="sessions-title">Past sessions</h3>
                  <div className="sessions-list">
                    {safePastSessions.length === 0 ? (
                      <p className="text-muted" style={{ padding: "1rem", fontSize: "13px" }}>No previous sessions found.</p>
                    ) : (
                      sortedPastSessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="session-row">
                          <div className="session-info">
                            <div className="session-row__top">
                              <span className="session-name">{session.label || session.sourceTitle || "Untitled Session"}</span>
                              <span className={`session-status-chip ${session.status}`}>{session.status}</span>
                            </div>
                            <span className="session-source">{session.sourcePath}</span>
                            <div className="session-row__meta">
                              <span className="session-meta-chip">{session.trackTitle || "No track"}</span>
                              <span className="session-meta-text">Updated {formatSessionUpdatedAt(session.updatedAt)}</span>
                            </div>
                          </div>
                          <div className="session-side">
                            <div className="session-stats">
                              {session.totalAnomalies > 0 && (
                                <span className="badge-anomalies">
                                  {session.totalAnomalies}
                                </span>
                              )}
                              <span className="session-duration">{formatSessionLineCount(session.totalLines)}</span>
                            </div>
                            <div className="session-actions">
                              <button
                                className="btn-ghost"
                                title="Replay"
                                onClick={() => onReplaySession(session.id, session.sourcePath || "", session.sourceTitle || "Session")}
                              >
                                <Play size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
