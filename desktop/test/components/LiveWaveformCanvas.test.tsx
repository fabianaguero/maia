import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  drawLiveWaveformFrameMock,
  resolveLiveWaveformCanvasSizeMock,
  sampleLiveWaveformAnalyserMock,
} = vi.hoisted(() => ({
  drawLiveWaveformFrameMock: vi.fn(),
  resolveLiveWaveformCanvasSizeMock: vi.fn(),
  sampleLiveWaveformAnalyserMock: vi.fn(),
}));

vi.mock("../../src/features/analyzer/components/liveWaveformCanvasRuntime", () => ({
  drawLiveWaveformFrame: drawLiveWaveformFrameMock,
  resolveLiveWaveformCanvasSize: resolveLiveWaveformCanvasSizeMock,
  sampleLiveWaveformAnalyser: sampleLiveWaveformAnalyserMock,
}));

import { LiveWaveformCanvas } from "../../src/features/analyzer/components/LiveWaveformCanvas";

describe("LiveWaveformCanvas", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
  const contextStub = {} as CanvasRenderingContext2D;
  let scheduledFrame: FrameRequestCallback | null;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduledFrame = null;
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    HTMLCanvasElement.prototype.getContext = vi.fn(() => contextStub);
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      scheduledFrame = callback;
      return 42;
    });
    window.cancelAnimationFrame = vi.fn();

    resolveLiveWaveformCanvasSizeMock.mockReturnValue({
      width: 320,
      height: 128,
      dpr: 1,
    });
    sampleLiveWaveformAnalyserMock.mockReturnValue({
      timeData: new Uint8Array([0, 64, 128]),
      freqData: new Uint8Array([16, 32, 48]),
    });
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("renders the canvas shell even when inactive", () => {
    render(
      <LiveWaveformCanvas analyserRef={{ current: null }} active={false} accentColor="#00ffff" />,
    );

    const canvas = document.querySelector("canvas.live-waveform-canvas");
    expect(canvas).toBeInTheDocument();
    expect(screen.queryByText(/canvas/i)).not.toBeInTheDocument();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("samples and draws when active with a live analyser", () => {
    const analyser = {
      frequencyBinCount: 3,
      getByteTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
    } as unknown as AnalyserNode;

    render(
      <LiveWaveformCanvas
        analyserRef={{ current: analyser }}
        active
        accentColor="#ff00aa"
        isAnomaly
      />,
    );

    expect(window.requestAnimationFrame).toHaveBeenCalled();
    scheduledFrame?.(0);
    expect(resolveLiveWaveformCanvasSizeMock).toHaveBeenCalled();
    expect(sampleLiveWaveformAnalyserMock).toHaveBeenCalledWith(analyser);
    expect(drawLiveWaveformFrameMock).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 320,
        height: 128,
        accentColor: "#ff00aa",
        isAnomaly: true,
      }),
    );
  });

  it("cancels the scheduled animation frame on unmount", () => {
    const analyser = {
      frequencyBinCount: 3,
      getByteTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
    } as unknown as AnalyserNode;

    const { unmount } = render(
      <LiveWaveformCanvas analyserRef={{ current: analyser }} active accentColor="#21b4b8" />,
    );

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
  });
});
