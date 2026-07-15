import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorDeckScrubInteractionHandlers,
  buildMonitorDeckScrubSeekHandlers,
  buildMonitorDeckScrubWindowHandlers,
} from "../../../src/features/simple/monitorDeckScrubControllerRuntime";

describe("monitorDeckScrubControllerRuntime", () => {
  it("routes window pointer events only for the active scrub pointers", () => {
    const seekTrackFromOverviewViewport = vi.fn();
    const seekTrackFromViewport = vi.fn();
    const refs = {
      isOverviewScrubbingRef: { current: true },
      activeOverviewPointerIdRef: { current: 7 },
      isDeckScrubbingRef: { current: true },
      activeDeckPointerIdRef: { current: 11 },
    };

    const { handlePointerMove, stopScrubbing } = buildMonitorDeckScrubWindowHandlers({
      refs,
      seekTrackFromOverviewViewport,
      seekTrackFromViewport,
    });

    handlePointerMove({ pointerId: 7, clientX: 120 } as PointerEvent);
    handlePointerMove({ pointerId: 11, clientX: 220 } as PointerEvent);
    handlePointerMove({ pointerId: 99, clientX: 300 } as PointerEvent);

    expect(seekTrackFromOverviewViewport).toHaveBeenCalledWith(120);
    expect(seekTrackFromViewport).toHaveBeenCalledWith(220);
    expect(seekTrackFromOverviewViewport).toHaveBeenCalledTimes(1);
    expect(seekTrackFromViewport).toHaveBeenCalledTimes(1);

    stopScrubbing({ pointerId: 7 } as PointerEvent);
    expect(refs.isOverviewScrubbingRef.current).toBe(false);
    expect(refs.activeOverviewPointerIdRef.current).toBeNull();
  });

  it("builds interaction handlers for overview and stage scrubbing", () => {
    const seekToTrackProgress = vi.fn();
    const seekTrackFromOverviewViewport = vi.fn();
    const seekTrackFromViewport = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();
    const refs = {
      overviewCanvasRef: { current: null },
      waveformStageRef: { current: null },
      isOverviewScrubbingRef: { current: false },
      activeOverviewPointerIdRef: { current: null as number | null },
      isDeckScrubbingRef: { current: false },
      activeDeckPointerIdRef: { current: null as number | null },
      deckScrubStartProgressRef: { current: 0 },
      deckScrubStartRatioRef: { current: 0.5 },
    };

    const handlers = buildMonitorDeckScrubInteractionHandlers({
      refs,
      trackWaveProgress: 0.25,
      isConsoleExpanded: false,
      seekToTrackProgress,
      seekTrackFromOverviewViewport,
      seekTrackFromViewport,
      onSelectAnomalyForFocus,
      onToggleConsole,
    });

    const setPointerCapture = vi.fn();

    handlers.handleOverviewPointerDown({
      pointerId: 7,
      clientX: 140,
      currentTarget: { setPointerCapture },
    } as unknown as React.PointerEvent<HTMLDivElement>);
    expect(refs.activeOverviewPointerIdRef.current).toBe(7);
    expect(seekTrackFromOverviewViewport).toHaveBeenCalledWith(140);

    handlers.handleOverviewAnomalyClick({ id: "marker-1", progress: 0.8 }, {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>);
    expect(seekToTrackProgress).toHaveBeenCalledWith(0.8);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-1");
    expect(onToggleConsole).toHaveBeenCalledTimes(1);

    handlers.handleOverviewAnomalyClick(
      { id: "stream-marker", progress: 1, observedAtMs: 120_000 },
      { stopPropagation: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>,
    );
    expect(seekToTrackProgress).toHaveBeenCalledTimes(1);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("stream-marker");

    handlers.handleStagePointerDown({
      pointerId: 11,
      clientX: 210,
      currentTarget: {
        setPointerCapture,
        getBoundingClientRect: () => ({ left: 100, width: 400 }),
      },
    } as unknown as React.PointerEvent<HTMLDivElement>);
    expect(refs.activeDeckPointerIdRef.current).toBe(11);
    expect(seekTrackFromViewport).toHaveBeenCalledWith(210);
  });

  it("builds seek handlers for direct, stage and overview scrubbing", () => {
    const audio = {
      duration: 200,
      currentTime: 0,
    } as HTMLAudioElement;
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();
    const refs = {
      overviewCanvasRef: {
        current: {
          getBoundingClientRect: () => ({ left: 10, width: 200 }) as DOMRect,
        } as HTMLCanvasElement,
      },
      waveformStageRef: {
        current: {
          getBoundingClientRect: () => ({ left: 100, width: 400 }) as DOMRect,
        } as HTMLDivElement,
      },
      deckScrubStartProgressRef: { current: 0.25 },
      deckScrubStartRatioRef: { current: 0.5 },
    };

    const handlers = buildMonitorDeckScrubSeekHandlers({
      refs,
      backgroundAudioRef: { current: audio },
      waveformAnomalies: [
        {
          id: "marker-1",
          lineId: "line-1",
          timestamp: "10:00:00",
          message: "warn",
          severity: 0.7,
          progress: 0.24,
        },
      ],
      isConsoleExpanded: false,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      onSelectAnomalyForFocus,
      onToggleConsole,
    });

    handlers.seekToTrackProgress(0.25);
    expect(audio.currentTime).toBe(50);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-1");
    expect(onToggleConsole).toHaveBeenCalledTimes(1);

    handlers.seekTrackFromOverviewViewport(110);
    expect(setTrackWaveProgress).toHaveBeenCalledWith(0.5);

    handlers.seekTrackFromViewport(320);
    expect(setTrackElapsedSeconds).toHaveBeenCalled();
  });
});
