import { describe, expect, it, vi } from "vitest";

import {
  drawLiveWaveformFrame,
  resolveLiveWaveformCanvasSize,
  sampleLiveWaveformAnalyser,
} from "../../src/features/analyzer/components/liveWaveformCanvasRuntime";

function createGradientStub() {
  return {
    addColorStop: vi.fn(),
  };
}

function createContextStub() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => createGradientStub()),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    shadowColor: "",
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe("liveWaveformCanvasRuntime", () => {
  it("normalizes canvas size and resets transform with dpr", () => {
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "offsetWidth", { value: 320, configurable: true });
    Object.defineProperty(canvas, "offsetHeight", { value: 120, configurable: true });
    const context = createContextStub();

    const size = resolveLiveWaveformCanvasSize({ canvas, context, dpr: 2 });

    expect(size).toEqual({ width: 320, height: 120, dpr: 2 });
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(240);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it("samples time and frequency data from the analyser", () => {
    const analyser = {
      frequencyBinCount: 8,
      getByteTimeDomainData: vi.fn((buffer: Uint8Array) => buffer.fill(64)),
      getByteFrequencyData: vi.fn((buffer: Uint8Array) => buffer.fill(128)),
    } as unknown as AnalyserNode;

    const frame = sampleLiveWaveformAnalyser(analyser);

    expect(frame.timeData).toHaveLength(8);
    expect(frame.freqData).toHaveLength(8);
    expect(frame.timeData[0]).toBe(64);
    expect(frame.freqData[0]).toBe(128);
  });

  it("draws a frame without the React component", () => {
    const context = createContextStub();

    drawLiveWaveformFrame({
      context,
      width: 320,
      height: 120,
      accentColor: "#00ffff",
      isAnomaly: true,
      timeData: new Uint8Array(32).fill(128),
      freqData: new Uint8Array(32).fill(200),
    });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 120);
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.createLinearGradient).toHaveBeenCalled();
  });
});
