import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { MonitorContextValue } from "../../src/features/monitor/monitorContextTypes";

const useMonitorMock = vi.fn<() => MonitorContextValue>();
const runtimeMock = vi.hoisted(() => ({
  appendWaveHistory: vi.fn((history: unknown[]) => history),
  buildHudLinesForUpdate: vi.fn(() => ({ hudLines: [], nextOffset: 0 })),
  buildWaveColumn: vi.fn(() => ({
    source: { low: 0, mid: 0, high: 0 },
    processed: { low: 0, mid: 0, high: 0 },
    anomalyHeat: 0,
    logLine: null,
  })),
  drawMonitorWaveformFrame: vi.fn(() => false),
  resolveProcessedMetrics: vi.fn(() => ({ low: 0, mid: 0, high: 0 })),
  resolveSourceMetrics: vi.fn(() => ({ low: 0, mid: 0, high: 0 })),
  syncMonitorWaveformCanvasSize: vi.fn(() => ({ width: 320, height: 120 })),
}));

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => useMonitorMock(),
}));

vi.mock("../../src/components/monitorWaveformBarRuntime", () => ({
  MONITOR_WAVEFORM_HISTORY_SIZE: 400,
  appendWaveHistory: runtimeMock.appendWaveHistory,
  buildHudLinesForUpdate: runtimeMock.buildHudLinesForUpdate,
  buildWaveColumn: runtimeMock.buildWaveColumn,
  drawMonitorWaveformFrame: runtimeMock.drawMonitorWaveformFrame,
  resolveProcessedMetrics: runtimeMock.resolveProcessedMetrics,
  resolveSourceMetrics: runtimeMock.resolveSourceMetrics,
  syncMonitorWaveformCanvasSize: runtimeMock.syncMonitorWaveformCanvasSize,
}));

import { MonitorWaveformBar } from "../../src/components/MonitorWaveformBar";

function createMonitorValue(overrides: Partial<MonitorContextValue> = {}): MonitorContextValue {
  return {
    session: {
      sessionId: "stream-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "visits-service",
      sourcePath: "/logs/visits-service.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: Date.now(),
    },
    metrics: {
      windowCount: 1,
      processedLines: 0,
      totalAnomalies: 0,
    },
    isPlayback: false,
    guideTrackReady: false,
    guideTrackPath: null,
    playbackProgress: null,
    isPlaybackPaused: false,
    playbackEventIndex: null,
    playbackEventCount: null,
    guideTrackDurationSec: null,
    setGuideTrack: vi.fn(),
    setGuideTrackPlaylist: vi.fn(),
    seekGuideTrack: vi.fn(),
    startSession: vi.fn(),
    attachSession: vi.fn(),
    stopSession: vi.fn(),
    playbackSession: vi.fn(),
    seekPlaybackProgress: vi.fn(),
    seekPlaybackWindow: vi.fn(),
    pausePlayback: vi.fn(),
    resumePlayback: vi.fn(),
    stepPlaybackWindow: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
    audioContext: { state: "running" } as AudioContext,
    resumeAudio: vi.fn(async () => undefined),
    activeTemplate: null,
    setActiveTemplate: vi.fn(),
    ...overrides,
  };
}

function renderBar() {
  return render(
    <I18nContext.Provider value={en}>
      <MonitorWaveformBar tracks={[]} />
    </I18nContext.Provider>,
  );
}

describe("MonitorWaveformBar canvas loop", () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
  let animationCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    useMonitorMock.mockReturnValue(createMonitorValue());
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    animationCallbacks = [];
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ({ canvas: {} }) as unknown as CanvasRenderingContext2D,
    );
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });
    window.cancelAnimationFrame = vi.fn();
    runtimeMock.appendWaveHistory.mockClear();
    runtimeMock.buildHudLinesForUpdate.mockClear();
    runtimeMock.buildWaveColumn.mockClear();
    runtimeMock.drawMonitorWaveformFrame.mockClear();
    runtimeMock.resolveProcessedMetrics.mockClear();
    runtimeMock.resolveSourceMetrics.mockClear();
    runtimeMock.syncMonitorWaveformCanvasSize.mockClear();
    runtimeMock.syncMonitorWaveformCanvasSize.mockReturnValue({ width: 320, height: 120 });
    runtimeMock.drawMonitorWaveformFrame.mockReturnValue(false);
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    cleanup();
    vi.restoreAllMocks();
  });

  it("stops the draw pass when the canvas surface cannot be measured", () => {
    runtimeMock.syncMonitorWaveformCanvasSize.mockReturnValueOnce(null);

    renderBar();

    expect(animationCallbacks).toHaveLength(1);
    animationCallbacks[0](16);

    expect(runtimeMock.syncMonitorWaveformCanvasSize).toHaveBeenCalledTimes(1);
    expect(runtimeMock.drawMonitorWaveformFrame).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("keeps the animation loop alive when no signal is present", () => {
    runtimeMock.drawMonitorWaveformFrame.mockReturnValueOnce(false);

    renderBar();

    animationCallbacks[0](16);

    expect(runtimeMock.drawMonitorWaveformFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 320,
        height: 120,
        history: [],
        guideWaveform: [],
        barWidth: 2,
      }),
    );
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it("keeps the animation loop alive when a signal is drawn and cancels the last frame on unmount", () => {
    runtimeMock.drawMonitorWaveformFrame.mockReturnValueOnce(true);

    const { unmount } = renderBar();

    animationCallbacks[0](16);

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(2);
  });
});
