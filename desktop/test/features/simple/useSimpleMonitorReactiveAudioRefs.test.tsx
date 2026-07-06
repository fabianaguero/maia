import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { useSimpleMonitorReactiveAudioRefs } from "../../../src/features/simple/useSimpleMonitorReactiveAudioRefs";

describe("useSimpleMonitorReactiveAudioRefs", () => {
  it("syncs audio context and controls refs and clears runtime refs when monitoring stops", () => {
    const audioContextA = { state: "running" } as AudioContext;
    const audioContextB = { state: "suspended" } as AudioContext;
    const controlsA = DEFAULT_MONITOR_DECK_CONTROLS;
    const controlsB = { ...DEFAULT_MONITOR_DECK_CONTROLS, masterVolume: 0.72 };

    const { result, rerender } = renderHook(
      ({ audioContext, isListening, deckControls }) =>
        useSimpleMonitorReactiveAudioRefs({
          audioContext,
          isListening,
          deckControls,
        }),
      {
        initialProps: {
          audioContext: audioContextA,
          isListening: true,
          deckControls: controlsA,
        },
      },
    );

    result.current.backgroundGraphRef.current = {} as never;
    result.current.smoothedPressureRef.current = 0.84;

    rerender({
      audioContext: audioContextB,
      isListening: true,
      deckControls: controlsB,
    });

    expect(result.current.audioContextRef.current).toBe(audioContextB);
    expect(result.current.deckControlsRef.current.masterVolume).toBe(0.72);

    rerender({
      audioContext: audioContextB,
      isListening: false,
      deckControls: controlsB,
    });

    expect(result.current.backgroundGraphRef.current).toBeNull();
    expect(result.current.smoothedPressureRef.current).toBe(0);
  });
});
