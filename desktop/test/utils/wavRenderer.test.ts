import { describe, expect, it } from "vitest";
import {
  renderCuesToWav,
  renderBounceWav,
  RENDER_SAMPLE_RATE,
  BOUNCE_WINDOW_S,
  MAX_BOUNCE_WINDOWS,
} from "../../src/features/analyzer/components/wavRenderer";
import type { RoutedLiveCue } from "../../src/features/analyzer/components/liveSonificationScene";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCue(overrides: Partial<RoutedLiveCue> = {}): RoutedLiveCue {
  return {
    id: "c-1",
    eventIndex: 0,
    level: "info",
    component: "api",
    excerpt: "",
    noteHz: 440,
    durationMs: 200,
    gain: 0.2,
    waveform: "sine",
    accent: "none",
    pan: 0,
    routeKey: "track-1",
    routeLabel: "track-1",
    stemLabel: "",
    sectionLabel: "",
    focus: "",
    samplePath: null,
    sampleLabel: null,
    ...overrides,
  };
}

// Read the 16-bit PCM data region of a WAV blob synchronously.
async function readPcmSamples(blob: Blob): Promise<Int16Array> {
  const ab = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
  const view = new DataView(ab);
  const numSamples = (ab.byteLength - 44) / 2;
  const out = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    out[i] = view.getInt16(44 + i * 2, true);
  }
  return out;
}

// Read 4-byte ASCII tag at offset.
async function readTag(blob: Blob, offset: number): Promise<string> {
  const ab = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
  const view = new DataView(ab);
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

// ---------------------------------------------------------------------------
// renderCuesToWav
// ---------------------------------------------------------------------------

describe("renderCuesToWav", () => {
  it("returns null for empty cues", () => {
    expect(renderCuesToWav([], 1.0)).toBeNull();
  });

  it("returns a Blob with correct RIFF/WAVE/fmt /data tags", async () => {
    const blob = renderCuesToWav([makeCue()], 1.0);
    expect(blob).not.toBeNull();
    expect(await readTag(blob!, 0)).toBe("RIFF");
    expect(await readTag(blob!, 8)).toBe("WAVE");
    expect(await readTag(blob!, 12)).toBe("fmt ");
    expect(await readTag(blob!, 36)).toBe("data");
  });

  it("blob byte size matches 44-byte header + 16-bit PCM for 600ms window", async () => {
    const blob = renderCuesToWav([makeCue()], 1.0);
    expect(blob).not.toBeNull();
    const expectedSamples = Math.ceil(RENDER_SAMPLE_RATE * BOUNCE_WINDOW_S);
    const expectedBytes = 44 + expectedSamples * 2;
    // allow ±2 bytes from ceil rounding differences
    expect(blob!.size).toBeGreaterThanOrEqual(expectedBytes - 2);
    expect(blob!.size).toBeLessThanOrEqual(expectedBytes + 2);
  });

  it("masterGain=0 produces a near-silent WAV (all samples ≤ 1)", async () => {
    const blob = renderCuesToWav([makeCue()], 0);
    expect(blob).not.toBeNull();
    const samples = await readPcmSamples(blob!);
    const maxAbs = samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
    expect(maxAbs).toBeLessThanOrEqual(1);
  });

  it("non-zero masterGain produces audible signal (at least one sample != 0)", async () => {
    const blob = renderCuesToWav([makeCue()], 1.0);
    expect(blob).not.toBeNull();
    const samples = await readPcmSamples(blob!);
    const hasSignal = samples.some((s) => s !== 0);
    expect(hasSignal).toBe(true);
  });

  it("handles 'square' waveform without throwing", () => {
    expect(() => renderCuesToWav([makeCue({ waveform: "square" })], 0.5)).not.toThrow();
  });

  it("handles 'sawtooth' waveform without throwing", () => {
    expect(() => renderCuesToWav([makeCue({ waveform: "sawtooth" })], 0.5)).not.toThrow();
  });

  it("handles 'triangle' waveform without throwing", () => {
    expect(() => renderCuesToWav([makeCue({ waveform: "triangle" })], 0.5)).not.toThrow();
  });

  it("handles 'sine' waveform explicitly without throwing", () => {
    expect(() => renderCuesToWav([makeCue({ waveform: "sine" })], 0.5)).not.toThrow();
  });

  it("Content-Type is audio/wav", () => {
    const blob = renderCuesToWav([makeCue()], 1.0);
    expect(blob!.type).toBe("audio/wav");
  });
});

// ---------------------------------------------------------------------------
// renderBounceWav
// ---------------------------------------------------------------------------

describe("renderBounceWav", () => {
  it("returns null for empty windows", () => {
    expect(renderBounceWav([], 1.0)).toBeNull();
  });

  it("returns a WAV blob for a single window", () => {
    const blob = renderBounceWav([[makeCue()]], 1.0);
    expect(blob).not.toBeNull();
    expect(blob!.type).toBe("audio/wav");
  });

  it("blob PCM data scales linearly with window count", async () => {
    const oneBlob = renderBounceWav([[makeCue()]], 1.0);
    const twoBlob = renderBounceWav([[makeCue()], [makeCue()]], 1.0);
    expect(oneBlob).not.toBeNull();
    expect(twoBlob).not.toBeNull();
    // PCM region = (blob.size - 44) bytes
    const onePcm = oneBlob!.size - 44;
    const twoPcm = twoBlob!.size - 44;
    expect(twoPcm).toBe(onePcm * 2);
  });

  it("has same RIFF/WAVE/fmt /data structure as single-window render", async () => {
    const blob = renderBounceWav([[makeCue()], [makeCue()]], 1.0);
    expect(blob).not.toBeNull();
    expect(await readTag(blob!, 0)).toBe("RIFF");
    expect(await readTag(blob!, 8)).toBe("WAVE");
    expect(await readTag(blob!, 36)).toBe("data");
  });

  it("Content-Type is audio/wav", () => {
    const blob = renderBounceWav([[makeCue()]], 1.0);
    expect(blob!.type).toBe("audio/wav");
  });

  it("MAX_BOUNCE_WINDOWS constant is 180", () => {
    // Caller slices before passing — the constant itself is correct
    expect(MAX_BOUNCE_WINDOWS).toBe(180);
  });

  it("BOUNCE_WINDOW_S is 0.6 (600ms per window)", () => {
    expect(BOUNCE_WINDOW_S).toBe(0.6);
  });
});
