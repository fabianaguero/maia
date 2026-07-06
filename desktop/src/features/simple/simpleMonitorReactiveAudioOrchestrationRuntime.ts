import type { BackgroundTrackGraph } from "./simpleMonitorReactiveAudioRuntime";
import type { MonitorCueBatch } from "./monitorCueBatchTypes";

export interface SimpleMonitorToneVoicePlan {
  frequency: number;
  type: OscillatorType;
  startAt: number;
  peakGain: number;
  releaseAt: number;
  stopAt: number;
}

export function hasRunningSimpleMonitorAudioContext(
  context: AudioContext | null | undefined,
): context is AudioContext {
  return Boolean(context && context.state === "running");
}

export function buildSimpleMonitorTestTonePlan(input: {
  masterVolume: number;
  now: number;
}): SimpleMonitorToneVoicePlan[] {
  const accentLevel = Math.max(0.03, Math.min(0.22, input.masterVolume * 0.35));
  const baseStartAt = input.now + 0.02;

  return [164.81, 220, 329.63].map((frequency, index) => {
    const startAt = baseStartAt + index * 0.16;
    return {
      frequency,
      type: index === 2 ? "triangle" : "sawtooth",
      startAt,
      peakGain: accentLevel,
      releaseAt: startAt + 0.22,
      stopAt: startAt + 0.24,
    };
  });
}

export function buildSimpleMonitorCueBatchPlan(input: {
  cues: MonitorCueBatch;
  masterVolume: number;
  hasBackgroundGraph: boolean;
  now: number;
}): SimpleMonitorToneVoicePlan[] {
  return input.cues.slice(0, 2).map((cue, index) => {
    const startAt = input.now + 0.03 + index * 0.05;
    const duration = Math.max(0.12, (cue.durationMs ?? 140) / 1000);
    const peakGain = input.hasBackgroundGraph
      ? Math.max(0.0012, Math.min(0.01, (cue.gain ?? 0.04) * 0.05 * (0.35 + input.masterVolume)))
      : Math.max(0.01, Math.min(0.08, (cue.gain ?? 0.08) * 0.72 * (0.45 + input.masterVolume)));

    return {
      frequency: typeof cue.noteHz === "number" ? cue.noteHz : 180 + index * 30,
      type: cue.waveform ?? (index === 0 ? "triangle" : "sine"),
      startAt,
      peakGain,
      releaseAt: startAt + duration,
      stopAt: startAt + duration + 0.03,
    };
  });
}

export function shouldReuseSimpleMonitorBackgroundGraph(input: {
  existing: BackgroundTrackGraph | null;
  context: AudioContext;
  audio: HTMLAudioElement;
}): boolean {
  return Boolean(
    input.existing &&
    input.existing.context === input.context &&
    input.existing.audio === input.audio,
  );
}
