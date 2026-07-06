import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMonitorLiveStreamStateRefs } from "../../../src/features/simple/useMonitorLiveStreamStateRefs";

describe("useMonitorLiveStreamStateRefs", () => {
  it("keeps the imperative refs aligned with current stream state", () => {
    const { result, rerender } = renderHook(
      ({ liveSuggestedBpm, liveLines, logSignalBuffer, waveformAnomalies, selectedAnomalyId }) =>
        useMonitorLiveStreamStateRefs({
          liveSuggestedBpm,
          liveLines,
          logSignalBuffer,
          waveformAnomalies,
          selectedAnomalyId,
        }),
      {
        initialProps: {
          liveSuggestedBpm: 126,
          liveLines: [{ id: "line-1" }],
          logSignalBuffer: [{ val: 1, heat: 0.4 }],
          waveformAnomalies: [{ id: "anomaly-1", progress: 0.5, severity: 0.9, label: "Error" }],
          selectedAnomalyId: "anomaly-1",
        },
      },
    );

    expect(result.current.liveSuggestedBpmRef.current).toBe(126);
    expect(result.current.liveLinesRef.current).toEqual([{ id: "line-1" }]);
    expect(result.current.logSignalBufferRef.current).toEqual([{ val: 1, heat: 0.4 }]);
    expect(result.current.waveformAnomaliesRef.current).toEqual([
      { id: "anomaly-1", progress: 0.5, severity: 0.9, label: "Error" },
    ]);
    expect(result.current.selectedAnomalyIdRef.current).toBe("anomaly-1");

    rerender({
      liveSuggestedBpm: 132,
      liveLines: [{ id: "line-2" }],
      logSignalBuffer: [{ val: 3, heat: 0.8 }],
      waveformAnomalies: [{ id: "anomaly-2", progress: 0.8, severity: 0.7, label: "Warn" }],
      selectedAnomalyId: "anomaly-2",
    });

    expect(result.current.liveSuggestedBpmRef.current).toBe(132);
    expect(result.current.liveLinesRef.current).toEqual([{ id: "line-2" }]);
    expect(result.current.logSignalBufferRef.current).toEqual([{ val: 3, heat: 0.8 }]);
    expect(result.current.waveformAnomaliesRef.current).toEqual([
      { id: "anomaly-2", progress: 0.8, severity: 0.7, label: "Warn" },
    ]);
    expect(result.current.selectedAnomalyIdRef.current).toBe("anomaly-2");
  });
});
