import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0MonitorScreenStateHookResult,
} from "../../src/hooks/appV0MonitorScreenStateHookRuntime";

describe("appV0MonitorScreenStateHookRuntime", () => {
  it("returns a stable app-v0 monitor hook result envelope", () => {
    const reportMonitorLaunchFailure = vi.fn();
    const stateModel = {
      t: { simpleMode: { nav: { monitor: "Monitor" } } },
      isMonitoring: false,
      uptimeLabel: "0s",
      fallbackViewModel: { title: "idle" },
      shellViewModel: { currentSection: "library" },
      waveformBins: [0.2, 0.4],
    } as never;
    const monitorOrchestrator = {
      startLibraryMonitoring: vi.fn(),
      startSourceMonitoring: vi.fn(),
      replaySession: vi.fn(),
    } as never;

    expect(
      buildAppV0MonitorScreenStateHookResult({
        stateModel,
        monitorOrchestrator,
        reportMonitorLaunchFailure,
      }),
    ).toEqual({
      t: stateModel.t,
      isMonitoring: false,
      uptimeLabel: "0s",
      fallbackViewModel: stateModel.fallbackViewModel,
      monitorOrchestrator,
      shellViewModel: stateModel.shellViewModel,
      waveformBins: stateModel.waveformBins,
      reportMonitorLaunchFailure,
    });
  });

  it("preserves the launch-failure reporter and orchestration callbacks on the public result", () => {
    const reportMonitorLaunchFailure = vi.fn();
    const monitorOrchestrator = {
      startLibraryMonitoring: vi.fn(),
      startSourceMonitoring: vi.fn(),
      replaySession: vi.fn(),
    } as never;

    const result = buildAppV0MonitorScreenStateHookResult({
      stateModel: {
        t: { simpleMode: { nav: { monitor: "Monitor" } } },
        isMonitoring: true,
        uptimeLabel: "12s",
        fallbackViewModel: { title: "idle" },
        shellViewModel: { currentSection: "monitor" },
        waveformBins: [0.1, 0.4],
      } as never,
      monitorOrchestrator,
      reportMonitorLaunchFailure,
    });

    result.reportMonitorLaunchFailure("source", { ok: false, reason: "start-failed" });

    expect(reportMonitorLaunchFailure).toHaveBeenCalledWith("source", {
      ok: false,
      reason: "start-failed",
    });
    expect(result.monitorOrchestrator).toBe(monitorOrchestrator);
  });
});
