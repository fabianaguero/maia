import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorPanelController } from "../../src/features/analyzer/components/useLiveLogMonitorPanelController";

const useT = vi.fn();
const useMonitor = vi.fn();
const useLiveLogMonitorSurfaceState = vi.fn();
const useLiveLogMonitorPanelRuntime = vi.fn();

vi.mock("../../src/i18n/I18nContext", () => ({
  useT: () => useT(),
}));

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => useMonitor(),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorSurfaceState", () => ({
  useLiveLogMonitorSurfaceState: (...args: unknown[]) =>
    useLiveLogMonitorSurfaceState(...args),
}));

vi.mock("../../src/features/analyzer/components/useLiveLogMonitorPanelRuntime", () => ({
  useLiveLogMonitorPanelRuntime: (...args: unknown[]) =>
    useLiveLogMonitorPanelRuntime(...args),
}));

describe("useLiveLogMonitorPanelController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useT.mockReturnValue({ inspect: {} });
    useMonitor.mockReturnValue({
      session: { repoId: "repo-1" },
      isPlayback: true,
      playbackProgress: 0.314,
      playbackEventIndex: 12,
      playbackEventCount: 30,
    });
    useLiveLogMonitorSurfaceState.mockReturnValue({
      expanded: false,
      setExpanded: vi.fn(),
    });
    useLiveLogMonitorPanelRuntime.mockReturnValue({
      ctaMetaLabel: "BPM 126",
      headerProps: { title: "Hybrid monitor" },
      setupProps: { visible: false },
      liveDeckProps: { mode: "live" },
    });
  });

  it("derives live/replay state and passes it into the runtime", () => {
    const props = {
      repository: { id: "repo-1" },
      availableBaseAssets: [],
      availableCompositions: [],
      preferredBaseAssetId: null,
      preferredCompositionId: null,
      availableTracks: [],
      availablePlaylists: [],
    } as never;

    const { result } = renderHook(() => useLiveLogMonitorPanelController(props));

    expect(useLiveLogMonitorPanelRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        liveEnabled: true,
        replayActive: true,
        playbackPercent: 31,
        playbackWindowLabel: "12/30",
      }),
    );
    expect(result.current.liveEnabled).toBe(true);
    expect(result.current.expanded).toBe(false);
    expect(result.current.headerProps.title).toBe("Hybrid monitor");
  });
});
