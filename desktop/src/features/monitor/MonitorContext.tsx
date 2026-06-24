import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { invoke } from "../../api/tauri";
import { convertFileSrc } from "@tauri-apps/api/core";

function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  const tauriWindow = window as any;
  return Boolean(tauriWindow.__TAURI_INTERNALS__ || tauriWindow.__TAURI__);
}
import { getLogger } from "../../utils/logger";

const log = getLogger("MonitorCtx");

import {
  SOURCE_TEMPLATES,
  DEFAULT_SOURCE_TEMPLATE_ID,
  resolveSourceTemplate,
  type SourceTemplate,
} from "../../config/sourceTemplates";
import {
  ingestStreamChunk,
  pollLogStream,
  pollStreamSession,
  startStreamSession,
  stopStreamSession,
} from "../../api/repositories";
import {
  updatePersistedSessionCursor,
  updatePersistedSessionStatus,
  insertSessionEvent,
  listSessionEvents,
} from "../../api/sessions";
import type { SessionEvent } from "../../api/sessions";
import type {
  LiveLogStreamUpdate,
  LiveLogCue,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
  StreamSessionPollResult,
} from "../../types/library";
import {
  buildReplayCumulativeMetrics,
  resolveReplayProgressForWindow,
  resolveReplayTargetIndex,
  resolveSteppedReplayIndex,
} from "../../utils/replay";

const POLL_INTERVAL_MS = 600;
const RENDER_SAMPLE_RATE = 44100;
const REPLAY_REBUILD_WINDOW_BYTES = 16 * 1024;
const MAX_REPLAY_REBUILD_WINDOWS = 48;

// ---------------------------------------------------------------------------
// Guide Track Engine — loads a real MP3/audio file and slices bar-length
// segments that are modulated by log-signal data.  Falls back to a minimal
// synthesizer when no guide track is loaded.
// ---------------------------------------------------------------------------

/** Decoded guide track PCM — mono, 44100 Hz */
interface GuideTrackPCM {
  /** Mono PCM samples normalised to -1..1 */
  samples: Float32Array;
  sampleRate: number;
  durationSec: number;
}

/** Cache for decoded audio files to avoid redundant decoding */
const decodedAudioCache = new Map<string, Promise<GuideTrackPCM>>();

/** Attempt to decode audio from a file path using OfflineAudioContext.
 * Results are cached to avoid redundant decoding on repeated calls.
 */
async function decodeAudioFile(path: string): Promise<GuideTrackPCM> {
  // Return cached promise if already decoding/decoded
  if (decodedAudioCache.has(path)) {
    return decodedAudioCache.get(path)!;
  }

  // Create and cache the decoding promise
  const promise = _decodeAudioFileImpl(path);
  decodedAudioCache.set(path, promise);

  // Clean cache on completion to prevent memory leak if file changes
  promise.catch(() => {
    decodedAudioCache.delete(path);
  });

  return promise;
}

/** Internal implementation of audio file decoding */
async function _decodeAudioFileImpl(path: string): Promise<GuideTrackPCM> {
  log.info(`decodeAudioFile path=${path}`);

  let arrayBuf: ArrayBuffer;
  try {
    // Prefer convertFileSrc + fetch (avoids large base64 IPC for big files) - only in Tauri
    if (!isTauri()) throw new Error("convertFileSrc not available in browser");
    const url = convertFileSrc(path);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    arrayBuf = await resp.arrayBuffer();
    log.info(`audio file loaded ${arrayBuf.byteLength} bytes, decoding via fetch`);
  } catch (err) {
    // Fallback: read_audio_bytes via IPC (base64) - only in Tauri
    if (!isTauri()) throw new Error("Audio file not available in browser environment");
    log.info(`convertFileSrc failed, falling back to read_audio_bytes: ${err instanceof Error ? err.message : String(err)}`);
    const b64 = await invoke<string>("read_audio_bytes", { path });
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    arrayBuf = bytes.buffer;
    log.info(`audio file loaded ${arrayBuf.byteLength} bytes via IPC`);
  }

  // Decode to mono at our render sample rate
  const offCtx = new OfflineAudioContext(1, RENDER_SAMPLE_RATE * 600, RENDER_SAMPLE_RATE);
  const audioBuf = await offCtx.decodeAudioData(arrayBuf);

  // Down-mix to mono
  const mono = new Float32Array(audioBuf.length);
  const ch0 = audioBuf.getChannelData(0);
  if (audioBuf.numberOfChannels >= 2) {
    const ch1 = audioBuf.getChannelData(1);
    for (let i = 0; i < mono.length; i++) mono[i] = (ch0[i] + ch1[i]) * 0.5;
  } else {
    mono.set(ch0);
  }

  const durationSec = mono.length / audioBuf.sampleRate;
  log.info(`decoded mono PCM: ${mono.length} samples, ${durationSec.toFixed(2)}s @ ${audioBuf.sampleRate}Hz`);
  return { samples: mono, sampleRate: audioBuf.sampleRate, durationSec };
}

/**
 * Slice a bar from the guide track, apply log-driven modulation, return WAV.
 * The cursor advances each call, looping back to the start when the track ends.
 */
function sliceGuideTrackBar(
  pcm: GuideTrackPCM,
  cursorRef: { current: number },
  cues: LiveLogCue[],
  duration: number,
  bpm: number | null | undefined,
  volume: number,
): Blob | null {
  const tempo = bpm && bpm > 0 ? bpm : 120;
  const beatSec = 60 / tempo;
  // Use requested duration directly
  const barDur = duration;
  const barSamples = Math.ceil(pcm.sampleRate * barDur);

  // Read segment from cursor — stop at end, don't loop
  let cursor = cursorRef.current;

  // If we've reached the end, return null to signal playback complete
  if (cursor >= pcm.samples.length) {
    return null;
  }

  // Read remaining samples (may be less than barSamples if near end)
  const remainingSamples = pcm.samples.length - cursor;
  const samplesToRead = Math.min(barSamples, remainingSamples);

  const segment = new Float32Array(barSamples);
  for (let i = 0; i < samplesToRead; i++) {
    segment[i] = pcm.samples[cursor + i];
  }
  // Pad with silence if we're at the end
  for (let i = samplesToRead; i < barSamples; i++) {
    segment[i] = 0;
  }

  cursorRef.current = cursor + samplesToRead;

  // ----- Log-driven modulation -----
  const avgGain = cues.length > 0
    ? cues.reduce((s, c) => s + c.gain, 0) / cues.length
    : 0.15;
  const anomCount = cues.filter(c => c.accent === "anomaly").length;
  const anomRatio = anomCount / Math.max(1, cues.length);
  const intensity = Math.min(1, avgGain * 3);

  // 1) Master gain: full volume during normal operation, swell during anomalies
  const masterGain = anomRatio > 0.1
    ? volume * (0.5 + intensity * 0.5)  // anomaly mode: swell 0.5–1.0
    : volume;                            // normal: full volume

  // 2) Simple low-pass filter: reduce brightness when anomaly ratio is high
  //    (simulate "underwater" effect). We do a running average.
  const filterStrength = anomRatio > 0.4 ? 0.1 + anomRatio * 0.25 : 0;

  // 3) Rhythmic sidechain: duck volume on kick positions (beats 1 and 3)
  const sixteenthSamples = Math.floor((beatSec / 4) * pcm.sampleRate);

  const mix = new Float32Array(barSamples);
  let lpState = 0;  // low-pass filter state

  for (let i = 0; i < barSamples; i++) {
    let s = segment[i];

    // Low-pass filter (single-pole IIR)
    if (filterStrength > 0) {
      lpState += filterStrength * (s - lpState);
      // Blend between dry and filtered based on anomaly intensity
      s = s * (1 - anomRatio * 0.85) + lpState * (anomRatio * 0.85);
    }

    // Saturation / Distortion for anomalies
    if (anomRatio > 0.25) {
      const drive = 1 + (anomRatio * 1.5);
      // Soft clip to add grit during anomalies
      s = Math.tanh(s * drive) / (drive * 0.9);
    }

    // Sidechain ducking on kick beats (only during anomalies)
    if (anomRatio > 0.1) {
      const posInBar = i % (sixteenthSamples * 16);
      const stepInBar = Math.floor(posInBar / sixteenthSamples);
      if (stepInBar === 0 || stepInBar === 8) {
        const duckPhase = (posInBar % (sixteenthSamples * 4)) / sixteenthSamples;
        if (duckPhase < 1) {
          // Quick duck over 1 sixteenth note
          const duckEnv = 0.3 + 0.7 * (duckPhase);
          s *= duckEnv;
        }
      }
    }

    mix[i] = s * masterGain;
  }

  // Render to WAV (16-bit mono PCM)
  const wavSamples = mix.length;
  const buf = new ArrayBuffer(44 + wavSamples * 2);
  const v = new DataView(buf);
  const ws = (o: number, str: string) => { for (let j = 0; j < str.length; j++) v.setUint8(o + j, str.charCodeAt(j)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + wavSamples * 2, true);
  ws(8, "WAVE"); ws(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, pcm.sampleRate, true); v.setUint32(28, pcm.sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, wavSamples * 2, true);

  for (let i = 0; i < wavSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, mix[i]));
    v.setInt16(44 + i * 2, clamped * 32767, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

// ---------------------------------------------------------------------------
// Fallback synth — minimal musical phrase (kick + melody from cue data)
// Used when no guide track is loaded.
// ---------------------------------------------------------------------------

const SCALE = [220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33, 698.46, 783.99];

function quantize(hz: number): number {
  let best = SCALE[0], bestD = Math.abs(hz - best);
  for (const s of SCALE) { const d = Math.abs(hz - s); if (d < bestD) { bestD = d; best = s; } }
  return best;
}

function renderSynthFallback(cues: LiveLogCue[], duration: number, volume: number, bpm?: number | null): Blob | null {
  if (cues.length === 0) return null;
  const tempo = bpm && bpm > 0 ? bpm : 126;
  const beatSec = 60 / tempo;
  const barDur = duration;
  const totalSamples = Math.ceil(RENDER_SAMPLE_RATE * barDur);
  const mix = new Float32Array(totalSamples);

  const avgGain = cues.reduce((s, c) => s + c.gain, 0) / cues.length;
  const anomRatio = cues.filter(c => c.accent === "anomaly").length / Math.max(1, cues.length);
  const intensity = Math.min(1, avgGain * 3);
  // If all cues have the same freq, generate melodic variation from pentatonic scale
  const rawPool = [...new Set(cues.map(c => quantize(c.noteHz)))];
  const melodyPool = rawPool.length <= 1
    ? SCALE.slice(0, 4 + Math.floor(intensity * 6))  // use pentatonic subset
    : rawPool.sort((a, b) => a - b);
  const bassNote = melodyPool.length > 0 ? Math.min(...melodyPool.map(f => quantize(f / 2))) : 110;

  const sixteenthSec = beatSec / 4;
  const steps = Math.floor(barDur / sixteenthSec);

  for (let step = 0; step < steps; step++) {
    const t = step * sixteenthSec;
    const s = Math.floor(t * RENDER_SAMPLE_RATE);
    if (s >= totalSamples) break;
    const beatPos = step % 16;

    // Kick on 1 and 3
    if (beatPos === 0 || beatPos === 8) {
      const dur = 0.18;
      const samples = Math.min(totalSamples - s, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        const freq = 55 + 95 * Math.exp(-tt * 30);
        mix[s + i] += Math.sin(2 * Math.PI * freq * tt) * Math.exp(-tt * 12) * 0.35 * volume;
      }
    }
    // Hi-hat offbeats
    if (beatPos === 2 || beatPos === 6 || beatPos === 10 || beatPos === 14) {
      const dur = 0.04;
      const samples = Math.min(totalSamples - s, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        mix[s + i] += (Math.random() * 2 - 1) * Math.exp(-tt * 40) * 0.15 * volume;
      }
    }
    // Bass on 1 and 3
    if (beatPos === 0 || beatPos === 8) {
      const bFreq = beatPos === 0 ? bassNote : bassNote * 1.25;
      const dur = beatSec * 0.8;
      const samples = Math.min(totalSamples - s, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        const env = tt < 0.01 ? tt / 0.01 : Math.max(0, 1 - (tt - dur * 0.6) / (dur * 0.4));
        mix[s + i] += Math.sin(2 * Math.PI * bFreq * tt) * env * 0.22 * volume;
      }
    }
    // Melody
    const melSteps = intensity > 0.5 ? [0, 4, 8, 12] : [0, 8];
    if (melSteps.includes(beatPos) && melodyPool.length > 0) {
      // Add variation: use step + a pseudo-random offset so each poll sounds different
      const variation = Math.floor(Math.random() * melodyPool.length);
      const mFreq = melodyPool[(step + variation) % melodyPool.length];
      const dur = sixteenthSec * 2;
      const samples = Math.min(totalSamples - s, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        let env: number;
        if (tt < 0.01) env = tt / 0.01;
        else if (tt < dur * 0.6) env = 1;
        else env = Math.max(0, 1 - (tt - dur * 0.6) / (dur * 0.4));
        mix[s + i] += Math.sin(2 * Math.PI * mFreq * tt) * env * 0.15 * volume;
      }
    }
  }

  const buf = new ArrayBuffer(44 + totalSamples * 2);
  const v = new DataView(buf);
  const ws = (o: number, str: string) => { for (let j = 0; j < str.length; j++) v.setUint8(o + j, str.charCodeAt(j)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + totalSamples * 2, true);
  ws(8, "WAVE"); ws(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RENDER_SAMPLE_RATE, true); v.setUint32(28, RENDER_SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, totalSamples * 2, true);
  for (let i = 0; i < totalSamples; i++) {
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, mix[i])) * 32767, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

// Global registry of active Audio elements to allow cleanup on app close
const activeAudioElements = new Set<HTMLAudioElement>();
const DEFAULT_MONITOR_WAV_VOLUME = 0.4;

// ---------------------------------------------------------------------------
// Crossfade Engine types
// ---------------------------------------------------------------------------

/** Handle to a currently-playing guide track segment, used for crossfade scheduling. */
interface CrossfadeHandle {
  gainNode: GainNode;
  source: AudioBufferSourceNode;
  /** AudioContext time (seconds) when this segment ends. */
  scheduledEndTime: number;
}

function stopAllAudio(): void {
  activeAudioElements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
  });
  activeAudioElements.clear();
}

function stopCrossfadeEngine(
  currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  activeSourcesRef: React.MutableRefObject<AudioBufferSourceNode[]>,
): void {
  const ctx = audioContextRef.current;
  if (!ctx) return;

  // Stop current segment with a quick fade-out
  const current = currentSegmentRef.current;
  if (current && ctx.state === "running") {
    try {
      const now = ctx.currentTime;
      current.gainNode.gain.cancelScheduledValues(now);
      current.gainNode.gain.setValueAtTime(current.gainNode.gain.value, now);
      current.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
      current.source.stop(now + 0.05);
    } catch {
      // Silent fail
    }
  }
  currentSegmentRef.current = null;

  // Stop all tracked sources
  const now = ctx.currentTime;
  activeSourcesRef.current.forEach((source) => {
    try {
      source.stop(now);
    } catch {
      // Silent fail on already-stopped sources
    }
  });
  activeSourcesRef.current = [];
}

async function playWavBlobWithContext(ctx: AudioContext, blob: Blob, volume = DEFAULT_MONITOR_WAV_VOLUME): Promise<void> {
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch { return; }
  }
  if (ctx.state !== "running") {
    log.warn(`[MAIA:Audio] context not running (state=${ctx.state}), skipping playback`);
    return;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    
    // Smooth Gain/Envelope to avoid pops
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(now);
    
    log.trace(`[MAIA:Audio] playing segment dur=${audioBuffer.duration.toFixed(2)}s ctx=${ctx.state} sampleRate=${ctx.sampleRate} vol=${volume.toFixed(2)}`);
  } catch (error) {
    log.error("[MAIA:Audio] Failed to play sonification via context:", error);
  }
}

function createSyntheticReplayEvent(
  sessionId: string,
  pollIndex: number,
  update: LiveLogStreamUpdate,
): SessionEvent {
  return {
    id: -(pollIndex + 1),
    sessionId,
    pollIndex,
    capturedAt: new Date().toISOString(),
    fromOffset: update.fromOffset,
    toOffset: update.toOffset,
    summary: update.summary,
    suggestedBpm: update.suggestedBpm ?? null,
    confidence: update.confidence,
    dominantLevel: update.dominantLevel,
    lineCount: update.lineCount,
    anomalyCount: update.anomalyCount,
    levelCountsJson: JSON.stringify(update.levelCounts),
    anomalyMarkersJson: JSON.stringify(update.anomalyMarkers),
    topComponentsJson: JSON.stringify(update.topComponents),
    sonificationCuesJson: JSON.stringify(update.sonificationCues),
    parsedLinesJson: JSON.stringify(update.parsedLines),
    warningsJson: JSON.stringify(update.warnings),
  };
}

// ---------------------------------------------------------------------------
// Types exposed to consumers
// ---------------------------------------------------------------------------

export interface ActiveMonitorSession {
  sessionId: string;
  /** ID of the PersistedSession row in SQLite — null if not persisted. */
  persistedSessionId: string | null;
  repoId: string;
  repoTitle: string;
  trackName?: string; // New field
  sourcePath: string;
  adapterKind: StreamAdapterKind;
  /** How the poll loop fetches data for this session. */
  pollMode: "session" | "direct" | "websocket" | "http-poll";
  startedAt: number;
}

export interface MonitorMetrics {
  windowCount: number;
  processedLines: number;
  totalAnomalies: number;
}

type StreamListener = (update: LiveLogStreamUpdate) => void;

interface MonitorContextValue {
  /** Currently active session or null when monitoring is stopped. */
  session: ActiveMonitorSession | null;
  /** Accumulated metrics for the active session (reset on each new startSession). */
  metrics: MonitorMetrics;
  /** True when playing back a recorded session (vs live monitoring). */
  isPlayback: boolean;
  /** True when a guide track is loaded and ready for playback. */
  guideTrackReady: boolean;
  /** Path of the currently loaded guide track (null = synth fallback). */
  guideTrackPath: string | null;
  /** Progress of playback session (0-1 when isPlayback=true, null otherwise). */
  playbackProgress: number | null;
  /** True when replay is paused on the current window. */
  isPlaybackPaused: boolean;
  /** 1-based replay window position while playback is active. */
  playbackEventIndex: number | null;
  /** Total replay windows available for the active playback session. */
  playbackEventCount: number | null;
  /** Total duration of guide track in seconds, or null if no track loaded. */
  guideTrackDurationSec: number | null;
  /**
   * Load a guide track from disk.  Pass null to clear and fall back to synth.
   */
  setGuideTrack: (path: string | null) => void;
  /**
   * Load a rotating queue of guide tracks.  Maia advances to the next track
   * whenever the current one reaches the end during live monitoring.
   */
  setGuideTrackPlaylist: (paths: string[]) => void;
  /**
   * Seek the guide track to a specific time (seconds).
   */
  seekGuideTrack: (second: number) => void;
  /**
   * Start a monitoring session.  Delegates to the Tauri stream-session registry
   * when available and falls back to direct-file polling in browser mode.
   * Returns false if both paths fail.
   */
  startSession: (
    repo: RepositoryAnalysis,
    input: StartSessionInput,
    persistedSessionId?: string,
  ) => Promise<boolean>;
  /** Stop the active session and clear all state. */
  stopSession: () => Promise<void>;
  /**
   * Play back a previously recorded session by replaying its stored events
   * through the same listener pipeline at 600ms intervals.
   */
  playbackSession: (
    input: {
      sessionId: string;
      label: string;
      sourcePath: string;
      repoId?: string | null;
    },
  ) => Promise<boolean>;
  /** Jump to a percentage within the active replay timeline. */
  seekPlaybackProgress: (progress: number) => void;
  /** Jump to a specific 1-based replay window within the active replay timeline. */
  seekPlaybackWindow: (replayWindowIndex: number) => void;
  /** Pause the active replay without losing current position. */
  pausePlayback: () => void;
  /** Resume the active replay from the current position. */
  resumePlayback: () => void;
  /** Move one replay window backward/forward and pause there. */
  stepPlaybackWindow: (direction: -1 | 1) => void;
  /**
   * background poll loop.  Returns an unsubscribe function.
   * The listener is called from within a React state-transition context.
   */
  subscribe: (listener: StreamListener) => () => void;
  /** Access to the real-time AudioContext for state monitoring and manual resume. */
  audioContext: AudioContext | null;
  /** Explicitly resume the audio context (required on first user interaction). */
  resumeAudio: () => Promise<void>;
  /** Currently active source template (never null — defaults to DEFAULT_SOURCE_TEMPLATE_ID). */
  activeTemplate: SourceTemplate;
  /** Switch the active source template mid-session (takes effect on next poll). */
  setActiveTemplate: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Context plumbing
// ---------------------------------------------------------------------------

const MonitorCtx = createContext<MonitorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveMonitorSession | null>(null);
  const [isPlayback, setIsPlayback] = useState(false);
  const [metrics, setMetrics] = useState<MonitorMetrics>({
    windowCount: 0,
    processedLines: 0,
    totalAnomalies: 0,
  });
  const [guideTrackReady, setGuideTrackReady] = useState(false);
  const [guideTrackPath, setGuideTrackPathState] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number | null>(null);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [playbackEventIndex, setPlaybackEventIndex] = useState<number | null>(null);
  const [playbackEventCount, setPlaybackEventCount] = useState<number | null>(null);
  const [guideTrackDurationSec, setGuideTrackDurationSec] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Refs that survive across re-renders without causing them
  const pollTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<ActiveMonitorSession | null>(null);
  const listenersRef = useRef<Set<StreamListener>>(new Set());
  const activeRef = useRef(false);
  /** Decoded guide track PCM data */
  const guideTrackRef = useRef<GuideTrackPCM | null>(null);
  /** Playback cursor into the guide track (sample offset) */
  const guideTrackCursorRef = useRef<{ current: number }>({ current: 0 });
  /** Flag to prevent playback loops after track reaches end */
  const guideTrackFinishedRef = useRef(false);
  /** Direct-mode cursor (browser fallback path only). */
  const directCursorRef = useRef<number | undefined>(undefined);
  /** Cached replay event list for playback + scrubbing. */
  const replayEventsRef = useRef<SessionEvent[]>([]);
  /** Prefix-sum metrics for replay windows. */
  const replayMetricsRef = useRef<MonitorMetrics[]>([
    { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
  ]);
  /** Next replay event index to emit. */
  const replayIndexRef = useRef(0);
  /** True while replay windows are being reconstructed from the source file. */
  const replayHydratingRef = useRef(false);
  /** Monotonic token used to ignore stale async replay hydration results. */
  const replayHydrationTokenRef = useRef(0);
  /** Mirror of playback pause state for callbacks/timers. */
  const playbackPausedRef = useRef(false);
  /** Consecutive empty-window count for direct mode — reset cursor after N to loop static files. */
  const emptyWindowsRef = useRef(0);
  /** WebSocket instance for the "websocket" poll mode. */
  const wsRef = useRef<WebSocket | null>(null);
  /** Lines received from the WS not yet ingested into the ring buffer. */
  const wsLineBufferRef = useRef<string[]>([]);
  /** URL for the "http-poll" poll mode. */
  const httpUrlRef = useRef<string>("");
  /** Poll counter for recording session events. */
  const pollIndexRef = useRef<number>(0);
  /** Mirror of playback state for callbacks that should not close over stale state. */
  const isPlaybackRef = useRef(false);

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const guideTrackPathRef = useRef<string | null>(null);
  const guideTrackQueueRef = useRef<string[]>([]);
  const guideTrackQueueIndexRef = useRef(0);
  const guideTrackLoadPromiseRef = useRef<Promise<void> | null>(null);

  /** Currently-playing guide track segment handle for crossfade scheduling. */
  const currentSegmentRef = useRef<CrossfadeHandle | null>(null);
  /** Decoded AudioBuffer waiting to play once AudioContext resumes. */
  const pendingSegmentRef = useRef<AudioBuffer | null>(null);
  /** List of all active audio sources for cleanup on stop. */
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  /** Active source template — read on every poll, never causes re-renders. */
  const activeTemplateRef = useRef<SourceTemplate>(resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID));

  const [activeTemplate, setActiveTemplateState] = useState<SourceTemplate>(() => resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID));

  const setActiveTemplate = useCallback((id: string) => {
    const resolved = resolveSourceTemplate(id);
    activeTemplateRef.current = resolved;
    setActiveTemplateState(resolved);
    log.info("setActiveTemplate id=%s → bpm=%d", id, resolved.bpm);
  }, []);

  const seekGuideTrack = useCallback((second: number) => {
    if (!guideTrackRef.current) return;
    const targetSample = Math.max(0, Math.floor(second * guideTrackRef.current.sampleRate));
    guideTrackCursorRef.current.current = Math.min(targetSample, guideTrackRef.current.samples.length - 1);
    guideTrackFinishedRef.current = false;  // Allow playback to resume after seek
    log.info(`guide track seek to ${second.toFixed(2)}s (sample ${guideTrackCursorRef.current.current})`);
  }, []);

  const loadGuideTrackPath = useCallback((path: string | null) => {
    // Skip if path hasn't changed AND the track is already loaded or loading
    if (guideTrackPathRef.current === path && (guideTrackRef.current !== null || guideTrackLoadPromiseRef.current !== null)) {
      return;
    }
    guideTrackPathRef.current = path;

    if (!path) {
      log.info("guide track cleared → synth fallback");
      // Fade out any currently-playing guide track segment before switching to synth
      const ctx = audioContextRef.current;
      const outgoing = currentSegmentRef.current;
      if (outgoing && ctx && ctx.state === "running") {
        outgoing.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      }
      currentSegmentRef.current = null;
      guideTrackRef.current = null;
      guideTrackCursorRef.current.current = 0;
      guideTrackFinishedRef.current = false;
      guideTrackLoadPromiseRef.current = null;
      setGuideTrackReady(false);
      setGuideTrackPathState(null);
      setGuideTrackDurationSec(null);
      return;
    }
    log.info(`loading guide track: ${path}`);
    setGuideTrackPathState(path);
    setGuideTrackReady(false);
    guideTrackRef.current = null;
    guideTrackCursorRef.current.current = 0;
    guideTrackFinishedRef.current = false;  // Reset finished flag for new track
    const requestedPath = path;
    const loadPromise = decodeAudioFile(path)
      .then((pcm) => {
        // Accept the result if this path is still current OR if no other path has taken over
        if (guideTrackPathRef.current !== requestedPath) {
          log.info(`guide track load superseded (wanted=${requestedPath}, current=${guideTrackPathRef.current}) — ignoring`);
          return;
        }
        guideTrackRef.current = pcm;
        guideTrackCursorRef.current.current = 0;
        setGuideTrackDurationSec(pcm.durationSec);
        setGuideTrackReady(true);
        log.info(`guide track ready: ${pcm.durationSec.toFixed(2)}s, ${pcm.samples.length} samples`);
      })
      .catch((err) => {
        if (guideTrackPathRef.current !== requestedPath) {
          return;
        }
        log.error(`failed to decode guide track: ${err instanceof Error ? err.message : String(err)}`);
        guideTrackPathRef.current = null;
        guideTrackRef.current = null;
        guideTrackCursorRef.current.current = 0;
        guideTrackFinishedRef.current = false;
        setGuideTrackPathState(null);
        setGuideTrackReady(false);
        setGuideTrackDurationSec(null);
      });
    guideTrackLoadPromiseRef.current = loadPromise;
  }, []);

  const setGuideTrack = useCallback((path: string | null) => {
    guideTrackQueueRef.current = path ? [path] : [];
    guideTrackQueueIndexRef.current = 0;
    loadGuideTrackPath(path);
  }, [loadGuideTrackPath]);

  const setGuideTrackPlaylist = useCallback((paths: string[]) => {
    const queue = paths
      .map((path) => path.trim())
      .filter((path, index, all) => path.length > 0 && all.indexOf(path) === index);

    guideTrackQueueRef.current = queue;
    guideTrackQueueIndexRef.current = 0;
    loadGuideTrackPath(queue[0] ?? null);
  }, [loadGuideTrackPath]);

  const advanceGuideTrack = useCallback((): boolean => {
    const queue = guideTrackQueueRef.current;
    if (queue.length === 0) {
      return false;
    }

    const nextIndex =
      queue.length === 1
        ? 0
        : (guideTrackQueueIndexRef.current + 1) % queue.length;
    guideTrackQueueIndexRef.current = nextIndex;
    loadGuideTrackPath(queue[nextIndex] ?? null);
    return Boolean(queue[nextIndex]);
  }, [loadGuideTrackPath]);

  /**
   * Schedule a guide track WAV blob for playback with crossfade.
   * Overlaps with the previous segment by 20 ms and applies 120 ms linear gain ramps.
   */
  const scheduleCrossfade = useCallback(async (ctx: AudioContext, blob: Blob, volume: number): Promise<void> => {
    let audioBuffer: AudioBuffer;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      log.error("[MAIA:Crossfade] Failed to decode audio blob:", err);
      return;
    }

    // If context is suspended, store buffer and attempt resume
    if (ctx.state === "suspended") {
      pendingSegmentRef.current = audioBuffer;
      try {
        await ctx.resume();
        // On successful resume, play the pending buffer immediately
        const pending = pendingSegmentRef.current;
        if (pending) {
          pendingSegmentRef.current = null;
          await scheduleCrossfade(ctx, new Blob([new ArrayBuffer(0)], { type: "audio/wav" }), volume);
          // Play pending directly since we already decoded it
          const gainNode = ctx.createGain();
          const source = ctx.createBufferSource();
          source.buffer = pending;
          const now = ctx.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(volume, now + 0.12);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          source.start(now);
          currentSegmentRef.current = { gainNode, source, scheduledEndTime: now + pending.duration };
        }
      } catch (err) {
        log.warn("[MAIA:Crossfade] Failed to resume AudioContext:", err);
        pendingSegmentRef.current = null;
      }
      return;
    }

    if (ctx.state !== "running") {
      log.warn(`[MAIA:Crossfade] context not running (state=${ctx.state}), skipping`);
      return;
    }

    const now = ctx.currentTime;
    let startTime = now;

    // Fade out outgoing segment and schedule incoming to overlap by 20 ms
    const outgoing = currentSegmentRef.current;
    if (outgoing) {
      outgoing.gainNode.gain.linearRampToValueAtTime(0, now + 0.12);
      startTime = Math.max(now, outgoing.scheduledEndTime - 0.020);
    }

    // Create incoming gain node with fade-in ramp
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.12);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(startTime);

    activeSourcesRef.current.push(source);
    // Cleanup old sources periodically to prevent leaks
    if (activeSourcesRef.current.length > 10) {
      activeSourcesRef.current = activeSourcesRef.current.slice(-5);
    }

    currentSegmentRef.current = {
      gainNode,
      source,
      scheduledEndTime: startTime + audioBuffer.duration,
    };

    log.trace(`[MAIA:Crossfade] scheduled start=${startTime.toFixed(3)}s dur=${audioBuffer.duration.toFixed(2)}s vol=${volume.toFixed(2)}`);
  }, []);

  const stopPolling = useCallback(() => {
    activeRef.current = false;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    // Close any open WebSocket
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
    }
    wsLineBufferRef.current = [];
    httpUrlRef.current = "";
  }, []);

  const schedulePoll = useCallback(
    (doPoll: () => Promise<void>) => {
      if (!activeRef.current) return;
      pollTimerRef.current = window.setTimeout(() => {
        void doPoll();
      }, POLL_INTERVAL_MS);
    },
    [],
  );

  const resetReplayTelemetry = useCallback(() => {
    replayEventsRef.current = [];
    replayMetricsRef.current = [{ windowCount: 0, processedLines: 0, totalAnomalies: 0 }];
    replayIndexRef.current = 0;
    replayHydratingRef.current = false;
    replayHydrationTokenRef.current += 1;
    playbackPausedRef.current = false;
    setPlaybackProgress(null);
    setIsPlaybackPaused(false);
    setPlaybackEventIndex(null);
    setPlaybackEventCount(null);
  }, []);

  const syncReplayTelemetry = useCallback((processedEvents: number) => {
    const total = replayEventsRef.current.length;
    const clampedProcessed = Math.max(0, Math.min(processedEvents, total));

    setPlaybackEventCount(total > 0 ? total : null);
    setPlaybackEventIndex(total > 0 ? clampedProcessed : null);
    setPlaybackProgress(total > 0 ? clampedProcessed / total : null);
    setMetrics(
      replayMetricsRef.current[clampedProcessed] ?? {
        windowCount: 0,
        processedLines: 0,
        totalAnomalies: 0,
      },
    );
  }, []);

  const buildReplayUpdate = useCallback(
    (
      event: SessionEvent,
      sourcePath: string,
      replayWindowIndex?: number | null,
    ): LiveLogStreamUpdate => ({
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
    }),
    [],
  );

  const syncGuideTrackToReplayProgress = useCallback((progress: number) => {
    const pcm = guideTrackRef.current;
    if (!pcm) {
      return;
    }

    const clamped = Math.max(0, Math.min(1, progress));
    guideTrackCursorRef.current.current = Math.max(
      0,
      Math.min(pcm.samples.length - 1, Math.floor(clamped * pcm.samples.length)),
    );
    guideTrackFinishedRef.current = false;
  }, []);

  const emitUpdate = useCallback((update: LiveLogStreamUpdate, options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  }) => {
    const accumulateMetrics = options?.accumulateMetrics ?? true;
    const persistPlaybackEvent = options?.persistPlaybackEvent ?? true;

    if (update.hasData) {
      const ctx = audioContextRef.current;
      if (ctx && ctx.state === "suspended") {
        void ctx.resume();
      }
      log.info("poll hasData=true lines=%d anomalies=%d cues=%d bpm=%s", update.lineCount, update.anomalyCount, update.sonificationCues.length, update.suggestedBpm);
      log.debug("dominantLevel=%s topComponents=%d warnings=%d", update.dominantLevel, update.topComponents.length, update.warnings.length);
      if (accumulateMetrics) {
        setMetrics((prev) => ({
          windowCount: prev.windowCount + 1,
          processedLines: prev.processedLines + update.lineCount,
          totalAnomalies: prev.totalAnomalies + update.anomalyCount,
        }));
      }

      // Persist cursor + stats for stream sessions
      const persisted = sessionRef.current?.persistedSessionId;
      if (persisted && persistPlaybackEvent) {
        void updatePersistedSessionCursor(
          persisted,
          update.toOffset,
          update.lineCount,
          update.anomalyCount,
          update.suggestedBpm ?? null,
        );

        // Record event for playback
        const idx = pollIndexRef.current++;
        void insertSessionEvent({
          sessionId: persisted,
          pollIndex: idx,
          fromOffset: update.fromOffset,
          toOffset: update.toOffset,
          summary: update.summary,
          suggestedBpm: update.suggestedBpm ?? null,
          confidence: update.confidence,
          dominantLevel: update.dominantLevel,
          lineCount: update.lineCount,
          anomalyCount: update.anomalyCount,
          levelCountsJson: JSON.stringify(update.levelCounts),
          anomalyMarkersJson: JSON.stringify(update.anomalyMarkers),
          topComponentsJson: JSON.stringify(update.topComponents),
          sonificationCuesJson: JSON.stringify(update.sonificationCues),
          parsedLinesJson: JSON.stringify(update.parsedLines),
          warningsJson: JSON.stringify(update.warnings),
        });
      }
    }

    // Live audio output is owned by the analyzer monitor panel.
    // MonitorContext now behaves as a transport/session layer only, so it
    // dispatches updates without producing a second competing sound engine.

    log.trace("dispatching to %d listeners", listenersRef.current.size);
    for (const listener of listenersRef.current) {
      listener(update);
    }
  }, []);

  // Map a StreamSessionPollResult to the LiveLogStreamUpdate shape expected by listeners
  const mapPollResult = useCallback(
    (result: StreamSessionPollResult, sourcePath: string): LiveLogStreamUpdate => ({
      sourcePath,
      fromOffset: result.session.fileCursor ?? 0,
      toOffset: result.session.fileCursor ?? 0,
      hasData: result.hasData,
      summary: result.summary,
      suggestedBpm: result.suggestedBpm,
      confidence: result.confidence,
      dominantLevel: result.dominantLevel,
      lineCount: result.lineCount,
      anomalyCount: result.anomalyCount,
      levelCounts: result.levelCounts,
      anomalyMarkers: result.anomalyMarkers,
      topComponents: result.topComponents,
      sonificationCues: result.sonificationCues,
      parsedLines: result.parsedLines,
      warnings: result.warnings,
    }),
    [],
  );

  // -------------------------------------------------------------------------
  // Poll loop — defined with useCallback so it's stable but always reads live
  // refs.  Self-scheduling via schedulePoll keeps the loop alive indefinitely
  // until stopPolling() is called.
  // -------------------------------------------------------------------------

  const doPoll = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || !activeRef.current) {
      log.trace("doPoll skipped — no active session");
      return;
    }

    log.trace("doPoll mode=%s id=%s", current.pollMode, current.sessionId);

    try {
      let update: LiveLogStreamUpdate;

      if (current.pollMode === "session") {
        log.trace("doPoll \u2192 pollStreamSession(%s)", current.sessionId);
        const result = await pollStreamSession(current.sessionId);
        if (!activeRef.current) return;
        update = mapPollResult(result, current.sourcePath);

      } else if (current.pollMode === "direct") {
        // Stateless file-tail poll
        log.trace("doPoll → pollLogStream(%s, cursor=%s)", current.sourcePath, directCursorRef.current);
        update = await pollLogStream(current.sourcePath, directCursorRef.current);
        if (!activeRef.current) return;
        directCursorRef.current = update.toOffset;
        if (update.hasData) {
          log.debug("direct poll → hasData lines=%d cues=%d offset=%d", update.lineCount, update.sonificationCues.length, update.toOffset);
          emptyWindowsRef.current = 0;
        } else {
          emptyWindowsRef.current += 1;
          log.trace("direct poll → empty (%d consecutive)", emptyWindowsRef.current);
          if (emptyWindowsRef.current >= 3) {
            directCursorRef.current = undefined;
            emptyWindowsRef.current = 0;
            log.debug("direct poll → reset cursor (3 empty windows)");
          }
        }

      } else if (current.pollMode === "websocket") {
        // Drain lines that arrived via WebSocket since last poll
        const lines = wsLineBufferRef.current.splice(0);
        const chunk = lines.join("\n");
        const result = await ingestStreamChunk(current.sessionId, chunk);
        if (!activeRef.current) return;
        update = mapPollResult(result, current.sourcePath);

      } else {
        // "http-poll": fetch the configured URL, treat response body as log text
        const url = httpUrlRef.current;
        const resp = await fetch(url);
        const text = await resp.text();
        if (!activeRef.current) return;
        const result = await ingestStreamChunk(current.sessionId, text);
        if (!activeRef.current) return;
        update = mapPollResult(result, current.sourcePath);
      }

      emitUpdate(update);
    } catch (err) {
      const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      log.error("poll error (non-fatal, will retry): " + msg);
    } finally {
      schedulePoll(doPoll);
    }
  }, [emitUpdate, mapPollResult, schedulePoll]);

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  const startSession = useCallback(
    async (repo: RepositoryAnalysis, input: StartSessionInput, persistedSessionId?: string): Promise<boolean> => {
      log.info("startSession id=%s adapter=%s source=%s persistedId=%s", input.sessionId, input.adapterKind, input.source, persistedSessionId);
      if (input.adapterKind !== "file") {
        throw new Error(
          "Week 1 MVP only supports file-backed log monitoring. Use an imported log file as the live source.",
        );
      }

      // Stop any existing session first
      if (sessionRef.current) {
        const prevId = sessionRef.current.sessionId;
        log.info("startSession — stopping previous session id=%s", prevId);
        stopPolling();
        sessionRef.current = null;
        setSession(null);
        try {
          await stopStreamSession(prevId);
        } catch {
          // best-effort
        }
      }

      let pollMode: "session" | "direct" | "websocket" | "http-poll" = "session";

      try {
        await startStreamSession(input);
        pollMode = "session";
      } catch {
        // Browser/demo fallback keeps the legacy direct file-tail path.
        pollMode = "direct";
      }

      directCursorRef.current =
        input.adapterKind === "file" && input.startFromBeginning ? 0 : undefined;
      emptyWindowsRef.current = 0;
      pollIndexRef.current = 0;

      // Initialize active template from session input
      activeTemplateRef.current = resolveSourceTemplate(input.sourceTemplateId ?? null);
      setActiveTemplateState(activeTemplateRef.current);

      const newSession: ActiveMonitorSession = {
        sessionId: input.sessionId,
        persistedSessionId: persistedSessionId ?? null,
        repoId: repo.id,
        repoTitle: repo.title,
        trackName: input.trackTitle || "Dynamic Track",
        sourcePath: input.source,
        adapterKind: input.adapterKind,
        pollMode,
        startedAt: Date.now(),
      };

      // Mark persisted session as active
      if (persistedSessionId) {
        void updatePersistedSessionStatus(persistedSessionId, "active");
      }

      sessionRef.current = newSession;
      setSession(newSession);
      setIsPlayback(false);
      isPlaybackRef.current = false;
      resetReplayTelemetry();
      setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });
      activeRef.current = true;
      log.info("session started id=%s mode=%s adapter=%s path=%s", newSession.sessionId, pollMode, input.adapterKind, newSession.sourcePath);
      
      // Initialize or resume AudioContext on startSession (user gesture)
      let currentCtx = audioContextRef.current;
      if (!currentCtx) {
        currentCtx = new AudioContext();
        audioContextRef.current = currentCtx;
        setAudioContext(currentCtx);
      }
      if (currentCtx.state === "suspended") {
        await currentCtx.resume();
      }
      log.info(`[MAIA:Audio] startSession ctx state=${currentCtx.state} sampleRate=${currentCtx.sampleRate}`);
      // Confirm audio output is alive with a short inaudible-ish click
      if (currentCtx.state === "running") {
        const osc = currentCtx.createOscillator();
        const g = currentCtx.createGain();
        g.gain.setValueAtTime(0.12, currentCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, currentCtx.currentTime + 0.25);
        osc.frequency.value = 528;
        osc.connect(g);
        g.connect(currentCtx.destination);
        osc.start(currentCtx.currentTime);
        osc.stop(currentCtx.currentTime + 0.25);
        log.info("[MAIA:Audio] start-tone fired");
      }

      // If a guide track path is queued but not loaded yet, force reload
      const pendingPath = guideTrackQueueRef.current[guideTrackQueueIndexRef.current] ?? null;
      if (pendingPath && !guideTrackRef.current) {
        log.info(`[MAIA:Audio] guide track pending on session start, forcing reload: ${pendingPath}`);
        guideTrackPathRef.current = null; // reset so loadGuideTrackPath doesn't skip
        loadGuideTrackPath(pendingPath);
      }

      void doPoll();

      return true;
    },
    [stopPolling, doPoll, resetReplayTelemetry, loadGuideTrackPath],
  );

  // -------------------------------------------------------------------------
  // Playback — replay stored session events through the listener pipeline
  // -------------------------------------------------------------------------

  const dispatchReplayEventAtIndex = useCallback(
    (eventIndex: number, options?: { syncGuideTrack?: boolean }) => {
      const events = replayEventsRef.current;
      if (events.length === 0) {
        return false;
      }

      const clampedIndex = Math.max(0, Math.min(eventIndex, events.length - 1));
      const event = events[clampedIndex]!;
      replayIndexRef.current = clampedIndex + 1;

      if (options?.syncGuideTrack) {
        syncGuideTrackToReplayProgress(
          events.length > 1 ? clampedIndex / events.length : 0,
        );
      }

      syncReplayTelemetry(clampedIndex + 1);
      emitUpdate(
        buildReplayUpdate(
          event,
          sessionRef.current?.sourcePath ?? event.sessionId,
          clampedIndex + 1,
        ),
        {
        accumulateMetrics: false,
        persistPlaybackEvent: false,
        },
      );

      return true;
    },
    [buildReplayUpdate, emitUpdate, syncGuideTrackToReplayProgress, syncReplayTelemetry],
  );

  const replayTick = useCallback(() => {
    if (!activeRef.current || playbackPausedRef.current) {
      return;
    }

    const events = replayEventsRef.current;
    const idx = replayIndexRef.current;

    if (idx >= events.length) {
      if (replayHydratingRef.current) {
        pollTimerRef.current = window.setTimeout(replayTick, 200);
        return;
      }
      log.info("playback reached end after %d events — stopping replay", idx);
      activeRef.current = false;
      playbackPausedRef.current = true;
      setIsPlaybackPaused(true);
      syncReplayTelemetry(events.length);
      stopAllAudio();
      return;
    }

    const ok = dispatchReplayEventAtIndex(idx);
    if (!ok) {
      activeRef.current = false;
      return;
    }

    log.info("playback event %d/%d", idx + 1, events.length);
    pollTimerRef.current = window.setTimeout(replayTick, POLL_INTERVAL_MS);
  }, [dispatchReplayEventAtIndex, syncReplayTelemetry]);

  const rebuildReplayEventsFromSource = useCallback(
    async (sessionId: string, sourcePath: string): Promise<SessionEvent[]> => {
      log.info(
        "rebuildReplayEventsFromSource session=%s path=%s windowBytes=%d",
        sessionId,
        sourcePath,
        REPLAY_REBUILD_WINDOW_BYTES,
      );

      const rebuiltEvents: SessionEvent[] = [];
      let cursor = 0;

      for (let index = 0; index < MAX_REPLAY_REBUILD_WINDOWS; index++) {
        const update = await pollLogStream(
          sourcePath,
          cursor,
          REPLAY_REBUILD_WINDOW_BYTES,
        );

        if (!update.hasData || update.toOffset <= cursor) {
          break;
        }

        rebuiltEvents.push(createSyntheticReplayEvent(sessionId, index, update));
        cursor = update.toOffset;
      }

      log.info(
        "rebuildReplayEventsFromSource session=%s rebuilt=%d",
        sessionId,
        rebuiltEvents.length,
      );
      return rebuiltEvents;
    },
    [],
  );

  const playbackSession = useCallback(
    async ({
      sessionId,
      label,
      sourcePath,
      repoId,
    }: {
      sessionId: string;
      label: string;
      sourcePath: string;
      repoId?: string | null;
    }): Promise<boolean> => {
      log.info("playbackSession id=%s label=%s path=%s repoId=%s", sessionId, label, sourcePath, repoId);
      // Stop any existing session first
      if (sessionRef.current) {
        stopPolling();
        sessionRef.current = null;
      }

      const events = await listSessionEvents(sessionId);
      log.info("playbackSession loaded %d stored events", events.length);
      const shouldHydrateReplay = events.length <= 1 && Boolean(sourcePath);

      if (events.length === 0 && !shouldHydrateReplay) {
        log.warn("playbackSession — 0 events, aborting");
        return false;
      }

      const playbackSessionObj: ActiveMonitorSession = {
        sessionId: `playback_${sessionId}`,
        persistedSessionId: sessionId,
        repoId: repoId ?? sessionId,
        repoTitle: label,
        sourcePath,
        adapterKind: "file",
        pollMode: "direct",
        startedAt: Date.now(),
      };

      sessionRef.current = playbackSessionObj;
      setSession(playbackSessionObj);
      setIsPlayback(true);
      isPlaybackRef.current = true;
      playbackPausedRef.current = false;
      setIsPlaybackPaused(false);
      replayEventsRef.current = events;
      replayMetricsRef.current = buildReplayCumulativeMetrics(events);
      replayIndexRef.current = 0;
      const hydrationToken = replayHydrationTokenRef.current + 1;
      replayHydrationTokenRef.current = hydrationToken;
      replayHydratingRef.current = shouldHydrateReplay;
      syncReplayTelemetry(0);
      setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });
      activeRef.current = true;

      let currentCtx = audioContextRef.current;
      if (!currentCtx) {
        currentCtx = new AudioContext();
        audioContextRef.current = currentCtx;
        setAudioContext(currentCtx);
      }
      if (currentCtx.state === "suspended") {
        await currentCtx.resume();
      }

      const shouldWaitForGuideTrack =
        (Boolean(guideTrackPathRef.current) || guideTrackQueueRef.current.length > 0) &&
        !guideTrackRef.current &&
        Boolean(guideTrackLoadPromiseRef.current);
      if (shouldWaitForGuideTrack) {
        log.info("playbackSession waiting for guide track decode before replay");
        await guideTrackLoadPromiseRef.current;
      }

      replayTick();

      if (shouldHydrateReplay) {
        void (async () => {
          try {
            const rebuiltEvents = await rebuildReplayEventsFromSource(
              sessionId,
              sourcePath,
            );
            if (
              replayHydrationTokenRef.current !== hydrationToken ||
              sessionRef.current?.persistedSessionId !== sessionId
            ) {
              return;
            }

            if (rebuiltEvents.length > replayEventsRef.current.length) {
              replayEventsRef.current = rebuiltEvents;
              replayMetricsRef.current = buildReplayCumulativeMetrics(rebuiltEvents);
              syncReplayTelemetry(
                Math.min(replayIndexRef.current, rebuiltEvents.length),
              );
              log.info(
                "playbackSession rebuilt replay windows from source → %d events",
                rebuiltEvents.length,
              );
            }
          } catch (error) {
            if (replayHydrationTokenRef.current !== hydrationToken) {
              return;
            }
            log.warn(
              "playbackSession replay rebuild failed: %s",
              error instanceof Error ? error.message : String(error),
            );
          } finally {
            if (replayHydrationTokenRef.current !== hydrationToken) {
              return;
            }
            replayHydratingRef.current = false;
            if (
              activeRef.current &&
              !playbackPausedRef.current &&
              pollTimerRef.current === null
            ) {
              pollTimerRef.current = window.setTimeout(replayTick, 0);
            }
          }
        })();
      }

      return true;
    },
    [rebuildReplayEventsFromSource, stopPolling, replayTick, syncReplayTelemetry],
  );

  const seekPlaybackProgress = useCallback((progress: number) => {
    if (!isPlayback || replayEventsRef.current.length === 0) {
      return;
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const targetIndex = resolveReplayTargetIndex(progress, replayEventsRef.current.length);
    activeRef.current = true;
    guideTrackFinishedRef.current = false;
    const ok = dispatchReplayEventAtIndex(targetIndex, { syncGuideTrack: true });
    if (!ok) {
      return;
    }

    if (activeRef.current && !playbackPausedRef.current) {
      pollTimerRef.current = window.setTimeout(replayTick, POLL_INTERVAL_MS);
    }
  }, [dispatchReplayEventAtIndex, isPlayback, replayTick]);

  const seekPlaybackWindow = useCallback((replayWindowIndex: number) => {
    if (!isPlayback || replayEventsRef.current.length === 0) {
      return;
    }

    seekPlaybackProgress(
      resolveReplayProgressForWindow(
        replayWindowIndex,
        replayEventsRef.current.length,
      ),
    );
  }, [isPlayback, seekPlaybackProgress]);

  const pausePlayback = useCallback(() => {
    if (!isPlayback) {
      return;
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    playbackPausedRef.current = true;
    activeRef.current = false;
    setIsPlaybackPaused(true);
  }, [isPlayback]);

  const resumePlayback = useCallback(() => {
    if (!isPlayback || replayEventsRef.current.length === 0) {
      return;
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (replayIndexRef.current >= replayEventsRef.current.length) {
      guideTrackFinishedRef.current = false;
      const ok = dispatchReplayEventAtIndex(0, { syncGuideTrack: true });
      if (!ok) {
        playbackPausedRef.current = true;
        activeRef.current = false;
        setIsPlaybackPaused(true);
        return;
      }
    }

    playbackPausedRef.current = false;
    activeRef.current = true;
    setIsPlaybackPaused(false);
    pollTimerRef.current = window.setTimeout(replayTick, POLL_INTERVAL_MS);
  }, [dispatchReplayEventAtIndex, isPlayback, replayTick]);

  const stepPlaybackWindow = useCallback((direction: -1 | 1) => {
    if (!isPlayback || replayEventsRef.current.length === 0) {
      return;
    }

    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    playbackPausedRef.current = true;
    activeRef.current = false;
    setIsPlaybackPaused(true);
    guideTrackFinishedRef.current = false;

    const targetIndex = resolveSteppedReplayIndex(
      replayIndexRef.current,
      replayEventsRef.current.length,
      direction,
    );
    void dispatchReplayEventAtIndex(targetIndex, { syncGuideTrack: true });
  }, [dispatchReplayEventAtIndex, isPlayback]);

  const stopSession = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    const wasPlayback = isPlayback;
    log.info("stopSession id=%s wasPlayback=%s", current?.sessionId, wasPlayback);

    // Stop all audio playback immediately (HTML Audio elements + Web Audio API)
    stopAllAudio();
    stopCrossfadeEngine(currentSegmentRef, audioContextRef, activeSourcesRef);
    if (audioContextRef.current && audioContextRef.current.state === "running") {
      void audioContextRef.current.suspend();
    }

    stopPolling();
    sessionRef.current = null;
    directCursorRef.current = undefined;
    emptyWindowsRef.current = 0;
    setSession(null);
    setIsPlayback(false);
    isPlaybackRef.current = false;
    resetReplayTelemetry();
    setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });

    // During playback we don't touch persisted status or stream sessions
    if (wasPlayback) return;

    // Mark persisted session as paused (not deleted — user can resume later)
    if (current?.persistedSessionId) {
      void updatePersistedSessionStatus(current.persistedSessionId, "paused");
    }

    if (current?.pollMode === "session" || current?.pollMode === "websocket" || current?.pollMode === "http-poll") {
      try {
        await stopStreamSession(current.sessionId);
      } catch {
        // best-effort
      }
    }
  }, [stopPolling, isPlayback, resetReplayTelemetry]);

  const subscribe = useCallback((listener: StreamListener): (() => void) => {
    listenersRef.current.add(listener);
    log.info("subscribe → listeners=%d", listenersRef.current.size);
    return () => {
      listenersRef.current.delete(listener);
      log.info("unsubscribe → listeners=%d", listenersRef.current.size);
    };
  }, []);

  const resumeAudio = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === "suspended") {
      log.info("resuming audio context manually");
      await ctx.resume();
    } else if (!ctx) {
      log.info("creating new audio context on manual resume");
      const nextCtx = new AudioContext();
      audioContextRef.current = nextCtx;
      setAudioContext(nextCtx);
      await nextCtx.resume();
    }
    // Sanity-check: play a short silent-ish beep to confirm the audio pipeline is alive
    const activeCtx = audioContextRef.current;
    if (activeCtx && activeCtx.state === "running") {
      log.info(`[MAIA:Audio] context running — sampleRate=${activeCtx.sampleRate} state=${activeCtx.state}`);
      const osc = activeCtx.createOscillator();
      const g = activeCtx.createGain();
      g.gain.setValueAtTime(0.15, activeCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, activeCtx.currentTime + 0.3);
      osc.frequency.value = 440;
      osc.connect(g);
      g.connect(activeCtx.destination);
      osc.start(activeCtx.currentTime);
      osc.stop(activeCtx.currentTime + 0.3);
    } else {
      log.warn(`[MAIA:Audio] context NOT running after resume — state=${activeCtx?.state ?? "null"}`);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      metrics,
      isPlayback,
      isPlaybackPaused,
      guideTrackReady,
      guideTrackPath,
      setGuideTrack,
      setGuideTrackPlaylist,
      seekGuideTrack,
      startSession,
      stopSession,
      playbackSession,
      seekPlaybackProgress,
      seekPlaybackWindow,
      pausePlayback,
      resumePlayback,
      stepPlaybackWindow,
      subscribe,
      playbackProgress,
      playbackEventIndex,
      playbackEventCount,
      guideTrackDurationSec,
      audioContext,
      resumeAudio,
      activeTemplate,
      setActiveTemplate,
    }),
    [
      session,
      metrics,
      isPlayback,
      isPlaybackPaused,
      guideTrackReady,
      guideTrackPath,
      setGuideTrack,
      setGuideTrackPlaylist,
      seekGuideTrack,
      startSession,
      stopSession,
      playbackSession,
      seekPlaybackProgress,
      seekPlaybackWindow,
      pausePlayback,
      resumePlayback,
      stepPlaybackWindow,
      subscribe,
      playbackProgress,
      playbackEventIndex,
      playbackEventCount,
      guideTrackDurationSec,
      audioContext,
      resumeAudio,
      activeTemplate,
      setActiveTemplate,
    ],
  );

  return (
    <MonitorCtx.Provider value={value}>
      {children}
    </MonitorCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useMonitor(): MonitorContextValue {
  const ctx = useContext(MonitorCtx);
  if (!ctx) {
    throw new Error("useMonitor must be called inside <MonitorProvider>");
  }
  return ctx;
}
