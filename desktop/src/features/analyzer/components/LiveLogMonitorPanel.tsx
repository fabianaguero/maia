import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useCallback,
} from "react";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { getLogger } from "../../../utils/logger";

const log = getLogger("LiveMonitor");

import type {
  BaseTrackPlaylist,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  LiveLogCue,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
} from "../../../types/library";
import type { SessionBookmark } from "../../../api/sessions";
import { ReplayFeedbackSummaryCard } from "../../../components/ReplayFeedbackSummaryCard";
import { useReplayBookmarks } from "../../../hooks/useReplayBookmarks";
import { useReplayFeedbackRecommendation } from "../../../hooks/useReplayFeedbackRecommendation";
import { resolvePlaylistTracks } from "../../../utils/playlist";
import { resolveNextPlaylistIndex } from "../../../utils/playlistRuntime";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import {
  resolvePhraseAlignedTransitionDelayMs,
  resolvePlaylistStartPlan,
  resolvePlaylistTransitionPlan,
} from "../../../utils/playlistTransition";
import { getTrackTitle, resolvePlayableTrackPath } from "../../../utils/track";
import {
  deriveLiveMutationExplanations,
  type LiveMutationExplanation,
  toLiveMutationVisualizationCues,
} from "../../../utils/liveMutationExplainability";
import { resolveReplayProgressForWindow } from "../../../utils/replay";
import {
  createBasePlaylist,
  loadMonitorPrefs,
  persistReplayFeedbackRecommendation,
  saveMonitorPrefs,
} from "../../../utils/monitorPrefs";
import {
  getStreamAdapterDescription,
  getStreamAdapterLabel,
} from "../../../utils/streamAdapter";
import { useMonitor } from "../../monitor/MonitorContext";
import {
  DEFAULT_MUTATION_PROFILE_ID,
  DEFAULT_STYLE_PROFILE_ID,
  MUTATION_PROFILES,
  STYLE_PROFILES,
  resolveMutationProfile,
  resolveStyleProfile,
} from "../../../config/liveProfiles";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import { ComponentRoutingPanel } from "./ComponentRoutingPanel";
import { LiveMonitorMutationTracePanel } from "./LiveMonitorMutationTracePanel";
import { LiveMonitorReplayBookmarksCard } from "./LiveMonitorReplayBookmarksCard";
import { LiveMonitorReplayTimelineCard } from "./LiveMonitorReplayTimelineCard";
import { PadSequencerPanel } from "./PadSequencerPanel";
import {
  blendAnchors,
  clampPan,
  deriveReferenceAnchor,
  resolveLiveSonificationScene,
  resolveArrangementVoices,
  routeCueThroughScene,
  type ArrangementTrack,
  type ArrangementVoice,
  type ComponentOverride,
  type RoutedLiveCue,
} from "./liveSonificationScene";
import {
  renderCuesToWav,
  renderBounceWav,
  BOUNCE_WINDOW_S,
  MAX_BOUNCE_WINDOWS,
} from "./wavRenderer";

const MAX_RECENT_CUES = 8;
const MAX_RECENT_MARKERS = 6;
const MAX_RECENT_WARNINGS = 4;
const MAX_RECENT_EXPLANATIONS = 6;
const MAX_PARSED_LINES = 5;
const MAX_ANOMALY_SOURCE_LINES = 6;
const MAX_SYNC_TAIL_LINES = 60;

// Sequencer: note config per arrangement track (kick / snare / hat)
const SEQ_TRACK_CONFIG: Record<
  ArrangementTrack,
  { noteHz: number; waveform: OscillatorType; gainFactor: number; durationMs: number }
> = {
  foundation: { noteHz: 80,   waveform: "square",   gainFactor: 0.22, durationMs: 115 },
  motion:     { noteHz: 280,  waveform: "triangle",  gainFactor: 0.14, durationMs: 75  },
  accent:     { noteHz: 1800, waveform: "sine",      gainFactor: 0.08, durationMs: 40  },
};
const BACKGROUND_FADE_IN_SECONDS = 0.9;

type AudioEngineStatus = "idle" | "ready" | "unsupported" | "error";
type SampleEngineStatus = "unavailable" | "loading" | "ready" | "error";

interface BackgroundDeckState {
  source: AudioBufferSourceNode;
  gain: GainNode;
  trackId: string;
  trackIndex: number;
  startedAtContextTime: number;
  bufferDurationSec: number;
  durationSec: number;
  entrySecond: number;
  playbackRate: number;
  looping: boolean;
}

interface LiveLogMonitorPanelProps {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected live log monitor failure.";
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  return audioConstructor ? new audioConstructor() : null;
}

// ---------------------------------------------------------------------------
// WAV renderer is in wavRenderer.ts (imported above).
// ---------------------------------------------------------------------------

const activeBlobAudioElements = new Set<HTMLAudioElement>();

function setBlobAudioVolume(volume: number): void {
  const nextVolume = Math.max(0, Math.min(1, volume));
  activeBlobAudioElements.forEach((audio) => {
    audio.volume = nextVolume;
  });
}

function stopManagedBlobAudio(): void {
  activeBlobAudioElements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeBlobAudioElements.clear();
}

function playManagedWavBlob(blob: Blob, volume: number): void {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume));
  activeBlobAudioElements.add(audio);

  const cleanup = () => {
    activeBlobAudioElements.delete(audio);
    URL.revokeObjectURL(url);
  };

  audio.addEventListener("ended", cleanup, { once: true });
  audio.play()
    .catch((err) => {
      console.warn("[Maia Audio] WAV playback failed:", err);
      cleanup();
    });

  setTimeout(() => {
    if (activeBlobAudioElements.has(audio)) {
      activeBlobAudioElements.delete(audio);
      URL.revokeObjectURL(url);
    }
  }, 5000);
}

function resolveManagedAudioSource(audioPath: string | null): string | null {
  if (!audioPath) return null;
  
  // Allow browser fallback paths or remote URLs directly
  if (audioPath.startsWith("browser-fallback://") || audioPath.startsWith("http")) {
    return audioPath.replace("browser-fallback://", ""); // Strip prefix if needed
  }

  if (!isTauri()) {
    // In web mode, we can only resolve relative paths or URLs. 
    // If it's an absolute disk path, we can't resolve it unless it's served.
    return audioPath.startsWith("/") ? audioPath : `./${audioPath}`;
  }

  try {
    return convertFileSrc(audioPath);
  } catch {
    return null;
  }
}

function preferredBaseAssetId(
  availableBaseAssets: BaseAssetRecord[],
  preferredId?: string | null,
): string {
  if (preferredId && availableBaseAssets.some((entry) => entry.id === preferredId)) {
    return preferredId;
  }

  return availableBaseAssets.find((entry) => entry.reusable)?.id ?? availableBaseAssets[0]?.id ?? "";
}

function preferredCompositionId(
  availableCompositions: CompositionResultRecord[],
  preferredId?: string | null,
): string {
  if (preferredId && availableCompositions.some((entry) => entry.id === preferredId)) {
    return preferredId;
  }

  return "";
}

function scheduleCue(context: AudioContext, cue: RoutedLiveCue, startAt: number, destination: AudioNode): void {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const stereoPanner =
    typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;

  oscillator.type = cue.waveform;
  oscillator.frequency.setValueAtTime(cue.noteHz, startAt);
  if (cue.accent === "anomaly") {
    oscillator.detune.setValueAtTime(90, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startAt + Math.max(0.08, cue.durationMs / 1000),
  );

  oscillator.connect(gainNode);
  if (stereoPanner) {
    stereoPanner.pan.setValueAtTime(cue.pan, startAt);
    gainNode.connect(stereoPanner);
    stereoPanner.connect(destination);
  } else {
    gainNode.connect(destination);
  }

  oscillator.start(startAt);
  oscillator.stop(startAt + Math.max(0.1, cue.durationMs / 1000) + 0.04);
}

function scheduleSampleCue(
  context: AudioContext,
  cue: RoutedLiveCue,
  sampleBuffer: AudioBuffer,
  startAt: number,
  destination: AudioNode,
): void {
  const source = context.createBufferSource();
  const gainNode = context.createGain();
  const stereoPanner =
    typeof context.createStereoPanner === "function"
      ? context.createStereoPanner()
      : null;
  const routeOffsetRatio =
    cue.routeKey === "info"
      ? 0.08
      : cue.routeKey === "warn"
        ? 0.22
        : cue.routeKey === "error"
          ? 0.42
          : 0.64;
  const cueOffsetRatio = ((cue.eventIndex % 5) * 0.07) % 0.28;
  const offsetSeconds = Math.min(
    Math.max(0, sampleBuffer.duration - 0.04),
    sampleBuffer.duration * Math.min(0.88, routeOffsetRatio + cueOffsetRatio),
  );
  const durationSeconds = Math.min(
    Math.max(0.09, cue.durationMs / 1000),
    Math.max(0.09, sampleBuffer.duration - offsetSeconds),
  );
  const playbackRate = Math.max(0.55, Math.min(1.85, cue.noteHz / 261.63));

  source.buffer = sampleBuffer;
  source.playbackRate.setValueAtTime(playbackRate, startAt);
  if (cue.accent === "anomaly") {
    source.detune.setValueAtTime(120, startAt);
  }

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, cue.gain), startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

  source.connect(gainNode);
  if (stereoPanner) {
    stereoPanner.pan.setValueAtTime(cue.pan, startAt);
    gainNode.connect(stereoPanner);
    stereoPanner.connect(destination);
  } else {
    gainNode.connect(destination);
  }

  source.start(startAt, offsetSeconds, durationSeconds);
  source.stop(startAt + durationSeconds + 0.03);
}

function formatCursor(offset: number | undefined): string {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return "Tail seed";
  }

  return `${offset.toLocaleString()} B`;
}

function formatConfidence(confidence: number): string {
  if (!Number.isFinite(confidence) || confidence <= 0) {
    return "--";
  }

  return `${Math.round(confidence * 100)}%`;
}

function formatFrequency(noteHz: number): string {
  return `${Math.round(noteHz)} Hz`;
}

function resolveBackgroundTrackSecond(
  context: AudioContext | null,
  deck: BackgroundDeckState | null,
): number | null {
  if (!context || !deck) {
    return null;
  }

  const elapsedSeconds = Math.max(0, context.currentTime - deck.startedAtContextTime);
  const rawSecond = deck.entrySecond + elapsedSeconds * deck.playbackRate;

  if (deck.looping && deck.bufferDurationSec > 0) {
    return Number((rawSecond % deck.bufferDurationSec).toFixed(3));
  }

  return Number(Math.min(deck.bufferDurationSec, rawSecond).toFixed(3));
}

function levelCount(levelCounts: Record<string, number>, level: string): number {
  return levelCounts[level] ?? 0;
}

type ParsedLineTone = "error" | "warn" | "anomaly" | "info";

function resolveParsedLineTone(line: string, markers: LiveLogMarker[]): ParsedLineTone {
  const normalizedLine = line.trim().toLowerCase();
  const matchesMarker = markers.some((marker) => {
    const excerpt = marker.excerpt.trim().toLowerCase();
    return Boolean(excerpt) && (normalizedLine.includes(excerpt) || excerpt.includes(normalizedLine));
  });

  if (matchesMarker || /\banomaly|drift|spike|budget\b/i.test(line)) {
    return "anomaly";
  }
  if (/\berror|fatal|exception|panic|failed|refused|critical\b/i.test(line)) {
    return "error";
  }
  if (/\bwarn|warning|timeout|retry|latency|slow|throttle\b/i.test(line)) {
    return "warn";
  }
  return "info";
}

function parsedLineToneLabel(tone: ParsedLineTone): string {
  if (tone === "anomaly") {
    return "ANOM";
  }

  return tone.toUpperCase();
}

interface AnomalySourceRow {
  sourcePath: string;
  component: string;
  level: string;
  line: string;
  tone: ParsedLineTone;
}
interface SyncTailRow {
  id: string;
  windowId: string;
  sourcePath: string;
  component: string;
  level: string;
  line: string;
  tone: ParsedLineTone;
}

function resolveAnomalySourceRows(update: LiveLogStreamUpdate | null): AnomalySourceRow[] {
  if (!update) {
    return [];
  }

  const rows: AnomalySourceRow[] = [];
  const seen = new Set<string>();

  for (const marker of update.anomalyMarkers) {
    const line = marker.excerpt.trim();
    if (!line) {
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({
      sourcePath: update.sourcePath,
      component: marker.component || "stream",
      level: marker.level || "anomaly",
      line,
      tone: resolveParsedLineTone(line, update.anomalyMarkers),
    });
    if (rows.length >= MAX_ANOMALY_SOURCE_LINES) {
      return rows;
    }
  }

  for (const parsedLine of update.parsedLines) {
    const line = parsedLine.trim();
    if (!line) {
      continue;
    }
    const tone = resolveParsedLineTone(line, update.anomalyMarkers);
    if (tone === "info") {
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({
      sourcePath: update.sourcePath,
      component: "stream",
      level: tone,
      line,
      tone,
    });
    if (rows.length >= MAX_ANOMALY_SOURCE_LINES) {
      break;
    }
  }

  return rows;
}
function resolveTailComponent(line: string, markers: LiveLogMarker[]): string {
  const normalized = line.trim().toLowerCase();
  const marker = markers.find((entry) => {
    const excerpt = entry.excerpt.trim().toLowerCase();
    return Boolean(excerpt) && (normalized.includes(excerpt) || excerpt.includes(normalized));
  });

  return marker?.component || "stream";
}

// ---------------------------------------------------------------------------
// Beat clock — phase-accurate scheduling across poll windows
// ---------------------------------------------------------------------------

interface BeatClock {
  /** AudioContext time at session start — the phase anchor */
  originTime: number;
  /** BPM the clock was initialised with (anchor or live-detected) */
  bpm: number;
}

/**
 * Returns the next subdivision boundary after `contextNow + lookaheadS`.
 * subdivision=4 → quarter notes, 8 → eighth notes, 16 → sixteenth notes.
 */
function nextBeatTime(
  contextNow: number,
  originTime: number,
  bpm: number,
  subdivision: number,
  lookaheadS: number,
): number {
  const subdivPeriodS = 60 / bpm / Math.max(1, subdivision / 4);
  const elapsed = contextNow + lookaheadS - originTime;
  const nextCount = Math.max(0, Math.ceil(elapsed / subdivPeriodS));
  return originTime + nextCount * subdivPeriodS;
}

// ---------------------------------------------------------------------------
// Beat looper — background rhythm pulse for beat-locked preset
// ---------------------------------------------------------------------------

interface BeatLooperState {
  cancelled: boolean;
}

/**
 * Schedules a repeating low-level rhythm pulse at the given BPM using the
 * AudioContext clock + a lightweight setTimeout driver (100 ms lookahead).
 * Downbeats (every 4th pulse) use a lower pitch and higher gain than off-beats.
 * Only used when the beat-locked preset is active.
 */
function startBeatLooper(
  context: AudioContext,
  bpm: number,
  subdivision: number,
  stateRef: React.MutableRefObject<BeatLooperState | null>,
  destination: AudioNode,
): void {
  const state: BeatLooperState = { cancelled: false };
  stateRef.current = state;
  const periodMs = (60 / bpm / Math.max(1, subdivision / 4)) * 1000;
  const lookaheadS = 0.1;
  let step = 0;

  const tick = (): void => {
    if (state.cancelled) return;
    const now = context.currentTime;
    const at = now + lookaheadS;
    const isDownbeat = step % 4 === 0;
    const noteHz = isDownbeat ? 58 : 136;
    const peakGain = isDownbeat ? 0.058 : 0.026;
    const durS = isDownbeat ? 0.09 : 0.052;
    const osc = context.createOscillator();
    const gn = context.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(noteHz, at);
    gn.gain.setValueAtTime(0.0001, at);
    gn.gain.linearRampToValueAtTime(peakGain, at + 0.007);
    gn.gain.exponentialRampToValueAtTime(0.0001, at + durS);
    osc.connect(gn);
    gn.connect(destination);
    osc.start(at);
    osc.stop(at + durS + 0.02);
    step++;
    setTimeout(tick, periodMs);
  };

  tick();
}

function stopBeatLooper(
  stateRef: React.MutableRefObject<BeatLooperState | null>,
): void {
  if (stateRef.current) {
    stateRef.current.cancelled = true;
    stateRef.current = null;
  }
}

// ---------------------------------------------------------------------------
// Live waveform canvas — draws the real-time audio waveform from AnalyserNode
// ---------------------------------------------------------------------------

function LiveWaveformCanvas({
  analyserRef,
  active,
  accentColor = "#21b4b8",
}: {
  analyserRef: React.RefObject<AnalyserNode | null>;
  active: boolean;
  accentColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    const bufLen = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufLen);
    const freqData = new Uint8Array(bufLen);
    analyser.getByteTimeDomainData(timeData);
    analyser.getByteFrequencyData(freqData);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "rgba(0, 0, 0, 0.3)");
    bgGrad.addColorStop(1, "rgba(0, 0, 0, 0.05)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Frequency bars (background)
    const barCount = 64;
    const barWidth = width / barCount;
    const step = Math.floor(bufLen / barCount);
    for (let i = 0; i < barCount; i++) {
      const val = freqData[i * step] / 255;
      const barH = val * height * 0.8;
      const alpha = 0.15 + val * 0.3;
      ctx.fillStyle = `rgba(33, 180, 184, ${alpha})`;
      ctx.fillRect(i * barWidth + 1, height - barH, barWidth - 2, barH);
    }

    // Waveform line
    ctx.beginPath();
    ctx.lineWidth = 2;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, `${accentColor}88`);
    gradient.addColorStop(0.5, accentColor);
    gradient.addColorStop(1, `${accentColor}88`);
    ctx.strokeStyle = gradient;

    const sliceWidth = width / bufLen;
    let x = 0;
    for (let i = 0; i < bufLen; i++) {
      const v = timeData[i] / 128;
      const y = (v * height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = "rgba(244, 242, 233, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [active, accentColor, analyserRef]);

  useEffect(() => {
    if (active) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [active, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="live-waveform-canvas"
      style={{
        width: "100%",
        height: "128px",
        borderRadius: "14px",
        display: "block",
      }}
    />
  );
}

function statusLabel(liveEnabled: boolean, replayActive: boolean): string {
  if (replayActive) {
    return "Replay";
  }
  return liveEnabled ? "Live" : "Stopped";
}

function audioLabel(status: AudioEngineStatus, liveEnabled: boolean): string {
  if (status === "unsupported") {
    return "Unavailable";
  }
  if (status === "error") {
    return "Error";
  }
  if (liveEnabled && status === "ready") {
    return "Active";
  }
  if (status === "ready") {
    return "Armed";
  }
  return "Idle";
}

export function LiveLogMonitorPanel({
  repository,
  availableBaseAssets,
  availableCompositions,
  preferredBaseAssetId: preferredBaseAssetIdProp,
  preferredCompositionId: preferredCompositionIdProp,
  availableTracks,
  availablePlaylists,
}: LiveLogMonitorPanelProps) {
  const monitor = useMonitor();
  // Session is live for THIS repo when the global monitor owns it
  const liveEnabled = monitor.session?.repoId === repository.id;
  const replayActive = liveEnabled && monitor.isPlayback;
  const playbackPercent =
    typeof monitor.playbackProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(monitor.playbackProgress * 100)))
      : null;
  const playbackWindowLabel =
    replayActive &&
    monitor.playbackEventIndex !== null &&
    monitor.playbackEventCount !== null
      ? `${monitor.playbackEventIndex}/${monitor.playbackEventCount}`
      : null;

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const backgroundGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sampleBuffersRef = useRef(new Map<string, AudioBuffer>());
  const [masterVolume, setMasterVolume] = useState(
    () => loadMonitorPrefs(repository.id)?.masterVolume ?? 0.45,
  );
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [processCommand, setProcessCommand] = useState("");
  const [wsUrl, setWsUrl] = useState("ws://");
  const [httpUrl, setHttpUrl] = useState("http://");
  const [journaldUnit, setJournaldUnit] = useState("");
  const [selectedStyleProfileId, setSelectedStyleProfileId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedStyleProfileId ?? DEFAULT_STYLE_PROFILE_ID,
  );
  const [selectedMutationProfileId, setSelectedMutationProfileId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedMutationProfileId ?? DEFAULT_MUTATION_PROFILE_ID,
  );
  const [basePlaylist, setBasePlaylist] = useState<BaseTrackPlaylist | null>(
    () => loadMonitorPrefs(repository.id)?.basePlaylist ?? createBasePlaylist([]),
  );
  const [pendingAddTrackId, setPendingAddTrackId] = useState("");
  const [pendingLoadPlaylistId, setPendingLoadPlaylistId] = useState("");
  const beatClockRef = useRef<BeatClock | null>(null);
  const beatLooperRef = useRef<BeatLooperState | null>(null);
  const backgroundDeckRef = useRef<BackgroundDeckState | null>(null);
  const backgroundTransitionTimerRef = useRef<number | null>(null);
  const backgroundBufferCacheRef = useRef(new Map<string, Promise<AudioBuffer>>());
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const [beatClockBpm, setBeatClockBpm] = useState<number | null>(null);
  // Bounce buffer: accumulates voiced cues per poll window (not state — no re-render)
  const bounceCuesRef = useRef<RoutedLiveCue[][]>([]);
  const [bounceWindowCount, setBounceWindowCount] = useState(0);
  const [beatLooperActive, setBeatLooperActive] = useState(false);
  const [backgroundNowPlayingId, setBackgroundNowPlayingId] = useState<string | null>(null);
  const [backgroundTransitionPlan, setBackgroundTransitionPlan] =
    useState<PlaylistTransitionPlan | null>(null);
  const knownComponentsRef = useRef<string[]>([]);
  const [knownComponents, setKnownComponents] = useState<string[]>([]);
  const [componentOverrides, setComponentOverrides] = useState<Map<string, ComponentOverride>>(
    () => new Map(),
  );
  const [sceneBaseAssetId, setSceneBaseAssetId] = useState(() =>
    preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp),
  );
  const [sceneCompositionId, setSceneCompositionId] = useState(() =>
    preferredCompositionId(availableCompositions, preferredCompositionIdProp),
  );
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>("idle");
  const [sampleStatus, setSampleStatus] = useState<SampleEngineStatus>("unavailable");
  const [lastUpdate, setLastUpdate] = useState<LiveLogStreamUpdate | null>(null);
  const [emittedCueCount, setEmittedCueCount] = useState(0);
  const [emittedVoiceCount, setEmittedVoiceCount] = useState(0);
  const [recentCues, setRecentCues] = useState<RoutedLiveCue[]>([]);
  const [recentVoices, setRecentVoices] = useState<ArrangementVoice[]>([]);
  const [recentMarkers, setRecentMarkers] = useState<LiveLogMarker[]>([]);
  const [recentExplanations, setRecentExplanations] = useState<
    LiveMutationExplanation[]
  >([]);
  const [selectedExplanationId, setSelectedExplanationId] = useState<string | null>(null);
  const [backgroundPlayheadSecond, setBackgroundPlayheadSecond] = useState<number>(0);
  const [recentWarnings, setRecentWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [syncTailRows, setSyncTailRows] = useState<SyncTailRow[]>([]);
  const [activeTailWindowId, setActiveTailWindowId] = useState<string | null>(null);
  const syncTailListRef = useRef<HTMLDivElement | null>(null);
  const previousAudibleVolumeRef = useRef(masterVolume > 0 ? masterVolume : 0.45);
  const selectedSceneBaseAsset =
    availableBaseAssets.find((entry) => entry.id === sceneBaseAssetId) ?? null;
  const selectedSceneComposition =
    availableCompositions.find((entry) => entry.id === sceneCompositionId) ?? null;
  const selectedStyleProfile = resolveStyleProfile(selectedStyleProfileId);
  const selectedMutationProfile = resolveMutationProfile(selectedMutationProfileId);
  const playableBaseTracks = resolvePlaylistTracks(basePlaylist, availableTracks).filter((track) =>
    Boolean(resolvePlayableTrackPath(track)),
  );
  const playableBaseTrackIdsKey = playableBaseTracks.map((track) => track.id).join("|");
  const backgroundNowPlayingTrack =
    backgroundNowPlayingId
      ? availableTracks.find((track) => track.id === backgroundNowPlayingId) ?? null
      : null;
  const backgroundTransitionNextTrack =
    backgroundTransitionPlan?.nextTrackId
      ? availableTracks.find((track) => track.id === backgroundTransitionPlan.nextTrackId) ?? null
      : null;
  const traceWaveformTrack = backgroundNowPlayingTrack ?? playableBaseTracks[0] ?? null;
  const traceWaveformExplanations = traceWaveformTrack
    ? recentExplanations.filter(
        (explanation) =>
          explanation.trackId === traceWaveformTrack.id &&
          typeof explanation.trackSecond === "number",
      )
    : [];
  const selectedTraceExplanation =
    traceWaveformExplanations.find((explanation) => explanation.id === selectedExplanationId) ??
    null;
  const traceWaveformCues = toLiveMutationVisualizationCues(traceWaveformExplanations);
  const replaySessionId = replayActive ? monitor.session?.persistedSessionId ?? null : null;
  const currentReplayExplanation =
    replayActive && monitor.playbackEventIndex !== null
      ? (selectedTraceExplanation?.replayWindowIndex === monitor.playbackEventIndex
          ? selectedTraceExplanation
          : recentExplanations.find(
              (explanation) => explanation.replayWindowIndex === monitor.playbackEventIndex,
            )) ?? null
      : null;
  const {
    sortedSessionBookmarks,
    activeReplayBookmark,
    bookmarkLabelDraft,
    setBookmarkLabelDraft,
    bookmarkNoteDraft,
    setBookmarkNoteDraft,
    bookmarkTagDraft,
    setBookmarkTagDraft,
    bookmarkStyleProfileIdDraft,
    setBookmarkStyleProfileIdDraft,
    bookmarkMutationProfileIdDraft,
    setBookmarkMutationProfileIdDraft,
    bookmarkBusy,
    bookmarkError,
    captureCurrentScene,
    saveReplayBookmark,
    deleteReplayBookmark,
  } = useReplayBookmarks({
    replaySessionId,
    replayActive,
    replayWindowIndex: monitor.playbackEventIndex,
    selectedStyleProfileId,
    selectedMutationProfileId,
    currentReplayExplanation: currentReplayExplanation
      ? {
          eventIndex: currentReplayExplanation.eventIndex,
          trackId: currentReplayExplanation.trackId,
          trackTitle: currentReplayExplanation.trackTitle,
          trackSecond: currentReplayExplanation.trackSecond,
        }
      : null,
    fallbackTrackId: traceWaveformTrack?.id ?? null,
    fallbackTrackTitle: traceWaveformTrack ? getTrackTitle(traceWaveformTrack) : null,
    fallbackTrackSecond:
      typeof backgroundPlayheadSecond === "number" ? backgroundPlayheadSecond : null,
  });
  const replayFeedbackRecommendation = useReplayFeedbackRecommendation(sortedSessionBookmarks, {
    currentStyleProfileId: selectedStyleProfileId,
    currentMutationProfileId: selectedMutationProfileId,
  });
  const playlistAnchors = (basePlaylist?.trackIds ?? [])
    .map((id) => availableTracks.find((t) => t.id === id))
    .filter((t): t is LibraryTrack => t !== undefined)
    .map(deriveReferenceAnchor);
  const referenceAnchor =
    playlistAnchors.length > 0 ? blendAnchors(playlistAnchors) : null;
  const scene = resolveLiveSonificationScene(
    selectedSceneBaseAsset,
    selectedSceneComposition,
    selectedStyleProfileId,
    selectedMutationProfileId,
    referenceAnchor,
  );
  const baseTrackCount = basePlaylist?.trackIds.length ?? 0;
  const hasBaseListeningBed = baseTrackCount > 0;
  const trimmedProcessCommand = processCommand.trim();
  const trimmedWsUrl = wsUrl.trim();
  const trimmedHttpUrl = httpUrl.trim();
  const trimmedJournaldUnit = journaldUnit.trim();
  const adapterConfigured =
    adapterKind === "process"
      ? trimmedProcessCommand.length > 0
      : adapterKind === "websocket"
        ? trimmedWsUrl.length > 0 && trimmedWsUrl !== "ws://"
        : adapterKind === "http-poll"
          ? trimmedHttpUrl.length > 0 && trimmedHttpUrl !== "http://"
          : true;
  const activeAdapterKind = monitor.session?.repoId === repository.id
    ? monitor.session?.adapterKind ?? adapterKind
    : adapterKind;
  const activeAdapterLabel = getStreamAdapterLabel(activeAdapterKind);
  const adapterDescription = getStreamAdapterDescription(adapterKind);
  const adapterTarget =
    adapterKind === "process"
      ? trimmedProcessCommand || "Command not configured yet."
      : adapterKind === "websocket"
        ? trimmedWsUrl || "WebSocket URL required."
        : adapterKind === "http-poll"
          ? trimmedHttpUrl || "HTTP URL required."
          : adapterKind === "journald"
            ? trimmedJournaldUnit
              ? `Unit filter: ${trimmedJournaldUnit}`
              : "Following all local systemd units."
            : repository.sourcePath;
  const cueEnginePreviewLabel =
    hasBaseListeningBed
      ? sampleStatus === "ready"
        ? "Guide-track modulation + samples"
        : "Guide-track modulation"
      : sampleStatus === "ready"
        ? scene.sampleSourceCount > 1
          ? "Base sample pack"
          : "Base sample"
        : sampleStatus === "loading"
          ? "Loading sample"
          : "Internal synth";

  useEffect(() => {
    if (
      sceneBaseAssetId &&
      availableBaseAssets.some((entry) => entry.id === sceneBaseAssetId)
    ) {
      return;
    }

    setSceneBaseAssetId(preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp));
  }, [availableBaseAssets, preferredBaseAssetIdProp, sceneBaseAssetId]);

  useEffect(() => {
    if (
      sceneCompositionId &&
      availableCompositions.some((entry) => entry.id === sceneCompositionId)
    ) {
      return;
    }

    setSceneCompositionId(
      preferredCompositionId(availableCompositions, preferredCompositionIdProp),
    );
  }, [availableCompositions, preferredCompositionIdProp, sceneCompositionId]);

  // Close AudioContext on unmount — the background poll loop lives in MonitorContext
  useEffect(() => {
    return () => {
      stopManagedBlobAudio();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (replayActive) {
      stopManagedBlobAudio();
    }
  }, [replayActive]);

  useEffect(() => {
    const sampleSources = scene.sampleSources;
    const resolvableSampleSources = sampleSources
      .map((source) => ({
        ...source,
        url: resolveManagedAudioSource(source.path),
      }))
      .filter(
        (
          source,
        ): source is { path: string; label: string; url: string } => Boolean(source.url),
      );

    sampleBuffersRef.current = new Map();

    if (resolvableSampleSources.length === 0) {
      setSampleStatus("unavailable");
      return;
    }

    let cancelled = false;

    async function loadSampleBuffer() {
      setSampleStatus("loading");

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = createAudioContext();
        }

        if (!audioContextRef.current) {
          setSampleStatus("unavailable");
          return;
        }

        const decodedEntries = await Promise.all(
          resolvableSampleSources.map(async (source) => {
            const response = await fetch(source.url);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch managed sample ${source.label} (${response.status}).`,
              );
            }

            const encodedAudio = await response.arrayBuffer();
            const decoded = await audioContextRef.current!.decodeAudioData(
              encodedAudio.slice(0),
            );

            return [source.path, decoded] as const;
          }),
        );
        if (cancelled) {
          return;
        }

        sampleBuffersRef.current = new Map(decodedEntries);
        setSampleStatus("ready");
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        sampleBuffersRef.current = new Map();
        setSampleStatus("error");
        setRecentWarnings((current) => [
          `Base sample routing failed: ${toMessage(nextError)}`,
          ...current,
        ].slice(0, MAX_RECENT_WARNINGS));
      }
    }

    void loadSampleBuffer();

    return () => {
      cancelled = true;
    };
  }, [scene.sampleSources]);

  // Reset local display state when switching repos; the background monitor keeps running
  useEffect(() => {
    setLastUpdate(null);
    setEmittedCueCount(0);
    setEmittedVoiceCount(0);
    setRecentCues([]);
    setRecentVoices([]);
    setRecentMarkers([]);
    setRecentExplanations([]);
    setSelectedExplanationId(null);
    setBackgroundPlayheadSecond(0);
    setRecentWarnings([]);
    setSyncTailRows([]);
    setActiveTailWindowId(null);
    setError(null);
    knownComponentsRef.current = [];
    setKnownComponents([]);
    setComponentOverrides(new Map());
    setSceneBaseAssetId(preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp));
    setSceneCompositionId(
      preferredCompositionId(availableCompositions, preferredCompositionIdProp),
    );
    const nextPrefs = loadMonitorPrefs(repository.id);
    setBasePlaylist(nextPrefs?.basePlaylist ?? createBasePlaylist([]));
    setSelectedStyleProfileId(
      nextPrefs?.selectedStyleProfileId ?? DEFAULT_STYLE_PROFILE_ID,
    );
    setSelectedMutationProfileId(
      nextPrefs?.selectedMutationProfileId ?? DEFAULT_MUTATION_PROFILE_ID,
    );
    setMasterVolume(nextPrefs?.masterVolume ?? 0.45);
    setPendingAddTrackId("");
    setPendingLoadPlaylistId("");
    beatClockRef.current = null;
    setBeatClockBpm(null);
    setBackgroundNowPlayingId(null);
    setBackgroundTransitionPlan(null);
    stopBeatLooper(beatLooperRef);
    setBeatLooperActive(false);
  }, [repository.id]);

  useEffect(() => {
    saveMonitorPrefs(repository.id, {
      basePlaylist,
      selectedStyleProfileId,
      selectedMutationProfileId,
      masterVolume,
    });
  }, [repository.id, basePlaylist, selectedStyleProfileId, selectedMutationProfileId, masterVolume]);

  // Keep master gain in sync with the volume slider
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        masterVolume,
        audioContextRef.current?.currentTime ?? 0,
      );
    }
    setBlobAudioVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    const el = syncTailListRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [syncTailRows.length]);

  useEffect(() => {
    if (masterVolume > 0.001) {
      previousAudibleVolumeRef.current = masterVolume;
    }
  }, [masterVolume]);

  useEffect(() => {
    const context = audioContextRef.current;
    if (!context) {
      return;
    }

    if (backgroundGainRef.current) {
      backgroundGainRef.current.gain.setValueAtTime(
        selectedStyleProfile.backgroundGain,
        context.currentTime,
      );
    }

    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.setValueAtTime(
        selectedStyleProfile.filterCeilingHz,
        context.currentTime,
      );
    }
  }, [selectedStyleProfile.backgroundGain, selectedStyleProfile.filterCeilingHz]);

  const ensureAudioReady = useEffectEvent(async (): Promise<AudioContext | null> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext();
      }

      const ctx = audioContextRef.current;
      if (!ctx) {
        setAudioStatus("unsupported");
        return null;
      }

      if (ctx.state === "suspended") {
        log.info("Resuming AudioContext from suspended state...");
        await ctx.resume();
      }
      
      if (ctx.state === "running") {
        setAudioStatus("ready");
      }
      
      return ctx;
    } catch (err) {
      log.error("Failed to ensure audio ready", err);
      setAudioStatus("error");
      return null;
    }
  });

  useEffect(() => {
    const initAudio = async () => {
      const ctx = await ensureAudioReady();
      if (!ctx) return;

      // Create master gain node once, routed: everything → masterGain → analyser → destination
      if (!masterGainRef.current) {
        const gain = ctx.createGain();
        gain.gain.value = masterVolume;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;

        gain.connect(analyser);
        analyser.connect(ctx.destination);
        masterGainRef.current = gain;
      }
    };

    if (liveEnabled || replayActive) {
      void initAudio();
    }
  }, [liveEnabled, replayActive, ensureAudioReady, masterVolume]);

  const getAudioContext = useCallback(() => audioContextRef.current, []);


  const clearBackgroundTransition = useCallback(() => {
    if (backgroundTransitionTimerRef.current !== null) {
      window.clearTimeout(backgroundTransitionTimerRef.current);
      backgroundTransitionTimerRef.current = null;
    }
  }, []);

  const stopBackgroundDeck = useEffectEvent((fadeOutSeconds = 0.18) => {
    clearBackgroundTransition();

    const context = audioContextRef.current;
    const deck = backgroundDeckRef.current;
    if (!context || !deck) {
      backgroundDeckRef.current = null;
      setBackgroundNowPlayingId(null);
      setBackgroundTransitionPlan(null);
      return;
    }

    const now = context.currentTime;
    deck.gain.gain.cancelScheduledValues(now);
    deck.gain.gain.setValueAtTime(Math.max(0.0001, deck.gain.gain.value), now);
    deck.gain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSeconds);
    try {
      deck.source.stop(now + fadeOutSeconds + 0.06);
    } catch {
      // ignore stop races
    }

    backgroundDeckRef.current = null;
    setBackgroundNowPlayingId(null);
    setBackgroundTransitionPlan(null);
  });

  const ensureBackgroundBus = useEffectEvent((context: AudioContext) => {
    let createdFilter = false;
    let createdGain = false;

    if (!filterNodeRef.current) {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(
        selectedStyleProfile.filterCeilingHz,
        context.currentTime,
      );
      filterNodeRef.current = filter;
      createdFilter = true;
    }

    if (!backgroundGainRef.current) {
      const backgroundGain = context.createGain();
      backgroundGain.gain.setValueAtTime(
        selectedStyleProfile.backgroundGain,
        context.currentTime,
      );
      backgroundGain.connect(masterGainRef.current ?? context.destination);
      backgroundGainRef.current = backgroundGain;
      createdGain = true;
    }

    if ((createdFilter || createdGain) && filterNodeRef.current && backgroundGainRef.current) {
      filterNodeRef.current.connect(backgroundGainRef.current);
    }
  });

  const loadBackgroundBuffer = useEffectEvent(
    async (context: AudioContext, track: LibraryTrack): Promise<AudioBuffer | null> => {
      const audioPath = resolvePlayableTrackPath(track);
      if (!audioPath) {
        return null;
      }

      const url = isTauri() ? convertFileSrc(audioPath) : null;
      if (!url) {
        return null;
      }

      let cached = backgroundBufferCacheRef.current.get(audioPath);
      if (!cached) {
        cached = (async () => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} fetching guide track`);
          }
          const arrayBuffer = await response.arrayBuffer();
          return context.decodeAudioData(arrayBuffer);
        })();
        backgroundBufferCacheRef.current.set(audioPath, cached);
      }

      try {
        return await cached;
      } catch (error) {
        backgroundBufferCacheRef.current.delete(audioPath);
        throw error;
      }
    },
  );

  const scheduleBackgroundTransition = useEffectEvent(
    (context: AudioContext, deck: BackgroundDeckState) => {
      clearBackgroundTransition();

      if (playableBaseTracks.length <= 1) {
        setBackgroundTransitionPlan(null);
        return;
      }

      const currentTrack = playableBaseTracks[deck.trackIndex] ?? null;
      const nextIndex = resolveNextPlaylistIndex(
        deck.trackIndex,
        playableBaseTracks.length,
      );
      if (!currentTrack || nextIndex === null) {
        setBackgroundTransitionPlan(null);
        return;
      }

      const nextTrack = playableBaseTracks[nextIndex] ?? null;
      if (!nextTrack) {
        setBackgroundTransitionPlan(null);
        return;
      }

      const transitionPlan = resolvePlaylistTransitionPlan(currentTrack, nextTrack, {
        styleProfile: {
          playlistCrossfadeSeconds: selectedStyleProfile.playlistCrossfadeSeconds,
          transitionFeel: selectedStyleProfile.transitionFeel,
        },
        mutationProfile: {
          transitionTightness: selectedMutationProfile.transitionTightness,
        },
      });
      setBackgroundTransitionPlan(transitionPlan);

      const delayMs = resolvePhraseAlignedTransitionDelayMs({
        track: currentTrack,
        entrySecond: deck.entrySecond,
        playbackRate: deck.playbackRate,
        crossfadeSeconds: transitionPlan.crossfadeSeconds,
        phraseSpanBeats: transitionPlan.phraseSpanBeats,
        fallbackDurationSeconds: deck.durationSec,
      });

      backgroundTransitionTimerRef.current = window.setTimeout(() => {
        void startBackgroundDeck(context, nextIndex, transitionPlan);
      }, delayMs);
    },
  );

  const startBackgroundDeck = useEffectEvent(
    async (
      context: AudioContext,
      trackIndex: number,
      transitionPlan?: PlaylistTransitionPlan | null,
    ) => {
      const track = playableBaseTracks[trackIndex] ?? null;
      if (!track) {
        return;
      }

      try {
        ensureBackgroundBus(context);
        const filter = filterNodeRef.current;
        if (!filter) {
          return;
        }

        const buffer = await loadBackgroundBuffer(context, track);
        if (!buffer) {
          return;
        }

        const previousDeck = backgroundDeckRef.current;
        const startAt = context.currentTime + 0.02;
        const nextTransitionPlan =
          transitionPlan ??
          (playableBaseTracks.length > 1
            ? resolvePlaylistStartPlan(track, {
                styleProfile: {
                  playlistCrossfadeSeconds: selectedStyleProfile.playlistCrossfadeSeconds,
                  transitionFeel: selectedStyleProfile.transitionFeel,
                },
              })
            : resolvePlaylistStartPlan(track, {
                styleProfile: {
                  playlistCrossfadeSeconds: BACKGROUND_FADE_IN_SECONDS,
                  transitionFeel: "steady",
                },
              }));
        const fadeSeconds =
          playableBaseTracks.length > 1
            ? Math.max(0.4, nextTransitionPlan.crossfadeSeconds)
            : BACKGROUND_FADE_IN_SECONDS;
        const targetGain = selectedStyleProfile.backgroundGain;
        const entrySecond =
          playableBaseTracks.length > 1
            ? Math.min(
                nextTransitionPlan.entrySecond,
                Math.max(0, buffer.duration - 0.25),
              )
            : 0;
        const playbackRate =
          playableBaseTracks.length > 1
            ? nextTransitionPlan.tempoRatio
            : 1;

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = playableBaseTracks.length === 1;
        source.playbackRate.setValueAtTime(playbackRate, startAt);

        const trackGain = context.createGain();
        trackGain.gain.setValueAtTime(0.0001, startAt);

        source.connect(trackGain);
        trackGain.connect(filter);
        source.start(startAt, entrySecond);
        trackGain.gain.linearRampToValueAtTime(targetGain, startAt + fadeSeconds);

        if (previousDeck) {
          previousDeck.gain.gain.cancelScheduledValues(startAt);
          previousDeck.gain.gain.setValueAtTime(
            Math.max(0.0001, previousDeck.gain.gain.value),
            startAt,
          );
          previousDeck.gain.gain.linearRampToValueAtTime(
            0.0001,
            startAt + fadeSeconds,
          );
          try {
            previousDeck.source.stop(startAt + fadeSeconds + 0.08);
          } catch {
            // ignore stop races
          }
        }

        const nextDeck: BackgroundDeckState = {
          source,
          gain: trackGain,
          trackId: track.id,
          trackIndex,
          startedAtContextTime: startAt,
          bufferDurationSec: buffer.duration,
          durationSec: Math.max(0.25, (buffer.duration - entrySecond) / playbackRate),
          entrySecond,
          playbackRate,
          looping: playableBaseTracks.length === 1,
        };

        backgroundDeckRef.current = nextDeck;
        setBackgroundNowPlayingId(track.id);
        setBackgroundTransitionPlan(
          transitionPlan && transitionPlan.nextTrackId === track.id ? transitionPlan : null,
        );
        setBackgroundPlayheadSecond(entrySecond);
        scheduleBackgroundTransition(context, nextDeck);
      } catch (err) {
        setRecentWarnings((current) => [
          `Failed to start guide track: ${toMessage(err)}`,
          ...current,
        ].slice(0, MAX_RECENT_WARNINGS));
      }
    },
  );

  const ensureBackgroundAudio = useEffectEvent(async (context: AudioContext) => {
    if (backgroundDeckRef.current || playableBaseTracks.length === 0) {
      return;
    }
    await startBackgroundDeck(context, 0);
  });

  useEffect(() => {
    if (!liveEnabled) {
      return;
    }

    const context = audioContextRef.current;
    if (!context || context.state !== "running") {
      return;
    }

    const currentDeck = backgroundDeckRef.current;
    if (playableBaseTracks.length === 0) {
      stopBackgroundDeck();
      return;
    }

    if (playableBaseTracks.length === 1) {
      const onlyTrack = playableBaseTracks[0];
      if (
        !currentDeck ||
        currentDeck.trackId !== onlyTrack.id ||
        currentDeck.source.loop !== true
      ) {
        stopBackgroundDeck(0.1);
        void startBackgroundDeck(context, 0);
      } else {
        setBackgroundNowPlayingId(onlyTrack.id);
        setBackgroundTransitionPlan(null);
      }
      return;
    }

    if (!currentDeck) {
      void startBackgroundDeck(context, 0);
      return;
    }

    const currentIndex = playableBaseTracks.findIndex(
      (track) => track.id === currentDeck.trackId,
    );
    if (currentIndex === -1) {
      stopBackgroundDeck(0.1);
      void startBackgroundDeck(context, 0);
      return;
    }

    const syncedDeck = { ...currentDeck, trackIndex: currentIndex };
    backgroundDeckRef.current = syncedDeck;
    setBackgroundNowPlayingId(currentDeck.trackId);
    scheduleBackgroundTransition(context, syncedDeck);
  }, [
    liveEnabled,
    playableBaseTrackIdsKey,
    scheduleBackgroundTransition,
    startBackgroundDeck,
    stopBackgroundDeck,
  ]);

  const applyLogModulation = useEffectEvent((update: LiveLogStreamUpdate) => {
    const context = audioContextRef.current;
    const filter = filterNodeRef.current;
    const backgroundGain = backgroundGainRef.current;
    if (!context || !filter) return;

    const hasCritical = update.anomalyCount > 0 || (update.levelCounts["ERROR"] ?? 0) > 0;
    const targetFloorHz = Math.max(
      220,
      selectedStyleProfile.filterBaseHz / Math.max(1, selectedMutationProfile.filterSweepMultiplier),
    );
    const duckedGain = Math.max(
      0.12,
      selectedStyleProfile.backgroundGain - selectedMutationProfile.backgroundDucking,
    );
    if (hasCritical) {
      filter.frequency.exponentialRampToValueAtTime(targetFloorHz, context.currentTime + 0.1);
      filter.frequency.exponentialRampToValueAtTime(
        selectedStyleProfile.filterCeilingHz,
        context.currentTime + 1.2,
      );
      if (backgroundGain) {
        backgroundGain.gain.cancelScheduledValues(context.currentTime);
        backgroundGain.gain.setValueAtTime(backgroundGain.gain.value, context.currentTime);
        backgroundGain.gain.linearRampToValueAtTime(duckedGain, context.currentTime + 0.08);
        backgroundGain.gain.linearRampToValueAtTime(
          selectedStyleProfile.backgroundGain,
          context.currentTime + 1.15,
        );
      }
    }
  });

  const playWithCurrentEngine = useEffectEvent((cues: RoutedLiveCue[], liveBpm?: number | null) => {
    log.info("playWithCurrentEngine cues=%d bpm=%s vol=%s", cues.length, liveBpm, masterVolume);
    if (cues.length === 0) { log.debug("playWithCurrentEngine — skipped (0 cues)"); return; }

    const preferGuideTrackMutation = playableBaseTracks.length > 0;

    const preset = scene.preset;
    const cappedCues = cues.slice(0, preset.maxCuesPerWindow);

    // Expand each cue into arrangement voices
    const voices = resolveArrangementVoices(
      cappedCues,
      scene.mutationProfile.arrangementDepth,
    );
    const voicedCues: RoutedLiveCue[] = voices.map((voice) => ({
      ...voice.cue,
      noteHz: Number((voice.cue.noteHz * voice.noteMultiplier).toFixed(2)),
      gain: Number(Math.min(0.34, Math.max(0.005, voice.cue.gain * voice.gainMultiplier)).toFixed(3)),
      pan: clampPan(voice.cue.pan + voice.panOffset),
    }));

    const audibleVoiceEntries = voices
      .map((voice, index) => {
        const voicedCue = voicedCues[index];
        if (!voicedCue) {
          return null;
        }

        if (preferGuideTrackMutation && voicedCue.routeKey === "info" && voicedCue.accent !== "anomaly") {
          return null;
        }

        return {
          voice,
          voicedCue: preferGuideTrackMutation
            ? {
                ...voicedCue,
                noteHz: Number((voicedCue.noteHz * 0.5).toFixed(2)),
                gain: Number(Math.min(0.08, Math.max(0.004, voicedCue.gain * 0.2)).toFixed(3)),
                waveform: voicedCue.accent === "anomaly" ? "triangle" : voicedCue.waveform,
              }
            : voicedCue,
        };
      })
      .filter((entry): entry is { voice: ArrangementVoice; voicedCue: RoutedLiveCue } => entry !== null);
    const audibleVoicedCues = audibleVoiceEntries.map((entry) => entry.voicedCue);

    // When a guide/base track is armed, keep the cue layer restrained so the
    // listener hears the source track being modulated instead of a second synth track.
    if (audibleVoicedCues.length > 0) {
      const wavBlob = renderCuesToWav(audibleVoicedCues, 1);
      if (wavBlob) {
        log.info(
          "WAV blob rendered size=%d voices=%d audibleVoices=%d — playing",
          wavBlob.size,
          voicedCues.length,
          audibleVoicedCues.length,
        );
        playManagedWavBlob(
          wavBlob,
          preferGuideTrackMutation ? Math.min(0.22, masterVolume * 0.5) : masterVolume,
        );
      } else {
        log.warn("renderCuesToWav returned null for %d audible cues", audibleVoicedCues.length);
      }
    }

    // ── Accumulate voiced cues for full mix bounce ──
    if (voicedCues.length > 0) {
      bounceCuesRef.current = [
        ...bounceCuesRef.current,
        voicedCues,
      ].slice(-MAX_BOUNCE_WINDOWS);
      setBounceWindowCount(bounceCuesRef.current.length);
    }

    // ── Feed AnalyserNode for waveform visualization ──
    // Schedule oscillators through the Web Audio graph so the AnalyserNode
    // picks up the signal for the live waveform canvas.
    const context = audioContextRef.current;
    if (context && context.state === "running" && masterGainRef.current) {
      const dest = masterGainRef.current;
      const clock = beatClockRef.current;
      const activeBpm =
        clock?.bpm ??
        (typeof liveBpm === "number" && liveBpm > 0 ? liveBpm : null);
      const useBeat = preset.useBeatGrid && activeBpm !== null && clock !== null;
      const firstCueAt = useBeat
        ? nextBeatTime(context.currentTime, clock!.originTime, activeBpm!, preset.rhythmDivision, 0.04)
        : context.currentTime + 0.04;
      const gapSeconds = useBeat
        ? 60 / activeBpm! / Math.max(1, preset.rhythmDivision / 4)
        : preset.scheduleGapMs / 1000;

      for (const entry of audibleVoiceEntries) {
        const voice = entry.voice;
        const cuePriority = cappedCues.indexOf(voice.cue);
        const cueStartAt = firstCueAt + cuePriority * gapSeconds + voice.timeOffsetMs / 1000;
        const voicedCue = entry.voicedCue;
        const sampleBuffer =
          sampleStatus === "ready" && voice.cue.samplePath && voice.track === "foundation"
            ? sampleBuffersRef.current.get(voice.cue.samplePath) ?? null
            : null;
        if (sampleBuffer) {
          scheduleSampleCue(context, voicedCue, sampleBuffer, cueStartAt, dest);
        } else {
          scheduleCue(context, voicedCue, cueStartAt, dest);
        }
      }
    } else if (context?.state === "suspended") {
      void context.resume();
    }

    setEmittedVoiceCount((c) => c + voicedCues.length);
  });

  // ---------------------------------------------------------------------------
  // Stream update handler — receives poll windows from MonitorContext
  // ---------------------------------------------------------------------------

  const onStreamUpdate = useEffectEvent((update: LiveLogStreamUpdate) => {
    log.trace("onStreamUpdate hasData=%s lines=%d cues=%d sessionRepo=%s panelRepo=%s", update.hasData, update.lineCount, update.sonificationCues.length, monitor.session?.repoId, repository.id);
    // Only process updates for the repo this panel is showing
    if (monitor.session?.repoId !== repository.id) {
      log.debug("onStreamUpdate — skipped (repo mismatch session=%s vs panel=%s)", monitor.session?.repoId, repository.id);
      return;
    }

    // Accumulate known components for per-component stereo routing
    const updatedComponents = [...knownComponentsRef.current];
    let componentsChanged = false;
    for (const cmp of update.topComponents.map((c) => c.component)) {
      if (!updatedComponents.includes(cmp)) {
        updatedComponents.push(cmp);
        componentsChanged = true;
      }
    }
    knownComponentsRef.current = updatedComponents.slice(0, 12);
    if (componentsChanged) {
      setKnownComponents(knownComponentsRef.current.slice());
    }

    const routedCues = update.sonificationCues.map((cue, index) =>
      routeCueThroughScene(cue, scene, index, knownComponentsRef.current, componentOverrides),
    );
    const currentDeck = backgroundDeckRef.current;
    const currentTrackSecond = resolveBackgroundTrackSecond(audioContextRef.current, currentDeck);
    const currentTrack =
      currentDeck
        ? availableTracks.find((track) => track.id === currentDeck.trackId) ?? null
        : null;
    const nextExplanations = deriveLiveMutationExplanations(
      routedCues,
      update.anomalyMarkers,
      {
        limit: MAX_RECENT_EXPLANATIONS,
        replayWindowIndex: update.replayWindowIndex ?? null,
        trackId: currentTrack?.id ?? null,
        trackTitle: currentTrack ? getTrackTitle(currentTrack) : null,
        trackSecond: currentTrackSecond,
      },
    );

    startTransition(() => {
      setLastUpdate(update);
      setRecentWarnings(update.warnings.slice(0, MAX_RECENT_WARNINGS));
      setError(null);

      if (!update.hasData) {
        setLastUpdate(update);
        return;
      }

      const windowId = `${update.fromOffset}-${update.toOffset}-${update.replayWindowIndex ?? "live"}`;
      const nextTailRows = (update.parsedLines || [])
        .filter((line) => line.trim().length > 0)
        .slice(-MAX_PARSED_LINES)
        .map((line, index) => {
          const tone = resolveParsedLineTone(line, update.anomalyMarkers);
          const component = resolveTailComponent(line, update.anomalyMarkers);
          const level = tone === "anomaly" ? "anomaly" : tone;
          return {
            id: `${windowId}-${index}`,
            windowId,
            sourcePath: update.sourcePath,
            component,
            level,
            line,
            tone,
          } satisfies SyncTailRow;
        });

      if (nextTailRows.length > 0) {
        setSyncTailRows((current) => [...current, ...nextTailRows].slice(-MAX_SYNC_TAIL_LINES));
      }
      setActiveTailWindowId(windowId);

      // Extract the most relevant log line for synchronized wave overlay
      const primaryLine = update.parsedLines?.[update.parsedLines.length - 1] || "";

      if (replayActive) return;

      setEmittedCueCount((current) => current + routedCues.length);
      setRecentCues((current) => [
        ...routedCues.slice().reverse().map(cue => ({
          ...cue,
          logLine: primaryLine // Attach the log line to the cue for synchronized rendering
        })),
        ...current,
      ].slice(0, MAX_RECENT_CUES));
      setRecentMarkers((current) => [
        ...update.anomalyMarkers.slice().reverse(),
        ...current,
      ].slice(0, MAX_RECENT_MARKERS));
      setRecentExplanations((current) => [
        ...nextExplanations.slice().reverse(),
        ...current,
      ].slice(0, MAX_RECENT_EXPLANATIONS));
      if (typeof currentTrackSecond === "number") {
        setBackgroundPlayheadSecond(currentTrackSecond);
      }
      if (nextExplanations[0]) {
        setSelectedExplanationId((current) =>
          monitor.isPlayback ? nextExplanations[0]!.id : current ?? nextExplanations[0]!.id,
        );
      }
      setRecentVoices(
        resolveArrangementVoices(
          routedCues,
          scene.mutationProfile.arrangementDepth,
        ).slice(0, 12),
      );
    });

    if (update.hasData && !replayActive) {
      // Auto-seed beat clock from the first live BPM; re-sync on >12% drift
      const liveBpmVal = update.suggestedBpm;
      if (typeof liveBpmVal === "number" && liveBpmVal > 0) {
        if (beatClockRef.current === null && scene.preset.useBeatGrid) {
          const ctx = audioContextRef.current;
          if (ctx) {
            beatClockRef.current = { originTime: ctx.currentTime, bpm: liveBpmVal };
            setBeatClockBpm(liveBpmVal);
          }
        } else if (beatClockRef.current !== null) {
          const drift =
            Math.abs(liveBpmVal - beatClockRef.current.bpm) / beatClockRef.current.bpm;
          if (drift > 0.12) {
            beatClockRef.current = { ...beatClockRef.current, bpm: liveBpmVal };
            setBeatClockBpm(liveBpmVal);
          }
        }
      }

      log.info("onStreamUpdate → playing %d routed cues, bpm=%s", routedCues.length, update.suggestedBpm);
      playWithCurrentEngine(routedCues, update.suggestedBpm);
      applyLogModulation(update);
    }
  });

  // Subscribe to the global monitor stream while this panel is mounted
  // Use a ref so the effect runs once (monitor object changes identity every render)
  const subscribeRef = useRef(monitor.subscribe);
  subscribeRef.current = monitor.subscribe;
  useEffect(() => {
    return subscribeRef.current(onStreamUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Start / stop (delegate to MonitorContext)
  // ---------------------------------------------------------------------------

  async function handleStart() {
    setLastUpdate(null);
    setEmittedCueCount(0);
    setRecentCues([]);
    setRecentVoices([]);
    setRecentMarkers([]);
    setRecentExplanations([]);
    setSelectedExplanationId(null);
    setBackgroundPlayheadSecond(0);
    setSyncTailRows([]);
    setActiveTailWindowId(null);
    setError(null);
    setIsStarting(true);
    bounceCuesRef.current = [];
    setBounceWindowCount(0);

    // Prime the AudioContext BEFORE any other async operation so the browser
    // still recognises this as a trusted user gesture. WebKit requires
    // new AudioContext() / resume() to be called during a user interaction.
    await ensureAudioReady();

    const sessionId = `sess-${repository.id}-${Date.now()}`;

    try {
      if (adapterKind === "file" && repository.sourcePath.startsWith("/tmp/")) {
        setRecentWarnings((c) => [
          "Warning: Log path is in /tmp/. We moved the generator to the project root for persistence.",
          ...c,
        ]);
      }
    let input: StartSessionInput;

    if (adapterKind === "process") {
      input = {
        sessionId,
        adapterKind: "process",
        source: repository.sourcePath,
        label: repository.title,
        command: processCommand
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
    } else if (adapterKind === "websocket") {
      const trimmedWsUrl = wsUrl.trim();
      if (!trimmedWsUrl || trimmedWsUrl === "ws://") {
        setError("A WebSocket URL is required (e.g. ws://localhost:9000/logs).");
        return;
      }
      input = {
        sessionId,
        adapterKind: "websocket",
        source: trimmedWsUrl,
        label: repository.title,
        wsUrl: trimmedWsUrl,
      };
    } else if (adapterKind === "http-poll") {
      const trimmedHttpUrl = httpUrl.trim();
      if (!trimmedHttpUrl || trimmedHttpUrl === "http://") {
        setError("An HTTP URL is required (e.g. http://localhost:9200/logs/stream).");
        return;
      }
      input = {
        sessionId,
        adapterKind: "http-poll",
        source: trimmedHttpUrl,
        label: repository.title,
        httpUrl: trimmedHttpUrl,
      };
    } else if (adapterKind === "journald") {
      // journaldUnit is the optional systemd unit filter — empty means follow all units
      const unit = journaldUnit.trim();
      input = {
        sessionId,
        adapterKind: "journald",
        source: unit || "system",
        label: unit ? `journald: ${unit}` : "journald: all units",
      };
    } else {
      input = {
        sessionId,
        adapterKind: "file",
        source: repository.sourcePath,
        label: repository.title,
        startFromBeginning: true,
      };
    }

    const started = await monitor.startSession(repository, input);
    if (!started) {
      throw new Error(
        "Maia could not start the selected live source in the current runtime.",
      );
    }

    // AudioContext was already created above — just read the ref
    const anchorBpm = referenceAnchor?.bpm ?? null;
    const ctx = audioContextRef.current;
    if (ctx && anchorBpm && anchorBpm > 0) {
      beatClockRef.current = { originTime: ctx.currentTime, bpm: anchorBpm };
      setBeatClockBpm(anchorBpm);
    } else {
      beatClockRef.current = null;
      setBeatClockBpm(null);
    }
    // Start the background rhythm pulse when beat-locked preset is active
    if (ctx && scene.preset.useBeatGrid) {
      const looperBpm = anchorBpm ?? 120;
      startBeatLooper(ctx, looperBpm, scene.preset.rhythmDivision, beatLooperRef, masterGainRef.current ?? ctx.destination);
      setBeatLooperActive(true);
    }

      // Start background guide track if present
      if (ctx) {
        void ensureBackgroundAudio(ctx);
      }
    } catch (err) {
      console.error("Start session failed", err);
      setError(`Failed to start monitor: ${toMessage(err)}`);
    } finally {
      setIsStarting(false);
    }
  }

  function handleStop() {
    void monitor.stopSession();
    setRecentExplanations([]);
    setSelectedExplanationId(null);
    setBackgroundPlayheadSecond(0);
    beatClockRef.current = null;
    setBeatClockBpm(null);
    stopBeatLooper(beatLooperRef);
    setBeatLooperActive(false);
    stopBackgroundDeck();
    if (backgroundGainRef.current) {
      backgroundGainRef.current.disconnect();
      backgroundGainRef.current = null;
    }
    if (filterNodeRef.current) {
      filterNodeRef.current.disconnect();
      filterNodeRef.current = null;
    }

    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    setBlobAudioVolume(0);
    stopManagedBlobAudio();
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
  }

  function handleBounce() {
    const windows = bounceCuesRef.current;
    if (windows.length === 0) return;
    const blob = renderBounceWav(windows, masterVolume);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const durationS = (windows.length * BOUNCE_WINDOW_S).toFixed(0);
    a.href = url;
    a.download = `maia-bounce-${repository.title.replace(/[^a-z0-9]/gi, "_")}-${durationS}s.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function handleApplyBookmarkSuggestion(bookmark: SessionBookmark) {
    if (bookmark.suggestedStyleProfileId) {
      setSelectedStyleProfileId(bookmark.suggestedStyleProfileId);
    }

    if (bookmark.suggestedMutationProfileId) {
      setSelectedMutationProfileId(bookmark.suggestedMutationProfileId);
    }
  }

  function handleApplyReplayFeedbackRecommendation() {
    if (!replayFeedbackRecommendation) {
      return;
    }

    const nextPrefs = persistReplayFeedbackRecommendation(
      repository.id,
      {
        basePlaylist,
        selectedStyleProfileId,
        selectedMutationProfileId,
      },
      replayFeedbackRecommendation,
    );

    setSelectedStyleProfileId(nextPrefs.selectedStyleProfileId);
    setSelectedMutationProfileId(nextPrefs.selectedMutationProfileId);
  }

  const handleSequencerStepFire = useEffectEvent(
    (firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }>) => {
      // Group firings by their delay bucket (0 = immediate, otherwise setTimeout)
      const immediate: typeof firings = [];
      const deferred: typeof firings = [];
      for (const f of firings) {
        if (f.humanizeOffsetMs <= 4) immediate.push(f);
        else deferred.push(f);
      }

      function playFirings(batch: typeof firings) {
        const cues: RoutedLiveCue[] = batch.map(({ track }, i) => {
          const cfg = SEQ_TRACK_CONFIG[track];
          return {
            id: `seq-${track}-${i}`,
            eventIndex: i,
            level: "info" as const,
            component: "",
            excerpt: "",
            noteHz: cfg.noteHz,
            durationMs: cfg.durationMs,
            gain: cfg.gainFactor,
            waveform: cfg.waveform,
            accent: "none" as const,
            pan: 0,
            routeKey: "info" as const,
            routeLabel: track,
            stemLabel: "",
            sectionLabel: "",
            focus: "",
            samplePath: null,
            sampleLabel: null,
          };
        });
        const blob = renderCuesToWav(cues, 1);
        if (blob) playManagedWavBlob(blob, Math.min(0.18, masterVolume * 0.4));
      }

      if (immediate.length > 0) playFirings(immediate);

      // Each deferred firing gets its own timed WAV render so the offset is audible
      for (const f of deferred) {
        const delay = f.humanizeOffsetMs;
        setTimeout(() => playFirings([f]), delay);
      }
    },
  );

  function handleJumpToBookmark(bookmark: SessionBookmark) {
    if (monitor.playbackEventCount === null) {
      return;
    }

    monitor.pausePlayback();
    monitor.seekPlaybackProgress(
      resolveReplayProgressForWindow(
        bookmark.replayWindowIndex,
        monitor.playbackEventCount,
      ),
    );

    const bookmarkExplanation = recentExplanations.find(
      (explanation) => explanation.replayWindowIndex === bookmark.replayWindowIndex,
    );
    if (bookmarkExplanation) {
      setSelectedExplanationId(bookmarkExplanation.id);
    }
    if (typeof bookmark.trackSecond === "number") {
      setBackgroundPlayheadSecond(bookmark.trackSecond);
    }
  }

  const handleSetMasterVolume = useCallback((nextVolume: number) => {
    setMasterVolume(Math.max(0, Math.min(1, nextVolume)));
  }, []);

  const handleToggleMute = useCallback(() => {
    setMasterVolume((current) => {
      if (current <= 0.001) {
        return previousAudibleVolumeRef.current > 0.001
          ? previousAudibleVolumeRef.current
          : 0.45;
      }

      previousAudibleVolumeRef.current = current;
      return 0;
    });
  }, []);

  const currentLevelCounts = lastUpdate?.levelCounts ?? {};
  const parsedLines = lastUpdate?.parsedLines.slice(-MAX_PARSED_LINES) ?? [];
  const anomalySourceRows = resolveAnomalySourceRows(lastUpdate);
  const waveAnomalyMarkers = recentMarkers.slice(0, 4);
  const liveSourceLabel = lastUpdate?.sourcePath ?? repository.sourcePath;
  const recentSyncTailRows = syncTailRows.slice(-MAX_SYNC_TAIL_LINES);

  if (!expanded && !liveEnabled) {
    return (
      <section className="panel live-monitor-cta">
        <div className="live-monitor-cta-content">
          <div>
            <h2>Live monitor deck</h2>
            <p className="support-copy">
              Choose a listening bed, pick a live feed, and let Maia turn this
              source into a background-safe monitoring mix.
            </p>
            <small className="monitor-cta-meta">
              {hasBaseListeningBed
                ? `${baseTrackCount} base track${baseTrackCount === 1 ? "" : "s"} armed`
                : "No base playlist armed yet"}
              {` · ${selectedStyleProfile.label} · ${selectedMutationProfile.label}`}
            </small>
          </div>
          <button type="button" className="action" onClick={() => setExpanded(true)}>
            Open monitor deck
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Live monitor deck</h2>
          <p className="support-copy">
            {replayActive
              ? "Replays a saved session through the same mutation engine so the team can revisit how the source bent the base groove."
              : "Listens to a live feed, bends the selected listening bed, and keeps new operational windows audible through Web Audio."}
          </p>
        </div>
        <div className="live-log-toolbar">
          <span className={`live-log-badge ${liveEnabled ? "live" : "idle"}`}>
            {statusLabel(liveEnabled, replayActive)}
          </span>
          <span className="live-log-badge">{activeAdapterLabel}</span>
          <span 
            className={`live-log-badge ${audioStatus === "ready" ? "ready" : "warn"}`}
            title={audioStatus === "ready" ? "Audio engine active" : "Audio blocked or errored. Click Start to resume."}
            onClick={() => void ensureAudioReady()}
            style={{ cursor: "pointer" }}
          >
            {audioStatus === "ready" ? "Audio: ON" : "Audio: BLOCKED"}
          </span>
          {liveEnabled ? (
            <button type="button" className="secondary-action" onClick={handleStop}>
              {replayActive ? "Exit replay" : "Stop monitor"}
            </button>
          ) : null}
          {bounceWindowCount > 0 ? (
            <button
              type="button"
              className="secondary-action"
              onClick={handleBounce}
              title={`Bounce ${(bounceWindowCount * BOUNCE_WINDOW_S).toFixed(0)}s of session audio to WAV`}
            >
              ↓ Bounce {(bounceWindowCount * BOUNCE_WINDOW_S).toFixed(0)}s
            </button>
          ) : null}
        </div>
      </div>

      {!liveEnabled ? (
        <>
          <div className="workflow-strip" aria-hidden="true">
            <div className="workflow-step-wrap">
              <span className={`workflow-step${hasBaseListeningBed ? " active" : ""}`}>
                Base Bed
              </span>
              <span className="workflow-arrow">→</span>
            </div>
            <div className="workflow-step-wrap">
              <span className={`workflow-step${adapterConfigured ? " active" : ""}`}>
                Source Feed
              </span>
              <span className="workflow-arrow">→</span>
            </div>
            <div className="workflow-step-wrap">
              <span className="workflow-step active">Scene</span>
              <span className="workflow-arrow">→</span>
            </div>
            <div className="workflow-step-wrap">
              <span className="workflow-step">Run</span>
            </div>
          </div>

          <div className="monitor-setup-grid">
            <div className="audio-path-card monitor-setup-card">
              <span>1. Base listening bed</span>
              <strong>{basePlaylist?.name ?? "Base playlist"}</strong>
              <p className="support-copy">
                Use a stable track or playlist so the monitor stays musical and
                low-fatigue during long sessions.
              </p>
              <div className="monitor-setup-stack">
                <input
                  type="text"
                  value={basePlaylist?.name ?? ""}
                  onChange={(event) =>
                    setBasePlaylist((current) =>
                      current
                        ? {
                            ...current,
                            name: event.target.value,
                            updatedAt: new Date().toISOString(),
                          }
                        : createBasePlaylist([], event.target.value || "Base playlist"),
                    )
                  }
                  placeholder="Name this base playlist"
                  aria-label="Base playlist name"
                />
                {availableTracks.length > 0 ? (
                  <div className="monitor-setup-row">
                    <select
                      className="compact-select"
                      value={pendingAddTrackId}
                      onChange={(e) => setPendingAddTrackId(e.target.value)}
                      title="Pick a track to add to the base playlist"
                    >
                      <option value="">Add base track…</option>
                      {availableTracks
                        .filter((t) => !(basePlaylist?.trackIds ?? []).includes(t.id))
                        .map((track) => (
                          <option key={track.id} value={track.id}>
                            {getTrackTitle(track)}
                            {track.analysis.bpm !== null ? ` · ${track.analysis.bpm.toFixed(0)} BPM` : ""}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="compact-action"
                      disabled={!pendingAddTrackId}
                      onClick={() => {
                        if (!pendingAddTrackId) {
                          return;
                        }
                        setBasePlaylist((current) => {
                          const nextTrackIds = current?.trackIds ?? [];
                          if (nextTrackIds.includes(pendingAddTrackId)) {
                            return current;
                          }

                          if (current) {
                            return {
                              ...current,
                              trackIds: [...current.trackIds, pendingAddTrackId],
                              updatedAt: new Date().toISOString(),
                            };
                          }

                          return createBasePlaylist([pendingAddTrackId]);
                        });
                        setPendingAddTrackId("");
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ) : null}
                {availablePlaylists.length > 0 ? (
                  <div className="monitor-setup-row">
                    <select
                      className="compact-select"
                      value={pendingLoadPlaylistId}
                      onChange={(e) => setPendingLoadPlaylistId(e.target.value)}
                      title="Load a saved base playlist from the library"
                    >
                      <option value="">Load saved playlist…</option>
                      {availablePlaylists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.name} · {playlist.trackIds.length} tracks
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="compact-action"
                      disabled={!pendingLoadPlaylistId}
                      onClick={() => {
                        const nextPlaylist =
                          availablePlaylists.find((playlist) => playlist.id === pendingLoadPlaylistId) ?? null;
                        if (!nextPlaylist) {
                          return;
                        }
                        setBasePlaylist({
                          ...nextPlaylist,
                          trackIds: nextPlaylist.trackIds.filter((trackId) =>
                            availableTracks.some((track) => track.id === trackId),
                          ),
                        });
                      }}
                    >
                      Load
                    </button>
                  </div>
                ) : null}
                {hasBaseListeningBed ? (
                  <div className="pill-strip">
                    {basePlaylist?.trackIds.map((id, idx) => {
                      const track = availableTracks.find((t) => t.id === id);
                      if (!track) {
                        return null;
                      }
                      return (
                        <span key={id} className="pill-removable">
                          <button
                            type="button"
                            className="pill-reorder"
                            aria-label={`Move ${getTrackTitle(track)} up`}
                            disabled={idx === 0}
                            onClick={() =>
                              setBasePlaylist((current) => {
                                if (!current) {
                                  return current;
                                }
                                const next = [...current.trackIds];
                                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                return {
                                  ...current,
                                  trackIds: next,
                                  updatedAt: new Date().toISOString(),
                                };
                              })
                            }
                          >
                            ↑
                          </button>
                          {getTrackTitle(track)}
                          {track.analysis.bpm !== null ? ` · ${track.analysis.bpm.toFixed(0)} BPM` : ""}
                          <button
                            type="button"
                            className="pill-reorder"
                            aria-label={`Move ${getTrackTitle(track)} down`}
                            disabled={idx === (basePlaylist?.trackIds.length ?? 0) - 1}
                            onClick={() =>
                              setBasePlaylist((current) => {
                                if (!current) {
                                  return current;
                                }
                                const next = [...current.trackIds];
                                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                return {
                                  ...current,
                                  trackIds: next,
                                  updatedAt: new Date().toISOString(),
                                };
                              })
                            }
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${getTrackTitle(track)} from base playlist`}
                            onClick={() =>
                              setBasePlaylist((current) =>
                                current
                                  ? {
                                      ...current,
                                      trackIds: current.trackIds.filter((trackId) => trackId !== id),
                                      updatedAt: new Date().toISOString(),
                                    }
                                  : current,
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="monitor-empty-hint">
                    Add at least one track if you want the monitor to behave like
                    Maia's intended familiar listening bed instead of pure cue synthesis.
                  </p>
                )}
              </div>
            </div>

            <div className="audio-path-card monitor-setup-card">
              <span>2. Signal feed</span>
              <strong>{getStreamAdapterLabel(adapterKind)}</strong>
              <p className="support-copy">{adapterDescription}</p>
              <div className="monitor-setup-stack">
                <select
                  className="compact-select"
                  value={adapterKind}
                  onChange={(e) => setAdapterKind(e.target.value as StreamAdapterKind)}
                >
                  <option value="file">File tail</option>
                  <option value="process">Process stdout</option>
                  <option value="websocket">WebSocket</option>
                  <option value="http-poll">HTTP poll</option>
                  <option value="journald">journald (systemd)</option>
                </select>
                {adapterKind === "process" ? (
                  <input
                    className="compact-input"
                    type="text"
                    placeholder="e.g. tail -f /var/log/syslog"
                    value={processCommand}
                    onChange={(e) => setProcessCommand(e.target.value)}
                    aria-label="Process command"
                  />
                ) : adapterKind === "websocket" ? (
                  <input
                    className="compact-input compact-input--url"
                    placeholder="ws://host:port/path"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    aria-label="WebSocket URL"
                  />
                ) : adapterKind === "http-poll" ? (
                  <input
                    className="compact-input compact-input--url"
                    placeholder="http://host:port/logs/stream"
                    value={httpUrl}
                    onChange={(e) => setHttpUrl(e.target.value)}
                    aria-label="HTTP poll URL"
                  />
                ) : adapterKind === "journald" ? (
                  <input
                    className="compact-input"
                    placeholder="Unit filter, e.g. nginx.service (blank = all)"
                    value={journaldUnit}
                    onChange={(e) => setJournaldUnit(e.target.value)}
                    aria-label="journald unit filter"
                  />
                ) : null}
                <div className="monitor-source-summary">
                  <small>Target</small>
                  <strong>{adapterTarget}</strong>
                </div>
              </div>
            </div>

            <div className="audio-path-card monitor-setup-card">
              <span>3. Scene and launch</span>
              <strong>
                {selectedStyleProfile.label} · {selectedMutationProfile.label}
              </strong>
              <p className="support-copy">
                {selectedStyleProfile.description} {selectedMutationProfile.description}
              </p>
              <div className="monitor-setup-stack">
                <select
                  className="compact-select"
                  value={selectedStyleProfileId}
                  onChange={(e) => setSelectedStyleProfileId(e.target.value)}
                  title="Style profile — sets the base musical character for background listening"
                >
                  {STYLE_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
                <select
                  className="compact-select"
                  value={selectedMutationProfileId}
                  onChange={(e) => setSelectedMutationProfileId(e.target.value)}
                  title="Mutation profile — controls how hard logs and repo activity deform the base track"
                >
                  {MUTATION_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
                <ul className="monitor-readiness-list">
                  <li className="monitor-readiness-item">
                    <span>Base bed</span>
                    <strong className={`monitor-readiness-state${hasBaseListeningBed ? " ready" : ""}`}>
                      {hasBaseListeningBed
                        ? `${baseTrackCount} track${baseTrackCount === 1 ? "" : "s"} armed`
                        : "Recommended"}
                    </strong>
                  </li>
                  <li className="monitor-readiness-item">
                    <span>Source feed</span>
                    <strong className={`monitor-readiness-state${adapterConfigured ? " ready" : ""}`}>
                      {adapterConfigured ? "Ready" : "Needs config"}
                    </strong>
                  </li>
                  <li className="monitor-readiness-item">
                    <span>Cue engine</span>
                    <strong className="monitor-readiness-state ready">
                      {cueEnginePreviewLabel}
                    </strong>
                  </li>
                </ul>
                {!hasBaseListeningBed ? (
                  <p className="monitor-empty-hint">
                    Maia can still run synth-only, but the intended product flow
                    is a chosen track or playlist as the stable listening bed.
                  </p>
                ) : null}
                <div className="monitor-launch-row">
                  <button
                    type="button"
                    className="action"
                    disabled={isStarting || !adapterConfigured}
                    onClick={() => void handleStart()}
                  >
                    {isStarting ? (
                      <>
                        <span className="spin-ring" aria-hidden="true" /> Starting...
                      </>
                    ) : (
                      "Start monitor"
                    )}
                  </button>
                  <small>
                    {adapterConfigured
                      ? `Feed target: ${adapterTarget}`
                      : "Configure the selected feed before starting."}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {error && (
        <div style={{ padding: "8px 16px", background: "rgba(255,0,0,0.1)", border: "1px solid #f44", borderRadius: "4px", margin: "10px", color: "#f44", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {liveEnabled && (basePlaylist?.trackIds.length ?? 0) > 0 ? (
        <>
        <div className="audio-path-card top-spaced">
          <span>Base playlist</span>
          <strong>{basePlaylist?.name ?? "Base playlist"}</strong>
          {liveEnabled && backgroundNowPlayingTrack ? (
            <small>
              Now playing: {getTrackTitle(backgroundNowPlayingTrack)}
              {backgroundNowPlayingTrack.analysis.bpm !== null
                ? ` · ${backgroundNowPlayingTrack.analysis.bpm.toFixed(0)} BPM`
                : ""}
            </small>
          ) : null}
          {liveEnabled && backgroundTransitionPlan && backgroundTransitionNextTrack ? (
            <small>
              Up next: {getTrackTitle(backgroundTransitionNextTrack)} · {backgroundTransitionPlan.summary}
            </small>
          ) : null}
          <p className="support-copy top-spaced">
            {selectedStyleProfile.description} {selectedMutationProfile.description}
          </p>
        </div>

        <p className="support-copy top-spaced">Base playlist</p>
        <div className="pill-strip">
          {basePlaylist?.trackIds.map((id) => {
            const track = availableTracks.find((t) => t.id === id);
            if (!track) {
              return null;
            }
            return (
              <span key={id}>
                {getTrackTitle(track)}
                {track.analysis.bpm !== null ? ` · ${track.analysis.bpm.toFixed(0)} BPM` : ""}
              </span>
            );
          })}
        </div>
        </>
      ) : null}

      {liveEnabled && monitor.session ? (
        <div className={`audio-path-card${replayActive ? " audio-path-card--replay" : ""}`}>
          <span>{replayActive ? "Replay session" : "Session"}</span>
          <strong>{monitor.session.repoTitle}</strong>
          <small>
            {replayActive
              ? `Stored source replay · ${monitor.session.sourcePath}`
              : monitor.session.pollMode === "direct"
                ? "Fallback — direct file poll"
                : monitor.session.pollMode === "websocket"
                  ? `${getStreamAdapterLabel("websocket")} · ${monitor.session.sourcePath}`
                  : monitor.session.pollMode === "http-poll"
                    ? `${getStreamAdapterLabel("http-poll")} · ${monitor.session.sourcePath}`
                    : `${getStreamAdapterLabel(monitor.session.adapterKind)} · ${monitor.session.sourcePath}`}
          </small>
          {replayActive && playbackPercent !== null ? (
            <div
              className="monitor-progress-track"
              role="progressbar"
              aria-label="Replay progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={playbackPercent}
            >
              <span style={{ width: `${playbackPercent}%` }} />
            </div>
          ) : null}
          {replayActive && playbackPercent !== null ? (
            <small>
              {playbackPercent}% complete · {monitor.metrics.windowCount} windows replayed
            </small>
          ) : null}
        </div>
      ) : null}

      {replayActive &&
      monitor.playbackProgress !== null &&
      monitor.playbackEventCount !== null ? (
        <LiveMonitorReplayTimelineCard
          playbackProgress={monitor.playbackProgress}
          playbackPercent={playbackPercent ?? 0}
          playbackWindowLabel={playbackWindowLabel}
          isPlaybackPaused={monitor.isPlaybackPaused}
          playbackEventCount={monitor.playbackEventCount}
          onStepWindow={(direction) => monitor.stepPlaybackWindow(direction)}
          onTogglePause={() =>
            monitor.isPlaybackPaused ? monitor.resumePlayback() : monitor.pausePlayback()
          }
          onSeekProgress={(progress) => monitor.seekPlaybackProgress(progress)}
        />
      ) : null}

      {replayActive &&
      replaySessionId &&
      monitor.playbackEventIndex !== null ? (
        <LiveMonitorReplayBookmarksCard
          replayWindowIndex={monitor.playbackEventIndex}
          activeReplayBookmark={activeReplayBookmark}
          sortedSessionBookmarks={sortedSessionBookmarks}
          playbackEventCount={monitor.playbackEventCount}
          bookmarkLabelDraft={bookmarkLabelDraft}
          bookmarkNoteDraft={bookmarkNoteDraft}
          bookmarkTagDraft={bookmarkTagDraft}
          bookmarkStyleProfileIdDraft={bookmarkStyleProfileIdDraft}
          bookmarkMutationProfileIdDraft={bookmarkMutationProfileIdDraft}
          bookmarkBusy={bookmarkBusy}
          bookmarkError={bookmarkError}
          onBookmarkLabelChange={(event) => setBookmarkLabelDraft(event.target.value)}
          onBookmarkNoteChange={(event) => setBookmarkNoteDraft(event.target.value)}
          onBookmarkTagToggle={(tagId) =>
            setBookmarkTagDraft((current) => (current === tagId ? null : tagId))
          }
          onBookmarkStyleProfileChange={(event) =>
            setBookmarkStyleProfileIdDraft(event.target.value || null)
          }
          onBookmarkMutationProfileChange={(event) =>
            setBookmarkMutationProfileIdDraft(event.target.value || null)
          }
          onCaptureCurrentScene={captureCurrentScene}
          onSaveBookmark={() => void saveReplayBookmark()}
          onDeleteCurrentBookmark={() => {
            if (!activeReplayBookmark) {
              return;
            }
            void deleteReplayBookmark(activeReplayBookmark);
          }}
          onJumpToBookmark={handleJumpToBookmark}
          onApplyBookmarkSuggestion={handleApplyBookmarkSuggestion}
          onDeleteBookmark={(bookmark) => void deleteReplayBookmark(bookmark)}
        />
      ) : null}

      {replayActive && replayFeedbackRecommendation ? (
        <ReplayFeedbackSummaryCard
          recommendation={replayFeedbackRecommendation}
          className="audio-path-card--replay top-spaced"
          actionLabel={
            replayFeedbackRecommendation.isAligned
              ? "Scene already aligned"
              : "Apply feedback mix"
          }
          actionDisabled={replayFeedbackRecommendation.isAligned}
          onApply={handleApplyReplayFeedbackRecommendation}
        />
      ) : null}

      <div className="metric-grid">
        <div>
          <span>Mode</span>
          <strong>
            {replayActive ? "Session replay" : activeAdapterLabel}
          </strong>
        </div>
        <div>
          <span>Audio</span>
          <strong>{audioLabel(audioStatus, liveEnabled)}</strong>
        </div>
        <div>
          <span>Style profile</span>
          <strong>{selectedStyleProfile.label}</strong>
        </div>
        <div>
          <span>Mutation</span>
          <strong>{selectedMutationProfile.label}</strong>
        </div>
        <div>
          <span>Cue engine</span>
          <strong>
            {sampleStatus === "ready"
              ? scene.sampleSourceCount > 1
                ? "Base sample pack"
                : "Base sample"
              : sampleStatus === "loading"
                ? "Loading sample"
                : "Internal synth"}
          </strong>
        </div>
        <div>
          <span>Windows heard</span>
          <strong>
            {replayActive && playbackWindowLabel
              ? playbackWindowLabel
              : monitor.metrics.windowCount}
          </strong>
        </div>
        <div>
          <span>Cues emitted</span>
          <strong>{emittedCueCount}</strong>
        </div>
        <div>
          <span>Lines processed</span>
          <strong>{monitor.metrics.processedLines}</strong>
        </div>
        <div>
          <span>Anomalies heard</span>
          <strong>{monitor.metrics.totalAnomalies}</strong>
        </div>
        <div>
          <span>Beat clock</span>
          <strong>
            {beatClockBpm !== null ? `${beatClockBpm.toFixed(0)} BPM` : "Free"}
          </strong>
        </div>
        <div>
          <span>Voices emitted</span>
          <strong>{emittedVoiceCount}</strong>
        </div>
        <div>
          <span>Rhythm pulse</span>
          <strong>{beatLooperActive ? "Active" : "Off"}</strong>
        </div>
      </div>

      <div className="monitor-volume-control top-spaced">
        <label className="monitor-volume-label">
          <span>Master Volume</span>
          <strong>{Math.round(masterVolume * 100)}%</strong>
        </label>
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(e) => handleSetMasterVolume(Number(e.target.value))}
          aria-label="Master volume"
        />
        <div className="monitor-volume-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={handleToggleMute}
          >
            {masterVolume <= 0.001 ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => handleSetMasterVolume(0.2)}
          >
            20%
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => handleSetMasterVolume(0.4)}
          >
            40%
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => handleSetMasterVolume(0.6)}
          >
            60%
          </button>
        </div>
      </div>

      <div className="audio-path-card top-spaced">
        <span>{replayActive ? "Replay source path" : "Live source path"}</span>
        <strong>{repository.sourcePath}</strong>
      </div>

      <LiveSonificationScenePanel
        availableBaseAssets={availableBaseAssets}
        availableCompositions={availableCompositions}
        sceneBaseAssetId={sceneBaseAssetId}
        sceneCompositionId={sceneCompositionId}
        onSceneBaseAssetIdChange={setSceneBaseAssetId}
        onSceneCompositionIdChange={setSceneCompositionId}
        scene={scene}
      />

      <ComponentRoutingPanel
        knownComponents={knownComponents}
        overrides={componentOverrides}
        liveActive={monitor.session?.repoId === repository.id}
        onOverrideChange={(component, override) =>
          setComponentOverrides((current) => {
            const next = new Map(current);
            next.set(component, override);
            return next;
          })
        }
      />

      {lastUpdate ? (
        <div className="live-waveform-container top-spaced">
          <div className="panel-header compact">
            <div>
              <h2>Live system rhythm</h2>
              <p className="support-copy">
                Real-time audio waveform from the monitor engine.
              </p>
            </div>
          </div>
          <LiveWaveformCanvas
            analyserRef={analyserRef}
            active={liveEnabled}
            accentColor={scene.genreId === "tropical-house" ? "#ef7f45" : "#21b4b8"}
          />
          <div className={`live-scrolling-wave ${scene.genreId === "tropical-house" ? "tropical-theme" : ""}`}>
            {recentCues.map((cue, idx) => (
              <div
                key={`${cue.id}-${idx}`}
                className={`live-wave-bar ${cue.routeKey}${cue.accent === "anomaly" ? " is-anomaly" : ""}`}
                title={`${cue.component} · ${cue.excerpt}`}
                style={{
                  "--bar-height": `${cue.accent === "anomaly" ? Math.max(60, cue.gain * 400) : Math.max(10, cue.gain * 220)}px`,
                  "--bar-opacity": Math.max(0.3, 1 - idx / MAX_RECENT_CUES),
                } as any}
              />
            ))}
            {recentCues.length === 0 && (
              <div className="live-wave-placeholder">Awaiting system pulse…</div>
            )}
          </div>
          <div className="monitor-recent-horizontal-tail">
            {recentCues.map((cue, idx) => (
              <div 
                key={`tail-${cue.id}-${idx}`} 
                className={`monitor-horizontal-tail-cell is-${cue.routeKey}`}
                style={{ 
                  "--cell-opacity": Math.max(0.3, 1 - idx / MAX_RECENT_CUES) 
                } as any}
              >
                {cue.logLine ? (
                  <div className="monitor-horizontal-tail-text">
                    <span className="tail-component">[{cue.component}]</span> {cue.logLine}
                  </div>
                ) : (
                  <div className="monitor-horizontal-tail-empty">IDLE</div>
                )}
              </div>
            ))}
          </div>
          <div className="live-wave-anomaly-strip">
            <div className="monitor-parsed-lines-head">
              <span>Wave anomaly markers</span>
              <strong>{waveAnomalyMarkers.length}/4</strong>
            </div>
            {waveAnomalyMarkers.length > 0 ? (
              <div className="live-wave-anomaly-chip-list">
                {waveAnomalyMarkers.map((marker, index) => (
                  <div key={`${marker.eventIndex}-${index}`} className="live-wave-anomaly-chip">
                    <span className="live-wave-anomaly-chip-level">{marker.level.toUpperCase()}</span>
                    <span className="live-wave-anomaly-chip-component">{marker.component}</span>
                    <code className="live-wave-anomaly-chip-excerpt">{marker.excerpt}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="monitor-empty-hint">No anomaly markers in the latest windows.</p>
            )}
          </div>
          <div className="audio-path-card">
            <span>Wave source stream</span>
            <strong>{liveSourceLabel}</strong>
          </div>
          <div className="monitor-lines-under-wave">
            <div className="monitor-parsed-lines">
              <div className="monitor-parsed-lines-head">
                <span>Stream tail sync</span>
                <strong>
                  {recentSyncTailRows.length}/{MAX_SYNC_TAIL_LINES} lines
                </strong>
              </div>
              <div
                ref={syncTailListRef}
                className="monitor-parsed-lines-list monitor-sync-tail-list"
                role="list"
                aria-label="Synchronized stream tail lines"
              >
                {recentSyncTailRows.length > 0 ? recentSyncTailRows.map((row, index) => (
                  <div
                    key={row.id}
                    className={`monitor-parsed-line is-${row.tone}${row.windowId === activeTailWindowId ? " is-current-window" : ""}`}
                    role="listitem"
                  >
                    <span className="monitor-parsed-line-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="monitor-parsed-line-tone">{row.level.toUpperCase()}</span>
                    <code className="monitor-parsed-line-code">
                      [{row.component}] {row.line}
                      {`\n`}
                      <span className="monitor-anomaly-source-path">{row.sourcePath}</span>
                    </code>
                  </div>
                )) : (
                  <div className="monitor-parsed-line is-empty" role="listitem">
                    <span className="monitor-parsed-line-index">--</span>
                    <span className="monitor-parsed-line-tone">IDLE</span>
                    <code className="monitor-parsed-line-code">
                      Waiting for synchronized stream lines from live/replay updates...
                    </code>
                  </div>
                )}
              </div>
            </div>
            <div className="monitor-anomaly-source-lines">
              <div className="monitor-parsed-lines-head">
                <span>Anomaly source lines</span>
                <strong>
                  {anomalySourceRows.length}/{MAX_ANOMALY_SOURCE_LINES}
                </strong>
              </div>
              {anomalySourceRows.length > 0 ? (
                <div className="monitor-parsed-lines-list" role="list" aria-label="Anomaly source lines">
                  {anomalySourceRows.map((row, index) => (
                    <div
                      key={`${lastUpdate.fromOffset}-${index}-${row.level}`}
                      className={`monitor-parsed-line is-${row.tone}`}
                      role="listitem"
                    >
                      <span className="monitor-parsed-line-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="monitor-parsed-line-tone">{row.level.toUpperCase()}</span>
                      <code className="monitor-parsed-line-code">
                        [{row.component}] {row.line}
                        {`\n`}
                        <span className="monitor-anomaly-source-path">{row.sourcePath}</span>
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="monitor-parsed-line is-empty">
                  <span className="monitor-parsed-line-index">--</span>
                  <span className="monitor-parsed-line-tone">IDLE</span>
                  <code className="monitor-parsed-line-code">
                    No anomaly-producing stream line in this window yet.
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {lastUpdate ? (
        <>
          <div className="render-master-card top-spaced">
            <span>Current window summary</span>
            <strong>{lastUpdate.summary}</strong>
          </div>

          <div className="metric-grid top-spaced">
            <div>
              <span>Suggested BPM</span>
              <strong>
                {typeof lastUpdate.suggestedBpm === "number"
                  ? lastUpdate.suggestedBpm.toFixed(0)
                  : repository.suggestedBpm?.toFixed(0) ?? "Pending"}
              </strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>{formatConfidence(lastUpdate.confidence)}</strong>
            </div>
            <div>
              <span>Dominant level</span>
              <strong>{lastUpdate.dominantLevel}</strong>
            </div>
            <div>
              <span>Chunk lines</span>
              <strong>{lastUpdate.lineCount}</strong>
            </div>
            <div>
              <span>Errors</span>
              <strong>{levelCount(currentLevelCounts, "error")}</strong>
            </div>
            <div>
              <span>Warnings</span>
              <strong>{levelCount(currentLevelCounts, "warn")}</strong>
            </div>
            <div>
              <span>Info</span>
              <strong>{levelCount(currentLevelCounts, "info")}</strong>
            </div>
            <div>
              <span>Tail window</span>
              <strong>
                {formatCursor(lastUpdate.fromOffset)} → {formatCursor(lastUpdate.toOffset)}
              </strong>
            </div>
          </div>

          {lastUpdate.topComponents.length > 0 ? (
            <>
              <div className="panel-header compact top-spaced">
                <div>
                  <h2>Active components</h2>
                  <p className="support-copy">
                    Most active sources in the latest live window.
                  </p>
                </div>
              </div>
              <div className="pill-strip">
                {lastUpdate.topComponents.map((component) => (
                  <span key={`${component.component}-${component.count}`}>
                    {component.component} · {component.count}
                  </span>
                ))}
              </div>
            </>
          ) : null}

          <LiveMonitorMutationTracePanel
            replayActive={replayActive}
            playbackEventIndex={monitor.playbackEventIndex}
            traceWaveformTrack={traceWaveformTrack}
            traceWaveformExplanations={traceWaveformExplanations}
            traceWaveformCues={traceWaveformCues}
            traceWaveformCurrentTime={
              selectedTraceExplanation?.trackSecond ?? backgroundPlayheadSecond
            }
            recentExplanations={recentExplanations}
            selectedExplanationId={selectedExplanationId}
            onSelectExplanation={(explanation) => {
              if (
                replayActive &&
                explanation.replayWindowIndex !== null &&
                monitor.playbackEventCount !== null
              ) {
                monitor.pausePlayback();
                monitor.seekPlaybackProgress(
                  resolveReplayProgressForWindow(
                    explanation.replayWindowIndex,
                    monitor.playbackEventCount,
                  ),
                );
              }
              setSelectedExplanationId(explanation.id);
              if (typeof explanation.trackSecond === "number") {
                setBackgroundPlayheadSecond(explanation.trackSecond);
              }
            }}
          />
        </>
      ) : (
        <div className="empty-state top-spaced">
          <p>
            Start the live tail to listen to newly appended log lines as internal cues inside
            Maia.
          </p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Arrangement layers</h2>
          <p className="support-copy">
            Last scheduled foundation / motion / accent voices from the multi-track engine.
          </p>
        </div>
      </div>

      {recentVoices.length > 0 ? (
        <div className="arrangement-lane-grid">
          {(["foundation", "motion", "accent"] as const).map((track) => {
            const trackVoices = recentVoices.filter((v) => v.track === track);
            return (
              <div key={track} className={`arrangement-lane arrangement-lane--${track}`}>
                <span className="arrangement-lane-label">{track}</span>
                <div className="arrangement-lane-chips">
                  {trackVoices.map((v, i) => (
                    <span key={i} className="arrangement-lane-chip">
                      {v.cue.component} · {v.cue.routeLabel}
                    </span>
                  ))}
                  {trackVoices.length === 0 && (
                    <span className="arrangement-lane-empty">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No arrangement voices fired yet.</p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Pad sequencer</h2>
          <p className="support-copy">
            Author a 16-step pattern per arrangement track. Use ▶ Play to audition, Fill from scene to seed from recent voices, or toggle steps manually.
          </p>
        </div>
      </div>

      <PadSequencerPanel
        bpm={beatClockBpm ?? repository.suggestedBpm ?? 120}
        recentVoices={recentVoices}
        onStepFire={handleSequencerStepFire}
      />

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Recent cues</h2>
          <p className="support-copy">
            Last emitted musical events derived from appended log lines.
          </p>
        </div>
      </div>

      {recentCues.length > 0 ? (
        <div className="cue-pill-strip">
          {recentCues.map((cue) => (
            <article key={cue.id} className="cue-pill">
              <span>
                {cue.level} · {cue.waveform} · {cue.routeLabel}
              </span>
              <strong>{cue.component}</strong>
              <small>
                {formatFrequency(cue.noteHz)} · {cue.durationMs} ms
              </small>
              <small>
                {cue.stemLabel} · {cue.sectionLabel}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No live cues emitted yet.</p>
        </div>
      )}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Recent anomaly markers</h2>
          <p className="support-copy">
            Last spikes Maia translated into stronger accents.
          </p>
        </div>
      </div>

      {recentMarkers.length > 0 ? (
        <ul className="stack-list">
          {recentMarkers.map((marker) => (
            <li key={`${marker.eventIndex}-${marker.component}-${marker.level}`}>
              <strong>
                Event {marker.eventIndex} · {marker.level} · {marker.component}
              </strong>
              <small>{marker.excerpt}</small>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>No anomaly markers have been heard in this session.</p>
        </div>
      )}

      {recentWarnings.length > 0 || error ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>Monitor notes</h2>
              <p className="support-copy">
                Runtime notes from the internal tail loop and audio engine.
              </p>
            </div>
          </div>
          <ul className="stack-list live-log-warning-list">
            {error ? (
              <li key="live-log-error">
                <strong>Runtime error</strong>
                <small>{error}</small>
              </li>
            ) : null}
            {recentWarnings.map((warning) => (
              <li key={warning}>
                <strong>Monitor note</strong>
                <small>{warning}</small>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
