import { describe, expect, it, vi } from "vitest";

import {
  buildSimpleMonitorDeckPresentationHookResult,
  buildSimpleMonitorDeckPresentationRuntimeInput,
  buildSimpleMonitorDeckPresentationTailHookArgs,
  buildSimpleMonitorDeckPresentationVisualHookArgs,
} from "../../../src/features/simple/simpleMonitorDeckPresentationHookRuntime";
import type { UseSimpleMonitorDeckPresentationStateInput } from "../../../src/features/simple/simpleMonitorDeckPresentationTypes";

function createInput(): UseSimpleMonitorDeckPresentationStateInput {
  return {
    backgroundAudioRef: { current: null },
    waveformBins: [0.1, 0.3],
    waveformAnomalies: [],
    trackWaveProgress: 0.25,
    setTrackWaveProgress: vi.fn(),
    setTrackElapsedSeconds: vi.fn(),
    deckDurationSeconds: 180,
    deckBpm: 126,
    activeBeatGrid: [],
    logSignalBuffer: [{ val: 20, heat: 0 }],
    selectedAnomalyId: "anomaly-1",
    setSelectedAnomalyId: vi.fn(),
    liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }] as never,
    isConsoleExpanded: false,
    onToggleConsole: vi.fn(),
    deckVisualPreset: "balanced",
    waveformScale: 1.2,
    safeRuntime: true,
  };
}

describe("simpleMonitorDeckPresentationHookRuntime", () => {
  it("passes the runtime input through unchanged", () => {
    const input = createInput();
    expect(buildSimpleMonitorDeckPresentationRuntimeInput(input)).toBe(input);
  });

  it("builds tail and visual hook args from presentation state", () => {
    const input = createInput();
    const focusAnomaly = vi.fn();

    expect(buildSimpleMonitorDeckPresentationTailHookArgs(input)).toEqual({
      liveLines: input.liveLines,
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: input.setSelectedAnomalyId,
    });

    expect(
      buildSimpleMonitorDeckPresentationVisualHookArgs({
        state: input,
        focusAnomaly,
      }),
    ).toEqual(
      expect.objectContaining({
        backgroundAudioRef: input.backgroundAudioRef,
        deckBpm: 126,
        selectedAnomalyId: "anomaly-1",
        onSelectAnomalyForFocus: focusAnomaly,
        safeRuntime: true,
      }),
    );
  });

  it("combines tail and visual slices into the public presentation state", () => {
    expect(
      buildSimpleMonitorDeckPresentationHookResult({
        tailState: { focusAnomaly: vi.fn() },
        visualState: { overviewWindowLeftPercent: 10 },
      }),
    ).toEqual(
      expect.objectContaining({
        overviewWindowLeftPercent: 10,
      }),
    );
  });
});
