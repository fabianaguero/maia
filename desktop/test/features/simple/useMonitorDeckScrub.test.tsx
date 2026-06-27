import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMonitorDeckScrub } from "../../../src/features/simple/useMonitorDeckScrub";

describe("useMonitorDeckScrub", () => {
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
      result.current.handleOverviewAnomalyClick(
        { id: "marker-2", progress: 0.7 },
        event,
      );
    });

    expect(audio.currentTime).toBe(70);
    expect(onSelectAnomalyForFocus).toHaveBeenCalledWith("marker-2");
    expect(onToggleConsole).toHaveBeenCalledTimes(1);
  });
});
