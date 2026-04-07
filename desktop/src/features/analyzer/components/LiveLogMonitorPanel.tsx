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
import { useMonitor } from "../../monitor/MonitorContext";
import { musicStyleCatalog } from "../../../config/musicStyles";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import { ComponentRoutingPanel } from "./ComponentRoutingPanel";
import { PadSequencerPanel } from "./PadSequencerPanel";
import {
  blendAnchors,
  clampPan,
  deriveReferenceAnchor,
  resolveLiveSonificationScene,
  resolveArrangementVoices,
  routeCueThroughScene,
  type ArrangementVoice,
  type ComponentOverride,
  type RoutedLiveCue,
} from "./liveSonificationScene";

const MAX_RECENT_CUES = 8;
const MAX_RECENT_MARKERS = 6;
const MAX_RECENT_WARNINGS = 4;

type AudioEngineStatus = "idle" | "ready" | "unsupported" | "error";
type SampleEngineStatus = "unavailable" | "loading" | "ready" | "error";

interface LiveLogMonitorPanelProps {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  availableTracks: LibraryTrack[];
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
// WAV-based audio renderer — bypasses WebAudio destination entirely.
// Renders cues to a PCM buffer, wraps in a WAV blob, plays via <audio>.
// Needed because WebKitGTK may silently swallow AudioContext.destination output.
// ---------------------------------------------------------------------------

const RENDER_SAMPLE_RATE = 44100;

function renderCuesToWav(cues: RoutedLiveCue[], masterGain: number): Blob | null {
  if (cues.length === 0) return null;

  // Fixed window: render only 600ms (one poll interval), not each cue's full duration.
  // This prevents huge buffer allocations when many long cues are queued.
  const windowDuration = 0.6; // 600ms matches POLL_INTERVAL_MS
  const totalSamples = Math.ceil(RENDER_SAMPLE_RATE * windowDuration);
  const mixBuffer = new Float32Array(totalSamples);

  // Render cues in parallel: each cue contributes to the same buffer simultaneously
  // This is ~O(totalSamples × numCues), but no longer than O(26460 × 32) = 846k iterations
  // which can execute in ~8-10ms on modern hardware. Still acceptable for real-time.
  for (let i = 0; i < totalSamples; i++) {
    const t = i / RENDER_SAMPLE_RATE;

    for (const cue of cues) {
      const dur = Math.max(0.08, cue.durationMs / 1000);
      if (t > dur) continue; // Skip if outside cue duration

      const freq = cue.noteHz;
      const gain = Math.min(0.5, cue.gain);

      // Envelope: quick attack (20ms), sustain, exponential release
      const attackEnd = 0.02;
      const releaseStart = dur * 0.7;
      let env = 1;
      if (t < attackEnd) env = t / attackEnd;
      else if (t > releaseStart) env = Math.max(0, 1 - (t - releaseStart) / (dur - releaseStart));

      // Waveform generation
      let sample: number;
      switch (cue.waveform) {
        case "square":
          sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
          break;
        case "sawtooth":
          sample = 2 * ((freq * t) % 1) - 1;
          break;
        case "triangle": {
          const phase = (freq * t) % 1;
          sample = 4 * Math.abs(phase - 0.5) - 1;
          break;
        }
        default: // sine
          sample = Math.sin(2 * Math.PI * freq * t);
      }

      mixBuffer[i] += sample * gain * env;
    }
  }

  // Clamp and apply master gain
  const numSamples = mixBuffer.length;
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  // WAV header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, RENDER_SAMPLE_RATE, true);
  view.setUint32(28, RENDER_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, mixBuffer[i] * masterGain));
    view.setInt16(44 + i * 2, clamped * 32767, true);
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function playWavBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 1.0;
  audio.play()
    .catch((err) => console.warn("[Maia Audio] WAV playback failed:", err))
    .finally(() => {
      audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
      // Safety cleanup in case "ended" never fires
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
}

function resolveManagedAudioSource(audioPath: string | null): string | null {
  if (!audioPath || audioPath.startsWith("browser-fallback://") || !isTauri()) {
    return null;
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

interface MonitorPrefs {
  referencePlaylistIds: string[];
  selectedGenreId: string;
  selectedPresetId: string;
}

function loadMonitorPrefs(repoId: string): MonitorPrefs | null {
  try {
    const raw = localStorage.getItem(`maia.monitor-prefs.${repoId}`);
    return raw ? (JSON.parse(raw) as MonitorPrefs) : null;
  } catch {
    return null;
  }
}

function saveMonitorPrefs(repoId: string, prefs: MonitorPrefs): void {
  try {
    localStorage.setItem(`maia.monitor-prefs.${repoId}`, JSON.stringify(prefs));
  } catch {
    // ignore quota / private-browsing storage errors
  }
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

function levelCount(levelCounts: Record<string, number>, level: string): number {
  return levelCounts[level] ?? 0;
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
        height: "160px",
        borderRadius: "14px",
        display: "block",
      }}
    />
  );
}

function statusLabel(liveEnabled: boolean): string {
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
}: LiveLogMonitorPanelProps) {
  const monitor = useMonitor();
  // Session is live for THIS repo when the global monitor owns it
  const liveEnabled = monitor.session?.repoId === repository.id;

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sampleBuffersRef = useRef(new Map<string, AudioBuffer>());
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [processCommand, setProcessCommand] = useState("");
  const [wsUrl, setWsUrl] = useState("ws://");
  const [httpUrl, setHttpUrl] = useState("http://");
  const [selectedGenreId, setSelectedGenreId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedGenreId ?? musicStyleCatalog.defaultTrackMusicStyleId,
  );
  const [selectedPresetId, setSelectedPresetId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedPresetId ?? "balanced",
  );
  const [referencePlaylistIds, setReferencePlaylistIds] = useState<string[]>(
    () => loadMonitorPrefs(repository.id)?.referencePlaylistIds ?? [],
  );
  const [pendingAddTrackId, setPendingAddTrackId] = useState("");
  const beatClockRef = useRef<BeatClock | null>(null);
  const beatLooperRef = useRef<BeatLooperState | null>(null);
  const backgroundAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const [beatClockBpm, setBeatClockBpm] = useState<number | null>(null);
  const [beatLooperActive, setBeatLooperActive] = useState(false);
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
  const [recentWarnings, setRecentWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const selectedSceneBaseAsset =
    availableBaseAssets.find((entry) => entry.id === sceneBaseAssetId) ?? null;
  const selectedSceneComposition =
    availableCompositions.find((entry) => entry.id === sceneCompositionId) ?? null;
  const playlistAnchors = referencePlaylistIds
    .map((id) => availableTracks.find((t) => t.id === id))
    .filter((t): t is LibraryTrack => t !== undefined)
    .map(deriveReferenceAnchor);
  const referenceAnchor =
    playlistAnchors.length > 0 ? blendAnchors(playlistAnchors) : null;
  const scene = resolveLiveSonificationScene(
    selectedSceneBaseAsset,
    selectedSceneComposition,
    selectedGenreId,
    selectedPresetId,
    referenceAnchor,
  );

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
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

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
    setRecentWarnings([]);
    setError(null);
    knownComponentsRef.current = [];
    setKnownComponents([]);
    setComponentOverrides(new Map());
    setSceneBaseAssetId(preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp));
    setSceneCompositionId(
      preferredCompositionId(availableCompositions, preferredCompositionIdProp),
    );
    const nextPrefs = loadMonitorPrefs(repository.id);
    setReferencePlaylistIds(nextPrefs?.referencePlaylistIds ?? []);
    setSelectedGenreId(nextPrefs?.selectedGenreId ?? musicStyleCatalog.defaultTrackMusicStyleId);
    setSelectedPresetId(nextPrefs?.selectedPresetId ?? "balanced");
    setPendingAddTrackId("");
    beatClockRef.current = null;
    setBeatClockBpm(null);
    stopBeatLooper(beatLooperRef);
    setBeatLooperActive(false);
  }, [repository.id]);useEffect(() => {
    saveMonitorPrefs(repository.id, { referencePlaylistIds, selectedGenreId, selectedPresetId });
  }, [repository.id, referencePlaylistIds, selectedGenreId, selectedPresetId]);

  // Keep master gain in sync with the volume slider
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        masterVolume,
        audioContextRef.current?.currentTime ?? 0,
      );
    }
  }, [masterVolume]);

  const ensureAudioReady = useEffectEvent(async (): Promise<AudioContext | null> => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    if (!audioContextRef.current) {
      setAudioStatus("unsupported");
      return null;
    }

    // Create master gain node once, routed: everything → masterGain → analyser → destination
    if (!masterGainRef.current) {
      const gain = audioContextRef.current.createGain();
      gain.gain.value = masterVolume;

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      gain.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      masterGainRef.current = gain;
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      // Double-check — some WebKit builds need a second resume
      if (audioContextRef.current.state !== "running") {
        await audioContextRef.current.resume();
      }
      console.info(`[Maia Audio] context state=${audioContextRef.current.state}, sampleRate=${audioContextRef.current.sampleRate}`);
      setAudioStatus(audioContextRef.current.state === "running" ? "ready" : "error");
      return audioContextRef.current;
    } catch (err) {
      console.error("[Maia Audio] Failed to resume AudioContext", err);
      setAudioStatus("error");
      return null;
    }
  });

  const ensureBackgroundAudio = useEffectEvent(async (context: AudioContext) => {
    if (backgroundAudioRef.current || referencePlaylistIds.length === 0) {
      return;
    }

    const trackId = referencePlaylistIds[0];
    const track = availableTracks.find((t) => t.id === trackId);
    if (!track) return;

    // Use convertFileSrc + fetch instead of readAudioBytes (base64 IPC) to avoid
    // blocking the main thread with a large synchronous atob + charCodeAt loop.
    const audioPath = track.storagePath ?? track.sourcePath;
    const url = isTauri() ? convertFileSrc(audioPath) : null;
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching guide track`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(22000, context.currentTime);
      filterNodeRef.current = filter;

      source.connect(filter);
      filter.connect(masterGainRef.current ?? context.destination);

      source.start(0);
      backgroundAudioRef.current = source;
    } catch (err) {
      setRecentWarnings((c) => [`Failed to start guide track: ${toMessage(err)}`, ...c]);
    }
  });

  const applyLogModulation = useEffectEvent((update: LiveLogStreamUpdate) => {
    const context = audioContextRef.current;
    const filter = filterNodeRef.current;
    if (!context || !filter) return;

    const hasCritical = update.anomalyCount > 0 || (update.levelCounts["ERROR"] ?? 0) > 0;
    if (hasCritical) {
      // "Underwater" effect on error
      filter.frequency.exponentialRampToValueAtTime(350, context.currentTime + 0.1);
      filter.frequency.exponentialRampToValueAtTime(22000, context.currentTime + 1.2);
    }
  });

  const playWithCurrentEngine = useEffectEvent((cues: RoutedLiveCue[], liveBpm?: number | null) => {
    log.info("playWithCurrentEngine cues=%d bpm=%s vol=%s", cues.length, liveBpm, masterVolume);
    if (cues.length === 0) { log.debug("playWithCurrentEngine — skipped (0 cues)"); return; }

    const preset = scene.preset;
    const cappedCues = cues.slice(0, preset.maxCuesPerWindow);

    // Expand each cue into arrangement voices
    const voices = resolveArrangementVoices(cappedCues);
    const voicedCues: RoutedLiveCue[] = voices.map((voice) => ({
      ...voice.cue,
      noteHz: Number((voice.cue.noteHz * voice.noteMultiplier).toFixed(2)),
      gain: Number(Math.min(0.34, Math.max(0.005, voice.cue.gain * voice.gainMultiplier)).toFixed(3)),
      pan: clampPan(voice.cue.pan + voice.panOffset),
    }));

    // ── Primary audio output: render to WAV and play via <audio> element ──
    // WebKitGTK on Linux silently swallows OscillatorNode → destination output,
    // so we render cues to a PCM buffer and play through an HTMLAudioElement.
    const wavBlob = renderCuesToWav(voicedCues, masterVolume);
    if (wavBlob) {
      log.info("WAV blob rendered size=%d voices=%d — playing", wavBlob.size, voicedCues.length);
      playWavBlob(wavBlob);
    } else {
      log.warn("renderCuesToWav returned null for %d voiced cues", voicedCues.length);
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

      for (let i = 0; i < voices.length; i++) {
        const voice = voices[i];
        const cuePriority = cappedCues.indexOf(voice.cue);
        const cueStartAt = firstCueAt + cuePriority * gapSeconds + voice.timeOffsetMs / 1000;
        const voicedCue = voicedCues[i];
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

    startTransition(() => {
      setLastUpdate(update);
      setRecentWarnings(update.warnings.slice(0, MAX_RECENT_WARNINGS));
      setError(null);

      if (!update.hasData) return;

      setEmittedCueCount((current) => current + routedCues.length);
      setRecentCues((current) => [
        ...routedCues.slice().reverse(),
        ...current,
      ].slice(0, MAX_RECENT_CUES));
      setRecentMarkers((current) => [
        ...update.anomalyMarkers.slice().reverse(),
        ...current,
      ].slice(0, MAX_RECENT_MARKERS));
      setRecentVoices(resolveArrangementVoices(routedCues).slice(0, 12));
    });

    if (update.hasData) {
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
    setError(null);
    setIsStarting(true);

    // Prime the AudioContext BEFORE any other async operation so the browser
    // still recognises this as a trusted user gesture. WebKit requires
    // new AudioContext() / resume() to be called during a user interaction.
    const ctx0 = await ensureAudioReady();

    // Play a short confirmation beep via WAV blob (WebAudio destination is
    // unreliable on WebKitGTK / Linux)
    {
      const confirmCue: RoutedLiveCue = {
        id: "confirm", component: "", level: "info", excerpt: "", noteHz: 880,
        durationMs: 200, gain: 0.15, eventIndex: 0, accent: "none",
        waveform: "sine", pan: 0, routeKey: "info", routeLabel: "",
        stemLabel: "", sectionLabel: "", focus: "", samplePath: null, sampleLabel: null,
      };
      const blob = renderCuesToWav([confirmCue], 1.0);
      if (blob) playWavBlob(blob);
    }

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
    } else {
      input = {
        sessionId,
        adapterKind: "file",
        source: repository.sourcePath,
        label: repository.title,
      };
    }

    await monitor.startSession(repository, input);

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
    beatClockRef.current = null;
    setBeatClockBpm(null);
    stopBeatLooper(beatLooperRef);
    setBeatLooperActive(false);

    if (backgroundAudioRef.current) {
      try { backgroundAudioRef.current.stop(); } catch {}
      backgroundAudioRef.current = null;
    }
    filterNodeRef.current = null;

    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
  }

  const currentLevelCounts = lastUpdate?.levelCounts ?? {};

  if (!expanded && !liveEnabled) {
    return (
      <section className="panel live-monitor-cta">
        <div className="live-monitor-cta-content">
          <div>
            <h2>Live log monitor</h2>
            <p className="support-copy">Sonify this log file in real time — maps new log lines to musical cues via Web Audio.</p>
          </div>
          <button type="button" className="action" onClick={() => setExpanded(true)}>
            Set up live session
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Live log monitor</h2>
          <p className="support-copy">
            Polls the log file, maps new lines to musical cues, and plays them with Web Audio.
          </p>
        </div>
        <div className="live-log-toolbar">
          <span className={`live-log-badge ${liveEnabled ? "live" : "idle"}`}>
            {statusLabel(liveEnabled)}
          </span>
          {!liveEnabled ? (
            <>
              <select
                className="compact-select"
                value={selectedGenreId}
                onChange={(e) => setSelectedGenreId(e.target.value)}
                title="Instrumental genre — shapes oscillator palette, pitch register, and dynamics"
              >
                {musicStyleCatalog.musicStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
              <select
                className="compact-select"
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                title="Sequencer preset — controls cue density, gain spread, and scheduling mode"
              >
                <option value="sparse">Sparse</option>
                <option value="balanced">Balanced</option>
                <option value="cascade">Cascade</option>
                <option value="beat-locked">Beat-locked</option>
              </select>
              {availableTracks.length > 0 ? (
                <>
                  <select
                    className="compact-select"
                    value={pendingAddTrackId}
                    onChange={(e) => setPendingAddTrackId(e.target.value)}
                    title="Pick a track to add to the reference playlist"
                  >
                    <option value="">Add reference track…</option>
                    {availableTracks
                      .filter((t) => !referencePlaylistIds.includes(t.id))
                      .map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.title}
                          {track.bpm !== null ? ` · ${track.bpm.toFixed(0)} BPM` : ""}
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
                      setReferencePlaylistIds((ids) =>
                        ids.includes(pendingAddTrackId) ? ids : [...ids, pendingAddTrackId],
                      );
                      setPendingAddTrackId("");
                    }}
                  >
                    + Add
                  </button>
                </>
              ) : null}
              <select
                className="compact-select"
                value={adapterKind}
                onChange={(e) => setAdapterKind(e.target.value as StreamAdapterKind)}
              >
                <option value="file">File tail</option>
                <option value="process">Process stdout</option>
                <option value="websocket">WebSocket</option>
                <option value="http-poll">HTTP poll</option>
              </select>
              {adapterKind === "websocket" ? (
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
              ) : null}
            </>
          ) : null}
          {liveEnabled ? (
            <button type="button" className="secondary-action" onClick={handleStop}>
              Stop live tail
            </button>
          ) : (
            <button type="button" className="action" disabled={isStarting} onClick={() => void handleStart()}>
              {isStarting ? <><span className="spin-ring" aria-hidden="true" /> Starting...</> : "Start live tail"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "8px 16px", background: "rgba(255,0,0,0.1)", border: "1px solid #f44", borderRadius: "4px", margin: "10px", color: "#f44", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {referencePlaylistIds.length > 0 ? (
        <div className="pill-strip top-spaced">
          {referencePlaylistIds.map((id, idx) => {
            const track = availableTracks.find((t) => t.id === id);
            if (!track) {
              return null;
            }
            return (
              <span key={id} className="pill-removable">
                <button
                  type="button"
                  className="pill-reorder"
                  aria-label={`Move ${track.title} up`}
                  disabled={idx === 0}
                  onClick={() =>
                    setReferencePlaylistIds((ids) => {
                      const next = [...ids];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      return next;
                    })
                  }
                >
                  ↑
                </button>
                {track.title}
                {track.bpm !== null ? ` · ${track.bpm.toFixed(0)} BPM` : ""}
                <button
                  type="button"
                  className="pill-reorder"
                  aria-label={`Move ${track.title} down`}
                  disabled={idx === referencePlaylistIds.length - 1}
                  onClick={() =>
                    setReferencePlaylistIds((ids) => {
                      const next = [...ids];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      return next;
                    })
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${track.title} from reference playlist`}
                  onClick={() =>
                    setReferencePlaylistIds((ids) => ids.filter((i) => i !== id))
                  }
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      {!liveEnabled && adapterKind === "process" ? (
        <div className="audio-path-card top-spaced">
          <label htmlFor="process-command">Process command</label>
          <input
            id="process-command"
            type="text"
            placeholder="e.g. tail -f /var/log/syslog"
            value={processCommand}
            onChange={(e) => setProcessCommand(e.target.value)}
          />
        </div>
      ) : null}

      {liveEnabled && monitor.session ? (
        <div className="audio-path-card">
          <span>Session</span>
          <strong>{monitor.session.sessionId}</strong>
          {monitor.session.pollMode === "direct" ? (
            <em> (fallback — direct file poll)</em>
          ) : monitor.session.pollMode === "websocket" ? (
            <em> · WebSocket — {monitor.session.sourcePath}</em>
          ) : monitor.session.pollMode === "http-poll" ? (
            <em> · HTTP poll — {monitor.session.sourcePath}</em>
          ) : null}
        </div>
      ) : null}

      <div className="metric-grid">
        <div>
          <span>Mode</span>
          <strong>
            {adapterKind === "process"
              ? "Process stdout"
              : adapterKind === "websocket"
                ? "WebSocket"
                : adapterKind === "http-poll"
                  ? "HTTP poll"
                  : "File tail"}
          </strong>
        </div>
        <div>
          <span>Audio</span>
          <strong>{audioLabel(audioStatus, liveEnabled)}</strong>
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
          <strong>{monitor.metrics.windowCount}</strong>
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
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          aria-label="Master volume"
        />
        <button
          type="button"
          className="action secondary"
          style={{ marginTop: 8, fontSize: "0.78rem" }}
          onClick={() => {
            // Generate a simple WAV tone and play it via <audio> element
            // This bypasses Web Audio API entirely
            const sampleRate = 44100;
            const duration = 0.5;
            const freq = 440;
            const numSamples = Math.floor(sampleRate * duration);
            const buffer = new ArrayBuffer(44 + numSamples * 2);
            const view = new DataView(buffer);

            // WAV header
            const writeStr = (offset: number, str: string) => {
              for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
            };
            writeStr(0, "RIFF");
            view.setUint32(4, 36 + numSamples * 2, true);
            writeStr(8, "WAVE");
            writeStr(12, "fmt ");
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM
            view.setUint16(22, 1, true); // mono
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true); // 16-bit
            writeStr(36, "data");
            view.setUint32(40, numSamples * 2, true);

            // Generate sine wave samples
            for (let i = 0; i < numSamples; i++) {
              const t = i / sampleRate;
              const envelope = Math.min(1, t * 20) * Math.max(0, 1 - t / duration);
              const sample = Math.sin(2 * Math.PI * freq * t) * 0.5 * envelope;
              view.setInt16(44 + i * 2, sample * 32767, true);
            }

            const blob = new Blob([buffer], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = 1.0;
            audio.play()
              .then(() => console.info("[Maia] WAV test tone playing via <audio> element"))
              .catch((err) => console.error("[Maia] WAV test tone failed:", err))
              .finally(() => setTimeout(() => URL.revokeObjectURL(url), 2000));
          }}
        >
          🔊 Test tone
        </button>
      </div>

      <div className="audio-path-card top-spaced">
        <span>Live source path</span>
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
            accentColor={selectedGenreId === "tropical-house" ? "#ef7f45" : "#21b4b8"}
          />
          <div className={`live-scrolling-wave ${selectedGenreId === "tropical-house" ? "tropical-theme" : ""}`}>
            {recentCues.map((cue, idx) => (
              <div
                key={`${cue.id}-${idx}`}
                className={`live-wave-bar ${cue.routeKey}`}
                style={{
                  "--bar-height": `${Math.max(10, cue.gain * 250)}px`,
                  "--bar-opacity": Math.max(0.2, 1 - idx / MAX_RECENT_CUES),
                } as any}
              />
            ))}
            {recentCues.length === 0 && (
              <div className="live-wave-placeholder">Awaiting system pulse…</div>
            )}
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
