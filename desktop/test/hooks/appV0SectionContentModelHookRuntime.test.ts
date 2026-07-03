import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0SectionContentActionsInput,
  buildAppV0SectionContentHookResult,
  buildAppV0SectionContentStateInput,
} from "../../src/hooks/appV0SectionContentModelHookRuntime";

function createScreenModelInput() {
  return {
    userMode: "simple",
    lang: "en",
    skin: "nightfall",
    setupPreferences: {
      defaultCloudLookback: "10m",
      idleHoldMs: 900,
      tailWindowRows: 1200,
    },
    updateSetupPreference: vi.fn(),
    setLang: vi.fn(),
    setSkin: vi.fn(),
    currentSection: "monitor",
    setCurrentSection: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebarCollapsed: vi.fn(),
    isConsoleExpanded: true,
    toggleConsoleExpanded: vi.fn(),
    openMonitorInspector: vi.fn(),
    fallbackViewModel: {
      message: "Nothing here",
      hint: "Use the sidebar",
    },
    shellViewModel: {
      monitoringStatus: {
        source: "visits-service",
        anomalies: 3,
        uptime: "14s",
        confidence: 87,
      },
      selectedItem: "visits-service",
      floatingWaveformBar: {
        isVisible: true,
        source: "visits-service",
        anomalies: 3,
        uptime: "14s",
      },
    },
    waveformBins: [0.2, 0.4],
    isMonitoring: true,
    reportMonitorLaunchFailure: vi.fn(),
    monitor: {
      session: {
        trackName: "Deck Track",
      },
      metrics: {
        totalAnomalies: 3,
      },
      stopSession: vi.fn(async () => undefined),
      resumeAudio: vi.fn(async () => undefined),
      subscribe: vi.fn(() => vi.fn()),
      audioContext: {
        state: "running",
      } as AudioContext,
    },
    library: {
      tracks: [{ id: "track-1" }],
      selectedTrackId: "track-1",
      selectedTrack: null,
      setSelectedTrackId: vi.fn(),
    },
    repositories: {
      repositories: [{ id: "repo-1" }],
      selectedRepositoryId: "repo-1",
      setSelectedRepositoryId: vi.fn(),
      importRepositorySource: vi.fn(async () => ({ id: "repo-1" })),
    },
    baseAssets: {
      baseAssets: [{ id: "base-1" }],
      importLibraryBaseAsset: vi.fn(async () => ({ id: "base-1" })),
    },
    pastSessions: {
      sessions: [{ id: "session-1" }],
    },
    monitorOrchestrator: {
      startLibraryMonitoring: vi.fn(async () => ({ ok: true as const })),
      startSourceMonitoring: vi.fn(async () => ({ ok: true as const })),
      replaySession: vi.fn(async () => undefined),
    },
  } as never;
}

describe("appV0SectionContentModelHookRuntime", () => {
  it("maps screen model bindings into content action inputs", () => {
    const input = createScreenModelInput();
    const actionsInput = buildAppV0SectionContentActionsInput(input);

    expect(actionsInput.setCurrentSection).toBe(input.setCurrentSection);
    expect(actionsInput.stopSession).toBe(input.monitor.stopSession);
    expect(actionsInput.startLibraryMonitoring).toBe(
      input.monitorOrchestrator.startLibraryMonitoring,
    );
    expect(actionsInput.resumeAudio).toBe(input.monitor.resumeAudio);
  });

  it("maps hook input and composed actions into section content state", () => {
    const input = createScreenModelInput();
    const contentActions = {
      onSectionChange: vi.fn(),
      onStopMonitoring: vi.fn(),
      onInspectFloatingWaveform: vi.fn(),
      onImportRepository: vi.fn(),
      onImportBaseAsset: vi.fn(),
      onStartLibraryMonitoring: vi.fn(),
      onStopMonitor: vi.fn(),
      onResumeAudio: vi.fn(),
      onStartMonitoring: vi.fn(),
      onReplaySession: vi.fn(),
    } as never;

    const stateInput = buildAppV0SectionContentStateInput(input, contentActions);
    const result = buildAppV0SectionContentHookResult({
      contentActions,
      sectionContentInput: stateInput,
    });

    expect(stateInput.audioStatus).toBe("running");
    expect(stateInput.monitorTrackName).toBe("Deck Track");
    expect(stateInput.onStartMonitoring).toBe(contentActions.onStartMonitoring);
    expect(stateInput.onReplaySession).toBe(contentActions.onReplaySession);
    expect(stateInput.onToggleConsole).toBe(input.toggleConsoleExpanded);
    expect(result.sectionContentInput).toBe(stateInput);
    expect(result.contentActions).toBe(contentActions);
  });
});
