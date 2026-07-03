import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0MonitorScreenStateInput,
  buildAppV0ScreenModelInput,
} from "../../src/hooks/appV0ContentModelRuntime";

describe("appV0ContentModelRuntime", () => {
  it("derives monitor-state and screen-model inputs from the domain state", () => {
    const domainState = {
      userMode: "simple",
      preferences: {
        lang: "en",
        setLang: vi.fn(),
        skin: "nightfall",
        setSkin: vi.fn(),
        setupPreferences: {
          defaultCloudLookback: "10m",
          idleHoldMs: 900,
          tailWindowRows: 1200,
        },
        updateSetupPreference: vi.fn(),
      },
      shellState: {
        currentSection: "monitor",
        setCurrentSection: vi.fn(),
        isSidebarCollapsed: false,
        toggleSidebarCollapsed: vi.fn(),
        isConsoleExpanded: true,
        openMonitorInspector: vi.fn(),
        toggleConsoleExpanded: vi.fn(),
      },
      library: {
        tracks: [{ id: "track-1" }],
        selectedTrack: { id: "track-1" },
        selectedTrackId: "track-1",
        setSelectedTrackId: vi.fn(),
      },
      repositories: {
        repositories: [{ id: "repo-1", title: "visits-service" }],
        selectedRepository: { id: "repo-1", title: "visits-service" },
        selectedRepositoryId: "repo-1",
        setSelectedRepositoryId: vi.fn(),
        importRepositorySource: vi.fn(),
      },
      baseAssets: {
        baseAssets: [{ id: "base-1" }],
        importLibraryBaseAsset: vi.fn(),
      },
      monitor: {
        session: { sessionId: "session-1" },
        metrics: { totalAnomalies: 3 },
        setGuideTrack: vi.fn(),
        resumeAudio: vi.fn(),
        attachSession: vi.fn(),
        startSession: vi.fn(),
        playbackSession: vi.fn(),
        stopSession: vi.fn(),
        subscribe: vi.fn(),
        audioContext: null,
      },
      pastSessions: {
        sessions: [{ id: "past-1" }],
      },
    } as never;

    const monitorStateInput = buildAppV0MonitorScreenStateInput(domainState);
    expect(monitorStateInput.lang).toBe("en");
    expect(monitorStateInput.currentSection).toBe("monitor");
    expect(monitorStateInput.selectedRepositoryTitle).toBe("visits-service");

    const screenModelInput = buildAppV0ScreenModelInput(domainState, {
      t: {} as never,
      isMonitoring: true,
      fallbackViewModel: {
        message: "Nothing here",
        hint: "Use the sidebar",
      },
      monitorOrchestrator: {
        startLibraryMonitoring: vi.fn(),
        startSourceMonitoring: vi.fn(),
        replaySession: vi.fn(),
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
      reportMonitorLaunchFailure: vi.fn(),
    });

    expect(screenModelInput.skin).toBe("nightfall");
    expect(screenModelInput.monitor.metrics).toBe(domainState.monitor.metrics);
    expect(screenModelInput.monitorOrchestrator.startLibraryMonitoring).toBeTypeOf("function");
    expect(screenModelInput.pastSessions.sessions).toHaveLength(1);
  });
});
