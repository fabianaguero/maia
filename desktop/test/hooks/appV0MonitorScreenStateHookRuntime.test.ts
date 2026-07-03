import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0MonitorOrchestratorInput,
  buildAppV0MonitorScreenStateHookResult,
  buildAppV0MonitorStateModelInput,
} from "../../src/hooks/appV0MonitorScreenStateHookRuntime";

function createInput() {
  return {
    lang: "en" as const,
    currentSection: "library" as const,
    setCurrentSection: vi.fn(),
    repositories: [{ id: "repo-1" }],
    selectedRepositoryTitle: "visits-service",
    tracks: [{ id: "track-1" }],
    selectedTrack: { id: "track-1" },
    session: null,
    metrics: {
      windowCount: 0,
      processedLines: 0,
      totalAnomalies: 0,
    },
    setGuideTrack: vi.fn(),
    resumeAudio: vi.fn(async () => undefined),
    attachSession: vi.fn(async () => true),
    startSession: vi.fn(async () => true),
    playbackSession: vi.fn(async () => true),
  } as never;
}

describe("appV0MonitorScreenStateHookRuntime", () => {
  it("builds monitor state-model and orchestrator inputs from hook input", () => {
    const input = createInput();

    expect(buildAppV0MonitorStateModelInput(input)).toEqual({
      lang: "en",
      currentSection: "library",
      selectedRepositoryTitle: "visits-service",
      selectedTrack: input.selectedTrack,
      tracks: input.tracks,
      session: null,
      metrics: input.metrics,
    });

    const orchestratorInput = buildAppV0MonitorOrchestratorInput(input);
    expect(orchestratorInput).toMatchObject({
      repositories: input.repositories,
      tracks: input.tracks,
      selectedTrack: input.selectedTrack,
      setGuideTrack: input.setGuideTrack,
      resumeAudio: input.resumeAudio,
      attachSession: input.attachSession,
      startSession: input.startSession,
      playbackSession: input.playbackSession,
    });

    orchestratorInput.onLaunchSuccess();
    expect(input.setCurrentSection).toHaveBeenCalledWith("monitor");
  });

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
});
