import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMonitorLiveStreamLifecycle } from "../../../src/features/simple/useMonitorLiveStreamLifecycle";

describe("useMonitorLiveStreamLifecycle", () => {
  it("bootstraps the live tail when listening starts", () => {
    const liveLinesRef = { current: [] as Array<{ id: string; message: string }> };
    const setLiveLines = vi.fn();

    renderHook(() =>
      useMonitorLiveStreamLifecycle({
        isListening: true,
        sessionSourcePath: "/logs/app.log",
        streamAdapterLabel: "FILE_TAIL",
        liveLinesRef: liveLinesRef as never,
        logSignalBufferRef: { current: [] } as never,
        waveformAnomaliesRef: { current: [] } as never,
        selectedAnomalyIdRef: { current: null },
        lastStreamEventAtRef: { current: 0 },
        audioProbePlayedRef: { current: false },
        setLiveLines,
        setLogSignalBuffer: vi.fn(),
        setLiveSuggestedBpm: vi.fn(),
        setWaveformAnomalies: vi.fn(),
        setSelectedAnomalyId: vi.fn(),
      }),
    );

    expect(setLiveLines).toHaveBeenCalledTimes(1);
    expect(liveLinesRef.current[0]?.message).toContain("MAIA_MONITOR_INITIALIZED");
  });
});
