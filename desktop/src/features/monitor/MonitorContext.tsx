import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getLogger } from "../../utils/logger";

const log = getLogger("MonitorCtx");

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
import type {
  LiveLogStreamUpdate,
  LiveLogCue,
  RepositoryAnalysis,
  StartSessionInput,
  StreamAdapterKind,
  StreamSessionPollResult,
} from "../../types/library";

const POLL_INTERVAL_MS = 600;
const RENDER_SAMPLE_RATE = 44100;

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
    // Prefer convertFileSrc + fetch (avoids large base64 IPC for big files)
    const url = convertFileSrc(path);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    arrayBuf = await resp.arrayBuffer();
    log.info(`audio file loaded ${arrayBuf.byteLength} bytes, decoding via fetch`);
  } catch (err) {
    // Fallback: read_audio_bytes via IPC (base64)
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
  volume: number,
  bpm?: number | null,
): Blob | null {
  const tempo = bpm && bpm > 0 ? bpm : 120;
  const beatSec = 60 / tempo;
  // Duration to fill the poll interval (~600ms), snapped to beats
  const barDur = Math.min(1.5, Math.max(beatSec, POLL_INTERVAL_MS / 1000));
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

  // 1) Volume envelope: swell based on intensity (0.3–1.0)
  const masterGain = volume * (0.3 + intensity * 0.7);

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
      s = s * (1 - anomRatio * 0.6) + lpState * (anomRatio * 0.6);
    }

    // Sidechain ducking on kick beats
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

function renderSynthFallback(cues: LiveLogCue[], volume: number, bpm?: number | null): Blob | null {
  if (cues.length === 0) return null;
  const tempo = bpm && bpm > 0 ? bpm : 126;
  const beatSec = 60 / tempo;
  const barDur = Math.min(1.2, beatSec * 4);
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

function playWavBlobCtx(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 1.0;
  audio.play().catch(() => {});
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  setTimeout(() => URL.revokeObjectURL(url), 5000);
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
  /**
   * Load a guide track from disk.  Pass null to clear and fall back to synth.
   */
  setGuideTrack: (path: string | null) => void;
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
    sessionId: string,
    label: string,
    sourcePath: string,
  ) => Promise<boolean>;
  /**
   * Register a listener that receives every LiveLogStreamUpdate emitted by the
   * background poll loop.  Returns an unsubscribe function.
   * The listener is called from within a React state-transition context.
   */
  subscribe: (listener: StreamListener) => () => void;
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

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const guideTrackPathRef = useRef<string | null>(null);

  const seekGuideTrack = useCallback((second: number) => {
    if (!guideTrackRef.current) return;
    const targetSample = Math.max(0, Math.floor(second * guideTrackRef.current.sampleRate));
    guideTrackCursorRef.current.current = Math.min(targetSample, guideTrackRef.current.samples.length - 1);
    guideTrackFinishedRef.current = false;  // Allow playback to resume after seek
    log.info(`guide track seek to ${second.toFixed(2)}s (sample ${guideTrackCursorRef.current.current})`);
  }, []);

  const setGuideTrack = useCallback((path: string | null) => {
    // Skip if path hasn't changed
    if (guideTrackPathRef.current === path) {
      return;
    }
    guideTrackPathRef.current = path;

    if (!path) {
      log.info("guide track cleared → synth fallback");
      guideTrackRef.current = null;
      guideTrackCursorRef.current.current = 0;
      guideTrackFinishedRef.current = false;
      setGuideTrackReady(false);
      setGuideTrackPathState(null);
      return;
    }
    log.info(`loading guide track: ${path}`);
    setGuideTrackPathState(path);
    setGuideTrackReady(false);
    guideTrackFinishedRef.current = false;  // Reset finished flag for new track
    decodeAudioFile(path)
      .then((pcm) => {
        guideTrackRef.current = pcm;
        guideTrackCursorRef.current.current = 0;
        setGuideTrackReady(true);
        log.info(`guide track ready: ${pcm.durationSec.toFixed(2)}s, ${pcm.samples.length} samples`);
      })
      .catch((err) => {
        log.error(`failed to decode guide track: ${err instanceof Error ? err.message : String(err)}`);
        setGuideTrackPathState(null);
      });
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

  const emitUpdate = useCallback((update: LiveLogStreamUpdate) => {
    if (update.hasData) {
      log.info("poll hasData=true lines=%d anomalies=%d cues=%d bpm=%s", update.lineCount, update.anomalyCount, update.sonificationCues.length, update.suggestedBpm);
      log.debug("dominantLevel=%s topComponents=%d warnings=%d", update.dominantLevel, update.topComponents.length, update.warnings.length);
      setMetrics((prev) => ({
        windowCount: prev.windowCount + 1,
        processedLines: prev.processedLines + update.lineCount,
        totalAnomalies: prev.totalAnomalies + update.anomalyCount,
      }));

      // Sonify: guide track (real audio) or synth fallback
      if (update.sonificationCues.length > 0 || guideTrackRef.current) {
        log.info("rendering %d cues → first: hz=%d waveform=%s gain=%s dur=%dms", update.sonificationCues.length, update.sonificationCues[0]?.noteHz ?? 0, update.sonificationCues[0]?.waveform ?? "-", update.sonificationCues[0]?.gain ?? 0, update.sonificationCues[0]?.durationMs ?? 0);

        let wav: Blob | null = null;
        if (guideTrackRef.current && !guideTrackFinishedRef.current) {
          // Real audio path: slice bar from guide track, modulated by log data
          wav = sliceGuideTrackBar(
            guideTrackRef.current,
            guideTrackCursorRef.current,
            update.sonificationCues,
            0.8,
            update.suggestedBpm,
          );
          if (wav === null) {
            // Track reached end — stop playback
            guideTrackFinishedRef.current = true;
            log.info("guide track reached end — playback finished");
            stopPolling();
          } else {
            log.info("guide track slice → WAV size=%d bytes", wav.size);
          }
        } else if (!guideTrackFinishedRef.current) {
          // Synth fallback
          wav = renderSynthFallback(update.sonificationCues, 0.8, update.suggestedBpm);
        }

        if (wav) {
          log.info("WAV blob ready size=%d bytes — playing", wav.size);
          playWavBlobCtx(wav);
        } else if (!guideTrackFinishedRef.current) {
          log.warn("WAV render returned null — no audio");
        }
      } else {
        log.debug("poll had data but 0 sonification cues — silent");
      }

      // Persist cursor + stats for stream sessions
      const persisted = sessionRef.current?.persistedSessionId;
      if (persisted) {
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
          warningsJson: JSON.stringify(update.warnings),
        });
      }
    }
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
      log.error("poll error (non-fatal, will retry):", err);
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

      if (input.adapterKind === "websocket") {
        pollMode = "websocket";
        // Register the session in Tauri/Python (supplies the ring buffer)
        try {
          await startStreamSession(input);
        } catch {
          // WS adapter requires Tauri; abort if unavailable
          return false;
        }

        // Open the WebSocket connection — source is the ws:// URL
        const wsUrl = input.wsUrl ?? input.source;
        wsLineBufferRef.current = [];
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const text = typeof event.data === "string" ? event.data : "";
          if (text) {
            wsLineBufferRef.current.push(...text.split("\n").filter(Boolean));
          }
        };
        ws.onerror = () => {
          wsLineBufferRef.current.push("[maia] WebSocket connection error.");
        };
        ws.onclose = () => {
          wsLineBufferRef.current.push("[maia] WebSocket connection closed.");
        };

      } else if (input.adapterKind === "http-poll") {
        pollMode = "http-poll";
        try {
          await startStreamSession(input);
        } catch {
          return false;
        }
        httpUrlRef.current = input.httpUrl ?? input.source;

      } else {
        // File and process adapters: use direct stateless file polling.
        // The Python analyzer runs as a one-shot subprocess per request, so
        // session ring-buffer state is lost between calls. The stateless
        // poll_log_stream path reads and analyses each new chunk independently
        // and is reliable. startStreamSession is intentionally skipped here.
        pollMode = "direct";
      }

      directCursorRef.current = undefined;
      emptyWindowsRef.current = 0;
      pollIndexRef.current = 0;

      const newSession: ActiveMonitorSession = {
        sessionId: input.sessionId,
        persistedSessionId: persistedSessionId ?? null,
        repoId: repo.id,
        repoTitle: repo.title,
        sourcePath: repo.sourcePath,
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
      setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });
      activeRef.current = true;
      log.info("session started id=%s mode=%s adapter=%s path=%s", newSession.sessionId, pollMode, input.adapterKind, repo.sourcePath);
      void doPoll();

      return true;
    },
    [stopPolling, doPoll],
  );

  // -------------------------------------------------------------------------
  // Playback — replay stored session events through the listener pipeline
  // -------------------------------------------------------------------------

  const playbackSession = useCallback(
    async (sessionId: string, label: string, sourcePath: string): Promise<boolean> => {
      log.info("playbackSession id=%s label=%s path=%s", sessionId, label, sourcePath);
      // Stop any existing session first
      if (sessionRef.current) {
        stopPolling();
        sessionRef.current = null;
      }

      const events = await listSessionEvents(sessionId);
      log.info("playbackSession loaded %d events", events.length);
      if (events.length === 0) { log.warn("playbackSession — 0 events, aborting"); return false; }

      const playbackSessionObj: ActiveMonitorSession = {
        sessionId: `playback_${sessionId}`,
        persistedSessionId: sessionId,
        repoId: sessionId,
        repoTitle: label,
        sourcePath,
        adapterKind: "file",
        pollMode: "direct",
        startedAt: Date.now(),
      };

      sessionRef.current = playbackSessionObj;
      setSession(playbackSessionObj);
      setIsPlayback(true);
      setMetrics({ windowCount: 0, processedLines: 0, totalAnomalies: 0 });
      activeRef.current = true;

      // Replay events one by one at POLL_INTERVAL_MS
      let idx = 0;
      const replayNext = () => {
        if (!activeRef.current || idx >= events.length) {
          // Playback finished
          log.info("playback finished after %d events", idx);
          activeRef.current = false;
          return;
        }
        const evt = events[idx++];
        const update: LiveLogStreamUpdate = {
          sourcePath,
          fromOffset: evt.fromOffset,
          toOffset: evt.toOffset,
          hasData: true,
          summary: evt.summary,
          suggestedBpm: evt.suggestedBpm,
          confidence: evt.confidence,
          dominantLevel: evt.dominantLevel,
          lineCount: evt.lineCount,
          anomalyCount: evt.anomalyCount,
          levelCounts: JSON.parse(evt.levelCountsJson),
          anomalyMarkers: JSON.parse(evt.anomalyMarkersJson),
          topComponents: JSON.parse(evt.topComponentsJson),
          sonificationCues: JSON.parse(evt.sonificationCuesJson),
          warnings: JSON.parse(evt.warningsJson),
        };

        log.info("playback event %d/%d lines=%d cues=%d bpm=%s", idx, events.length, update.lineCount, update.sonificationCues.length, update.suggestedBpm);

        // Use emitUpdate so WAV sonification fires
        emitUpdate(update);

        pollTimerRef.current = window.setTimeout(replayNext, POLL_INTERVAL_MS);
      };

      replayNext();
      return true;
    },
    [stopPolling],
  );

  const stopSession = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    const wasPlayback = isPlayback;
    log.info("stopSession id=%s wasPlayback=%s", current?.sessionId, wasPlayback);
    stopPolling();
    sessionRef.current = null;
    directCursorRef.current = undefined;
    emptyWindowsRef.current = 0;
    setSession(null);
    setIsPlayback(false);
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
  }, [stopPolling, isPlayback]);

  const subscribe = useCallback((listener: StreamListener): (() => void) => {
    listenersRef.current.add(listener);
    log.info("subscribe → listeners=%d", listenersRef.current.size);
    return () => {
      listenersRef.current.delete(listener);
      log.info("unsubscribe → listeners=%d", listenersRef.current.size);
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      metrics,
      isPlayback,
      guideTrackReady,
      guideTrackPath,
      setGuideTrack,
      seekGuideTrack,
      startSession,
      stopSession,
      playbackSession,
      subscribe,
    }),
    [
      session,
      metrics,
      isPlayback,
      guideTrackReady,
      guideTrackPath,
      setGuideTrack,
      seekGuideTrack,
      startSession,
      stopSession,
      playbackSession,
      subscribe,
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
