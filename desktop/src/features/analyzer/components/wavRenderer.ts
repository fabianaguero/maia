/**
 * WAV-based audio renderer — bypasses WebAudio destination entirely.
 * Renders cues to a PCM buffer, wraps in a WAV blob, plays via <audio>.
 * Needed because WebKitGTK may silently swallow AudioContext.destination output.
 */

import type { RoutedLiveCue } from "./liveSonificationScene";

export const RENDER_SAMPLE_RATE = 44100;

// Fixed window for real-time rendering (one poll interval)
const REALTIME_WINDOW_S = 0.6;

// Full-session bounce constants
export const BOUNCE_WINDOW_S = 0.6; // must match REALTIME_WINDOW_S
export const MAX_BOUNCE_WINDOWS = 180; // 180 × 600ms = 108 seconds max

// ---------------------------------------------------------------------------
// Shared WAV header writer
// ---------------------------------------------------------------------------

function writeWavHeader(view: DataView, numSamples: number): void {
  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, RENDER_SAMPLE_RATE, true);
  view.setUint32(28, RENDER_SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true);   // block align
  view.setUint16(34, 16, true);  // bits per sample
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);
}

// ---------------------------------------------------------------------------
// Cue synthesis — shared between real-time and bounce renders
// ---------------------------------------------------------------------------

function renderCuesToBuffer(
  cues: RoutedLiveCue[],
  buffer: Float32Array,
  bufferOffset: number,
  windowLengthSamples: number,
): void {
  for (let i = 0; i < windowLengthSamples; i++) {
    const t = i / RENDER_SAMPLE_RATE;

    for (const cue of cues) {
      const dur = Math.max(0.08, cue.durationMs / 1000);
      if (t > dur) continue;

      const freq = cue.noteHz;
      const gain = Math.min(0.5, cue.gain);
      const attackEnd = 0.02;
      const releaseStart = dur * 0.7;
      let env = 1;
      if (t < attackEnd) env = t / attackEnd;
      else if (t > releaseStart)
        env = Math.max(0, 1 - (t - releaseStart) / (dur - releaseStart));

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

      buffer[bufferOffset + i] += sample * gain * env;
    }
  }
}

function mixBufferToWav(mixBuffer: Float32Array, masterGain: number): Blob {
  const numSamples = mixBuffer.length;
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);
  writeWavHeader(view, numSamples);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, mixBuffer[i] * masterGain));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }
  return new Blob([wavBuffer], { type: "audio/wav" });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a single poll window (600ms) of cues to a WAV blob for immediate playback.
 */
export function renderCuesToWav(cues: RoutedLiveCue[], masterGain: number): Blob | null {
  if (cues.length === 0) return null;
  const totalSamples = Math.ceil(RENDER_SAMPLE_RATE * REALTIME_WINDOW_S);
  const mixBuffer = new Float32Array(totalSamples);
  renderCuesToBuffer(cues, mixBuffer, 0, totalSamples);
  return mixBufferToWav(mixBuffer, masterGain);
}

/**
 * Render all accumulated poll windows into one long WAV for download (full mix bounce).
 */
export function renderBounceWav(
  windows: RoutedLiveCue[][],
  masterGain: number,
): Blob | null {
  if (windows.length === 0) return null;
  const samplesPerWindow = Math.ceil(RENDER_SAMPLE_RATE * BOUNCE_WINDOW_S);
  const totalSamples = samplesPerWindow * windows.length;
  const mixBuffer = new Float32Array(totalSamples);
  for (let w = 0; w < windows.length; w++) {
    renderCuesToBuffer(windows[w], mixBuffer, w * samplesPerWindow, samplesPerWindow);
  }
  return mixBufferToWav(mixBuffer, masterGain);
}
