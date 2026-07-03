import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMonitorLiveStreamControllerState } from "../../../src/features/simple/useMonitorLiveStreamControllerState";

describe("useMonitorLiveStreamControllerState", () => {
  it("keeps state refs in sync and simulates a bounded log burst", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.6);
    const { result } = renderHook(() =>
      useMonitorLiveStreamControllerState({
        maxLiveLines: 2,
      }),
    );

    act(() => {
      result.current.setters.setLiveSuggestedBpm(126);
      result.current.setters.setSelectedAnomalyId("anomaly-1");
    });

    expect(result.current.refs.liveSuggestedBpmRef.current).toBe(126);
    expect(result.current.refs.selectedAnomalyIdRef.current).toBe("anomaly-1");

    act(() => {
      result.current.simulateLog();
      result.current.simulateLog();
      result.current.simulateLog();
    });

    expect(result.current.liveLines.length).toBeLessThanOrEqual(2);
    expect(result.current.refs.liveLinesRef.current).toEqual(result.current.liveLines);
    expect(result.current.refs.logSignalBufferRef.current).toEqual(result.current.logSignalBuffer);

    randomSpy.mockRestore();
  });
});
