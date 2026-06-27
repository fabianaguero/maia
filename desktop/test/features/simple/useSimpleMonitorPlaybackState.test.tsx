import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSimpleMonitorPlaybackState } from "../../../src/features/simple/useSimpleMonitorPlaybackState";

describe("useSimpleMonitorPlaybackState", () => {
  it("tracks playback progress and syncs refs", () => {
    const { result, rerender } = renderHook(
      ({ isListening }) =>
        useSimpleMonitorPlaybackState({ isListening }),
      {
        initialProps: {
          isListening: true,
          deckDurationSeconds: 240,
        },
      },
    );

    act(() => {
      result.current.setTrackWaveProgress(0.25);
      result.current.setTrackElapsedSeconds(60);
      result.current.setTrackDurationSeconds(240);
    });

    rerender({
      isListening: true,
      deckDurationSeconds: 320,
    });

    expect(result.current.trackWaveProgress).toBe(0.25);
    expect(result.current.trackElapsedSeconds).toBe(60);
    expect(result.current.trackDurationSeconds).toBe(240);
    expect(result.current.trackWaveProgressRef.current).toBe(0.25);
  });

  it("resets playback state when monitoring stops", () => {
    const { result, rerender } = renderHook(
      ({ isListening }) =>
        useSimpleMonitorPlaybackState({ isListening }),
      {
        initialProps: {
          isListening: true,
          deckDurationSeconds: 240,
        },
      },
    );

    act(() => {
      result.current.setTrackWaveProgress(0.5);
      result.current.setTrackElapsedSeconds(120);
      result.current.setTrackDurationSeconds(240);
    });

    rerender({
      isListening: false,
      deckDurationSeconds: 240,
    });

    expect(result.current.trackWaveProgress).toBe(0);
    expect(result.current.trackElapsedSeconds).toBe(0);
    expect(result.current.trackDurationSeconds).toBeNull();
  });
});
