import { act, renderHook } from "@testing-library/react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMonitorDeckScrub } from "../../../src/features/simple/useMonitorDeckScrub";

describe("useMonitorDeckScrub", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function dispatchPointer(type: string, pointerId: number, clientX: number) {
    const event = new Event(type) as PointerEvent;
    Object.assign(event, { pointerId, clientX });
    window.dispatchEvent(event);
  }

  it("seeks track progress and focuses a nearby anomaly marker", () => {
    const audio = {
      duration: 240,
      currentTime: 0,
    } as HTMLAudioElement;
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();

    const { result } = renderHook(() =>
      useMonitorDeckScrub({
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
        trackWaveProgress: 0.2,
        setTrackWaveProgress,
        setTrackElapsedSeconds,
        isConsoleExpanded: false,
        onToggleConsole,
        onSelectAnomalyForFocus,
      }),
    );

    act(() => {
      result.current.seekToTrackProgress(0.25);
    });

    expect(audio.currentTime).toBe(60);
    expect(setTrackWaveProgress).toHaveBeenCalledWith(0.25);
    expect(setTrackElapsedSeconds).toHaveBeenCalledWith(60);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-1");
    expect(onToggleConsole).toHaveBeenCalledTimes(1);
  });

  it("jumps directly to anomaly progress from overview marker click", () => {
    const audio = {
      duration: 100,
      currentTime: 0,
    } as HTMLAudioElement;
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();

    const { result } = renderHook(() =>
      useMonitorDeckScrub({
        backgroundAudioRef: { current: audio },
        waveformAnomalies: [],
        trackWaveProgress: 0.2,
        setTrackWaveProgress,
        setTrackElapsedSeconds,
        isConsoleExpanded: false,
        onToggleConsole,
        onSelectAnomalyForFocus,
      }),
    );

    const event = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    act(() => {
      result.current.handleOverviewAnomalyClick({ id: "marker-2", progress: 0.7 }, event);
    });

    expect(audio.currentTime).toBe(70);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-2");
    expect(onToggleConsole).toHaveBeenCalledTimes(1);
  });

  it("bails out when no playable background audio is available", () => {
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();

    const { result, rerender } = renderHook(
      ({ current }) =>
        useMonitorDeckScrub({
          backgroundAudioRef: { current },
          waveformAnomalies: [],
          trackWaveProgress: 0.2,
          setTrackWaveProgress,
          setTrackElapsedSeconds,
          isConsoleExpanded: true,
          onSelectAnomalyForFocus,
        }),
      {
        initialProps: { current: null as HTMLAudioElement | null },
      },
    );

    act(() => {
      result.current.seekToTrackProgress(0.5);
    });

    rerender({
      current: {
        duration: Number.NaN,
        currentTime: 12,
      } as HTMLAudioElement,
    });

    act(() => {
      result.current.seekToTrackProgress(0.5);
    });

    rerender({
      current: {
        duration: 0,
        currentTime: 12,
      } as HTMLAudioElement,
    });

    act(() => {
      result.current.seekToTrackProgress(0.5);
    });

    expect(setTrackWaveProgress).not.toHaveBeenCalled();
    expect(setTrackElapsedSeconds).not.toHaveBeenCalled();
    expect(onSelectAnomalyForFocus).not.toHaveBeenCalled();
  });

  it("handles overview scrubbing lifecycle and cleanup", () => {
    const audio = {
      duration: 200,
      currentTime: 0,
    } as HTMLAudioElement;
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { result, unmount } = renderHook(() =>
      useMonitorDeckScrub({
        backgroundAudioRef: { current: audio },
        waveformAnomalies: [
          {
            id: "marker-1",
            lineId: "line-1",
            timestamp: "10:00:00",
            message: "warn",
            severity: 0.7,
            progress: 0.8,
          },
        ],
        trackWaveProgress: 0.2,
        setTrackWaveProgress,
        setTrackElapsedSeconds,
        isConsoleExpanded: true,
        onToggleConsole,
        onSelectAnomalyForFocus,
      }),
    );

    const overviewCanvas = {
      getBoundingClientRect: () => ({
        left: 10,
        width: 200,
      }),
    } as HTMLCanvasElement;

    act(() => {
      result.current.overviewCanvasRef.current = overviewCanvas;
    });

    const setPointerCapture = vi.fn();

    act(() => {
      result.current.handleOverviewPointerDown({
        pointerId: 7,
        clientX: 50,
        currentTarget: { setPointerCapture },
      } as unknown as ReactPointerEvent<HTMLDivElement>);
    });

    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(audio.currentTime).toBe(40);

    act(() => {
      dispatchPointer("pointermove", 7, 170);
    });

    expect(audio.currentTime).toBe(160);
    expect(setTrackWaveProgress).toHaveBeenLastCalledWith(0.8);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-1");
    expect(onToggleConsole).not.toHaveBeenCalled();

    act(() => {
      dispatchPointer("pointerup", 7, 170);
      dispatchPointer("pointermove", 7, 210);
    });

    expect(audio.currentTime).toBe(160);

    unmount();

    expect(addEventListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("pointercancel", expect.any(Function));
  });

  it("handles deck scrubbing and anomaly pointer guards", () => {
    const audio = {
      duration: 100,
      currentTime: 0,
    } as HTMLAudioElement;
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();

    const { result } = renderHook(() =>
      useMonitorDeckScrub({
        backgroundAudioRef: { current: audio },
        waveformAnomalies: [
          {
            id: "marker-near",
            lineId: "line-1",
            timestamp: "10:00:00",
            message: "warn",
            severity: 0.4,
            progress: 0.26,
          },
        ],
        trackWaveProgress: 0.25,
        setTrackWaveProgress,
        setTrackElapsedSeconds,
        isConsoleExpanded: false,
        onToggleConsole,
        onSelectAnomalyForFocus,
      }),
    );

    const stage = {
      getBoundingClientRect: () => ({
        left: 100,
        width: 400,
      }),
    } as HTMLDivElement;

    act(() => {
      result.current.waveformStageRef.current = stage;
    });

    const setPointerCapture = vi.fn();
    const stopPropagation = vi.fn();

    act(() => {
      result.current.handleOverviewAnomalyPointerDown({
        stopPropagation,
      } as unknown as ReactPointerEvent<HTMLButtonElement>);
      result.current.handleStagePointerDown({
        pointerId: 11,
        clientX: 140,
        currentTarget: {
          setPointerCapture,
          getBoundingClientRect: stage.getBoundingClientRect,
        },
      } as unknown as ReactPointerEvent<HTMLDivElement>);
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(setPointerCapture).toHaveBeenCalledWith(11);

    const timeAfterPointerDown = audio.currentTime;

    act(() => {
      dispatchPointer("pointermove", 99, 500);
    });

    expect(audio.currentTime).toBe(timeAfterPointerDown);

    act(() => {
      dispatchPointer("pointermove", 11, 320);
    });

    expect(audio.currentTime).not.toBe(timeAfterPointerDown);

    act(() => {
      dispatchPointer("pointercancel", 11, 320);
      dispatchPointer("pointermove", 11, 500);
    });

    const timeAfterCancel = audio.currentTime;

    act(() => {
      result.current.handleStageClick({
        clientX: 360,
      } as ReactMouseEvent<HTMLDivElement>);
      result.current.handleOverviewClick({
        clientX: 120,
      } as ReactMouseEvent<HTMLDivElement>);
    });

    expect(audio.currentTime).not.toBe(timeAfterCancel);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-near");
    expect(onToggleConsole).toHaveBeenCalled();
  });

  it("does not focus anomalies when the nearest marker is outside the focus threshold", () => {
    const audio = {
      duration: 100,
      currentTime: 0,
    } as HTMLAudioElement;
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const onSelectAnomalyForFocus = vi.fn();

    const { result } = renderHook(() =>
      useMonitorDeckScrub({
        backgroundAudioRef: { current: audio },
        waveformAnomalies: [
          {
            id: "marker-far",
            lineId: "line-1",
            timestamp: "10:00:00",
            message: "info",
            severity: 0.2,
            progress: 0.8,
          },
        ],
        trackWaveProgress: 0.2,
        setTrackWaveProgress,
        setTrackElapsedSeconds,
        isConsoleExpanded: false,
        onToggleConsole: vi.fn(),
        onSelectAnomalyForFocus,
      }),
    );

    act(() => {
      result.current.seekToTrackProgress(0.1);
    });

    expect(audio.currentTime).toBe(10);
    expect(onSelectAnomalyForFocus).not.toHaveBeenCalled();
  });
});
