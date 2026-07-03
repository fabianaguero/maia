import type { LiveLogCue } from "../../types/monitor";
import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import { renderMono16BitWav } from "./monitorAudioWavRenderRuntime";

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
  const barSamples = Math.ceil(pcm.sampleRate * duration);
  const cursor = cursorRef.current;

  if (cursor >= pcm.samples.length) {
    return null;
  }

  const remainingSamples = pcm.samples.length - cursor;
  const samplesToRead = Math.min(barSamples, remainingSamples);
  const segment = new Float32Array(barSamples);

  for (let index = 0; index < samplesToRead; index++) {
    segment[index] = pcm.samples[cursor + index];
  }
  for (let index = samplesToRead; index < barSamples; index++) {
    segment[index] = 0;
  }

  cursorRef.current = cursor + samplesToRead;

  const avgGain =
    cues.length > 0 ? cues.reduce((sum, cue) => sum + cue.gain, 0) / cues.length : 0.15;
  const anomalyCount = cues.filter((cue) => cue.accent === "anomaly").length;
  const anomalyRatio = anomalyCount / Math.max(1, cues.length);
  const intensity = Math.min(1, avgGain * 3);
  const masterGain = anomalyRatio > 0.1 ? volume * (0.5 + intensity * 0.5) : volume;
  const filterStrength = anomalyRatio > 0.4 ? 0.1 + anomalyRatio * 0.25 : 0;
  const sixteenthSamples = Math.floor((beatSec / 4) * pcm.sampleRate);

  const mix = new Float32Array(barSamples);
  let lowPassState = 0;

  for (let index = 0; index < barSamples; index++) {
    let sample = segment[index];

    if (filterStrength > 0) {
      lowPassState += filterStrength * (sample - lowPassState);
      sample = sample * (1 - anomalyRatio * 0.85) + lowPassState * (anomalyRatio * 0.85);
    }

    if (anomalyRatio > 0.25) {
      const drive = 1 + anomalyRatio * 1.5;
      sample = Math.tanh(sample * drive) / (drive * 0.9);
    }

    if (anomalyRatio > 0.1) {
      const posInBar = index % (sixteenthSamples * 16);
      const stepInBar = Math.floor(posInBar / sixteenthSamples);
      if (stepInBar === 0 || stepInBar === 8) {
        const duckPhase = (posInBar % (sixteenthSamples * 4)) / sixteenthSamples;
        if (duckPhase < 1) {
          sample *= 0.3 + 0.7 * duckPhase;
        }
      }
    }

    mix[index] = sample * masterGain;
  }

  return renderMono16BitWav(mix, pcm.sampleRate);
}
