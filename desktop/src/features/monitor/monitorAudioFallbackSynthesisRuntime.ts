import type { LiveLogCue } from "../../types/monitor";
import { RENDER_SAMPLE_RATE } from "./monitorAudioRuntimeTypes";
import { buildFallbackSynthesisPattern } from "./monitorAudioFallbackSynthesisPatternRuntime";
import {
  renderFallbackBassLayer,
  renderFallbackHatLayer,
  renderFallbackKickLayer,
  renderFallbackMelodyLayer,
} from "./monitorAudioFallbackSynthesisLayerRuntime";
import { renderMono16BitWav } from "./monitorAudioWavRenderRuntime";

export function renderSynthFallback(
  cues: LiveLogCue[],
  duration: number,
  volume: number,
  bpm?: number | null,
): Blob | null {
  if (cues.length === 0) {
    return null;
  }

  const tempo = bpm && bpm > 0 ? bpm : 126;
  const beatSec = 60 / tempo;
  const totalSamples = Math.ceil(RENDER_SAMPLE_RATE * duration);
  const mix = new Float32Array(totalSamples);
  const { melodyPool, bassNote, melodySteps } = buildFallbackSynthesisPattern(cues);

  const sixteenthSec = beatSec / 4;
  const steps = Math.floor(duration / sixteenthSec);

  for (let step = 0; step < steps; step++) {
    const startSample = Math.floor(step * sixteenthSec * RENDER_SAMPLE_RATE);
    if (startSample >= totalSamples) {
      break;
    }

    const beatPos = step % 16;

    if (beatPos === 0 || beatPos === 8) {
      renderFallbackKickLayer({
        mix,
        startSample,
        totalSamples,
        volume,
      });
    }

    if (beatPos === 2 || beatPos === 6 || beatPos === 10 || beatPos === 14) {
      renderFallbackHatLayer({
        mix,
        startSample,
        totalSamples,
        volume,
      });
    }

    if (beatPos === 0 || beatPos === 8) {
      renderFallbackBassLayer({
        mix,
        startSample,
        totalSamples,
        volume,
        beatSec,
        bassFrequency: beatPos === 0 ? bassNote : bassNote * 1.25,
      });
    }

    if (melodySteps.includes(beatPos) && melodyPool.length > 0) {
      const variation = Math.floor(Math.random() * melodyPool.length);
      const melodyFrequency = melodyPool[(step + variation) % melodyPool.length];
      renderFallbackMelodyLayer({
        mix,
        startSample,
        totalSamples,
        volume,
        durationSec: sixteenthSec * 2,
        melodyFrequency,
      });
    }
  }

  return renderMono16BitWav(mix, RENDER_SAMPLE_RATE);
}
