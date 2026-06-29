import { describe, expect, it, vi } from "vitest";

import {
  buildSimpleMonitorDeckVisualHookInput,
  buildSimpleMonitorLiveTailHookInput,
} from "../../../src/features/simple/simpleMonitorDeckPresentationRuntime";

describe("simpleMonitorDeckPresentationRuntime", () => {
  it("builds live tail hook input from selected anomaly state", () => {
    const onSelectAnomalyId = vi.fn();

    const input = buildSimpleMonitorLiveTailHookInput({
      liveLines: [{ id: "line-1", anomalyId: "anomaly-1" }] as never,
      selectedAnomalyId: "anomaly-1",
      setSelectedAnomalyId: onSelectAnomalyId,
    });

    expect(input.liveLines).toHaveLength(1);
    expect(input.selectedAnomalyId).toBe("anomaly-1");
    expect(input.onSelectAnomalyId).toBe(onSelectAnomalyId);
  });

  it("builds deck visual hook input from presentation state", () => {
    const onSelectAnomalyForFocus = vi.fn();
    const onToggleConsole = vi.fn();
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();

    const input = buildSimpleMonitorDeckVisualHookInput({
      backgroundAudioRef: { current: null },
      waveformBins: [0.1, 0.3],
      waveformAnomalies: [],
      trackWaveProgress: 0.25,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      deckDurationSeconds: 180,
      deckBpm: 126,
      activeBeatGrid: [],
      logSignalBuffer: [{ val: 20, heat: 0 }],
      selectedAnomalyId: "anomaly-1",
      isConsoleExpanded: false,
      onToggleConsole,
      onSelectAnomalyForFocus,
      deckVisualPreset: "balanced",
      waveformScale: 1.2,
      safeRuntime: true,
    });

    expect(input.deckBpm).toBe(126);
    expect(input.trackWaveProgress).toBe(0.25);
    expect(input.onToggleConsole).toBe(onToggleConsole);
    expect(input.onSelectAnomalyForFocus).toBe(onSelectAnomalyForFocus);
    expect(input.waveformScale).toBe(1.2);
    expect(input.safeRuntime).toBe(true);
  });
});
