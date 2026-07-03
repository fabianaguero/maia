import type { LiveLogCue } from "../../types/monitor";
import {
  getMonitorSynthesisScale,
  quantizeMonitorFrequency,
} from "./monitorAudioSynthesisScaleRuntime";

export function buildFallbackSynthesisPattern(cues: LiveLogCue[]) {
  const avgGain = cues.reduce((sum, cue) => sum + cue.gain, 0) / cues.length;
  const intensity = Math.min(1, avgGain * 3);
  const rawPool = [...new Set(cues.map((cue) => quantizeMonitorFrequency(cue.noteHz)))];
  const scale = getMonitorSynthesisScale();
  const melodyPool =
    rawPool.length <= 1
      ? scale.slice(0, 4 + Math.floor(intensity * 6))
      : rawPool.sort((left, right) => left - right);
  const bassNote = Math.min(
    ...melodyPool.map((frequency) => quantizeMonitorFrequency(frequency / 2)),
  );
  const melodySteps = intensity > 0.5 ? [0, 4, 8, 12] : [0, 8];

  return {
    intensity,
    melodyPool,
    bassNote,
    melodySteps,
  };
}
