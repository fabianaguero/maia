import { describe, expect, it } from "vitest";

import { buildSimpleMonitorDeckVisualDerivedState } from "../../../src/features/simple/simpleMonitorDeckVisualRuntime";

describe("simpleMonitorDeckVisualRuntime", () => {
  it("builds derived visual deck state from waveform and log data", () => {
    const derived = buildSimpleMonitorDeckVisualDerivedState({
      waveformBins: new Array(64).fill(0.5),
      waveformAnomalies: [
        {
          id: "anomaly-1",
          lineId: "line-1",
          timestamp: "10:00:00",
          message: "timeout",
          severity: 0.8,
          progress: 0.25,
        },
      ],
      trackWaveProgress: 0.2,
      deckDurationSeconds: 240,
      deckBpm: 126,
      activeBeatGrid: [],
      logSignalBuffer: new Array(120).fill(null).map(() => ({ val: 20, heat: 0 })),
      selectedAnomalyId: "anomaly-1",
    });

    expect(derived.visibleWindowSeconds).toBeGreaterThan(0);
    expect(derived.trackWaveSamples.length).toBeGreaterThan(0);
    expect(Array.isArray(derived.deckTimelineMarkers)).toBe(true);
    expect(Array.isArray(derived.deckBeatMarkers)).toBe(true);
    expect(derived.derivedDeckState.overviewWaveSamples.length).toBeGreaterThan(0);
    expect(derived.derivedDeckState.selectedDeckMarker?.id).toBe("anomaly-1");
  });
});
