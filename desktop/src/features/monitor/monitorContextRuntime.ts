import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogCue, LiveLogStreamUpdate } from "../../types/monitor";

export const RENDER_SAMPLE_RATE = 44100;
export const DEFAULT_MONITOR_WAV_VOLUME = 0.4;

export interface GuideTrackPCM {
  samples: Float32Array;
  sampleRate: number;
  durationSec: number;
}

export interface CrossfadeHandle {
  gainNode: GainNode;
  source: AudioBufferSourceNode;
  scheduledEndTime: number;
}

export interface MonitorAudioRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}

const SCALE = [220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33, 698.46, 783.99];
const activeAudioElements = new Set<HTMLAudioElement>();

export function registerActiveAudioElement(audio: HTMLAudioElement): void {
  activeAudioElements.add(audio);
}

export function unregisterActiveAudioElement(audio: HTMLAudioElement): void {
  activeAudioElements.delete(audio);
}

export function sliceGuideTrackBar(
  pcm: GuideTrackPCM,
  cursorRef: { current: number },
  cues: LiveLogCue[],
  duration: number,
  bpm: number | null | undefined,
  volume: number,
): Blob | null {
  const tempo = bpm && bpm > 0 ? bpm : 120;
  const beatSec = 60 / tempo;
  const barDur = duration;
  const barSamples = Math.ceil(pcm.sampleRate * barDur);
  const cursor = cursorRef.current;

  if (cursor >= pcm.samples.length) {
    return null;
  }

  const remainingSamples = pcm.samples.length - cursor;
  const samplesToRead = Math.min(barSamples, remainingSamples);

  const segment = new Float32Array(barSamples);
  for (let i = 0; i < samplesToRead; i++) {
    segment[i] = pcm.samples[cursor + i];
  }
  for (let i = samplesToRead; i < barSamples; i++) {
    segment[i] = 0;
  }

  cursorRef.current = cursor + samplesToRead;

  const avgGain = cues.length > 0 ? cues.reduce((s, c) => s + c.gain, 0) / cues.length : 0.15;
  const anomCount = cues.filter((c) => c.accent === "anomaly").length;
  const anomRatio = anomCount / Math.max(1, cues.length);
  const intensity = Math.min(1, avgGain * 3);
  const masterGain = anomRatio > 0.1 ? volume * (0.5 + intensity * 0.5) : volume;
  const filterStrength = anomRatio > 0.4 ? 0.1 + anomRatio * 0.25 : 0;
  const sixteenthSamples = Math.floor((beatSec / 4) * pcm.sampleRate);

  const mix = new Float32Array(barSamples);
  let lpState = 0;

  for (let i = 0; i < barSamples; i++) {
    let s = segment[i];

    if (filterStrength > 0) {
      lpState += filterStrength * (s - lpState);
      s = s * (1 - anomRatio * 0.85) + lpState * (anomRatio * 0.85);
    }

    if (anomRatio > 0.25) {
      const drive = 1 + anomRatio * 1.5;
      s = Math.tanh(s * drive) / (drive * 0.9);
    }

    if (anomRatio > 0.1) {
      const posInBar = i % (sixteenthSamples * 16);
      const stepInBar = Math.floor(posInBar / sixteenthSamples);
      if (stepInBar === 0 || stepInBar === 8) {
        const duckPhase = (posInBar % (sixteenthSamples * 4)) / sixteenthSamples;
        if (duckPhase < 1) {
          const duckEnv = 0.3 + 0.7 * duckPhase;
          s *= duckEnv;
        }
      }
    }

    mix[i] = s * masterGain;
  }

  return renderMono16BitWav(mix, pcm.sampleRate);
}

export function quantizeMonitorFrequency(hz: number): number {
  let best = SCALE[0];
  let bestD = Math.abs(hz - best);
  for (const s of SCALE) {
    const d = Math.abs(hz - s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function renderSynthFallback(
  cues: LiveLogCue[],
  duration: number,
  volume: number,
  bpm?: number | null,
): Blob | null {
  if (cues.length === 0) return null;
  const tempo = bpm && bpm > 0 ? bpm : 126;
  const beatSec = 60 / tempo;
  const barDur = duration;
  const totalSamples = Math.ceil(RENDER_SAMPLE_RATE * barDur);
  const mix = new Float32Array(totalSamples);

  const avgGain = cues.reduce((s, c) => s + c.gain, 0) / cues.length;
  const intensity = Math.min(1, avgGain * 3);
  const rawPool = [...new Set(cues.map((c) => quantizeMonitorFrequency(c.noteHz)))];
  const melodyPool =
    rawPool.length <= 1
      ? SCALE.slice(0, 4 + Math.floor(intensity * 6))
      : rawPool.sort((a, b) => a - b);
  const bassNote =
    melodyPool.length > 0
      ? Math.min(...melodyPool.map((f) => quantizeMonitorFrequency(f / 2)))
      : 110;

  const sixteenthSec = beatSec / 4;
  const steps = Math.floor(barDur / sixteenthSec);

  for (let step = 0; step < steps; step++) {
    const t = step * sixteenthSec;
    const startSample = Math.floor(t * RENDER_SAMPLE_RATE);
    if (startSample >= totalSamples) break;
    const beatPos = step % 16;

    if (beatPos === 0 || beatPos === 8) {
      const dur = 0.18;
      const samples = Math.min(totalSamples - startSample, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        const freq = 55 + 95 * Math.exp(-tt * 30);
        mix[startSample + i] +=
          Math.sin(2 * Math.PI * freq * tt) * Math.exp(-tt * 12) * 0.35 * volume;
      }
    }

    if (beatPos === 2 || beatPos === 6 || beatPos === 10 || beatPos === 14) {
      const dur = 0.04;
      const samples = Math.min(totalSamples - startSample, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        mix[startSample + i] += (Math.random() * 2 - 1) * Math.exp(-tt * 40) * 0.15 * volume;
      }
    }

    if (beatPos === 0 || beatPos === 8) {
      const bFreq = beatPos === 0 ? bassNote : bassNote * 1.25;
      const dur = beatSec * 0.8;
      const samples = Math.min(totalSamples - startSample, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        const env = tt < 0.01 ? tt / 0.01 : Math.max(0, 1 - (tt - dur * 0.6) / (dur * 0.4));
        mix[startSample + i] += Math.sin(2 * Math.PI * bFreq * tt) * env * 0.22 * volume;
      }
    }

    const melSteps = intensity > 0.5 ? [0, 4, 8, 12] : [0, 8];
    if (melSteps.includes(beatPos) && melodyPool.length > 0) {
      const variation = Math.floor(Math.random() * melodyPool.length);
      const mFreq = melodyPool[(step + variation) % melodyPool.length];
      const dur = sixteenthSec * 2;
      const samples = Math.min(totalSamples - startSample, Math.ceil(RENDER_SAMPLE_RATE * dur));
      for (let i = 0; i < samples; i++) {
        const tt = i / RENDER_SAMPLE_RATE;
        const env =
          tt < 0.01
            ? tt / 0.01
            : tt < dur * 0.6
              ? 1
              : Math.max(0, 1 - (tt - dur * 0.6) / (dur * 0.4));
        mix[startSample + i] += Math.sin(2 * Math.PI * mFreq * tt) * env * 0.15 * volume;
      }
    }
  }

  return renderMono16BitWav(mix, RENDER_SAMPLE_RATE);
}

function renderMono16BitWav(samples: Float32Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const ws = (o: number, str: string) => {
    for (let j = 0; j < str.length; j++) v.setUint8(o + j, str.charCodeAt(j));
  };
  ws(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, clamped * 32767, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

export function stopAllMonitorAudio(): void {
  activeAudioElements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
  });
  activeAudioElements.clear();
}

export function stopCrossfadeEngine(
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>,
  audioContextRef: MutableRefObject<AudioContext | null>,
  activeSourcesRef: MutableRefObject<AudioBufferSourceNode[]>,
): void {
  const ctx = audioContextRef.current;
  if (!ctx) return;

  const current = currentSegmentRef.current;
  if (current && ctx.state === "running") {
    try {
      const now = ctx.currentTime;
      current.gainNode.gain.cancelScheduledValues(now);
      current.gainNode.gain.setValueAtTime(current.gainNode.gain.value, now);
      current.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
      current.source.stop(now + 0.05);
    } catch {
      // ignore
    }
  }
  currentSegmentRef.current = null;

  const now = ctx.currentTime;
  activeSourcesRef.current.forEach((source) => {
    try {
      source.stop(now);
    } catch {
      // ignore
    }
  });
  activeSourcesRef.current = [];
}

export async function ensureMonitorAudioContext(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  setAudioContext: (context: AudioContext) => void;
  logger?: MonitorAudioRuntimeLogger;
  createAudioContext?: () => AudioContext;
  reason?: string;
}): Promise<AudioContext> {
  let currentCtx = input.audioContextRef.current;
  if (!currentCtx) {
    if (input.logger && input.reason === "manual-resume") {
      input.logger.info("creating new audio context on manual resume");
    }
    currentCtx = (input.createAudioContext ?? (() => new AudioContext()))();
    input.audioContextRef.current = currentCtx;
    input.setAudioContext(currentCtx);
  }

  if (currentCtx.state === "suspended") {
    if (input.logger && input.reason === "manual-resume") {
      input.logger.info("resuming audio context manually");
    }
    await currentCtx.resume();
  }

  return currentCtx;
}

export function emitMonitorAudioProbe(input: {
  context: AudioContext;
  frequency: number;
  attackGain: number;
  releaseTimeSec: number;
}): void {
  if (input.context.state !== "running") {
    return;
  }

  const oscillator = input.context.createOscillator();
  const gainNode = input.context.createGain();
  gainNode.gain.setValueAtTime(input.attackGain, input.context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    input.context.currentTime + input.releaseTimeSec,
  );
  oscillator.frequency.value = input.frequency;
  oscillator.connect(gainNode);
  gainNode.connect(input.context.destination);
  oscillator.start(input.context.currentTime);
  oscillator.stop(input.context.currentTime + input.releaseTimeSec);
}

export function createSyntheticReplayEvent(
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
