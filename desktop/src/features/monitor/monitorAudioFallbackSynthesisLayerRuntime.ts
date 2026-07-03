import { RENDER_SAMPLE_RATE } from "./monitorAudioRuntimeTypes";

export function renderFallbackKickLayer(input: {
  mix: Float32Array;
  startSample: number;
  totalSamples: number;
  volume: number;
}) {
  const dur = 0.18;
  const samples = Math.min(
    input.totalSamples - input.startSample,
    Math.ceil(RENDER_SAMPLE_RATE * dur),
  );
  for (let index = 0; index < samples; index++) {
    const tt = index / RENDER_SAMPLE_RATE;
    const freq = 55 + 95 * Math.exp(-tt * 30);
    input.mix[input.startSample + index] +=
      Math.sin(2 * Math.PI * freq * tt) * Math.exp(-tt * 12) * 0.35 * input.volume;
  }
}

export function renderFallbackHatLayer(input: {
  mix: Float32Array;
  startSample: number;
  totalSamples: number;
  volume: number;
}) {
  const dur = 0.04;
  const samples = Math.min(
    input.totalSamples - input.startSample,
    Math.ceil(RENDER_SAMPLE_RATE * dur),
  );
  for (let index = 0; index < samples; index++) {
    const tt = index / RENDER_SAMPLE_RATE;
    input.mix[input.startSample + index] +=
      (Math.random() * 2 - 1) * Math.exp(-tt * 40) * 0.15 * input.volume;
  }
}

export function renderFallbackBassLayer(input: {
  mix: Float32Array;
  startSample: number;
  totalSamples: number;
  volume: number;
  beatSec: number;
  bassFrequency: number;
}) {
  const dur = input.beatSec * 0.8;
  const samples = Math.min(
    input.totalSamples - input.startSample,
    Math.ceil(RENDER_SAMPLE_RATE * dur),
  );
  for (let index = 0; index < samples; index++) {
    const tt = index / RENDER_SAMPLE_RATE;
    const env = tt < 0.01 ? tt / 0.01 : Math.max(0, 1 - (tt - dur * 0.6) / (dur * 0.4));
    input.mix[input.startSample + index] +=
      Math.sin(2 * Math.PI * input.bassFrequency * tt) * env * 0.22 * input.volume;
  }
}

export function renderFallbackMelodyLayer(input: {
  mix: Float32Array;
  startSample: number;
  totalSamples: number;
  volume: number;
  durationSec: number;
  melodyFrequency: number;
}) {
  const samples = Math.min(
    input.totalSamples - input.startSample,
    Math.ceil(RENDER_SAMPLE_RATE * input.durationSec),
  );
  for (let index = 0; index < samples; index++) {
    const tt = index / RENDER_SAMPLE_RATE;
    const env =
      tt < 0.01
        ? tt / 0.01
        : tt < input.durationSec * 0.6
          ? 1
          : Math.max(0, 1 - (tt - input.durationSec * 0.6) / (input.durationSec * 0.4));
    input.mix[input.startSample + index] +=
      Math.sin(2 * Math.PI * input.melodyFrequency * tt) * env * 0.15 * input.volume;
  }
}
