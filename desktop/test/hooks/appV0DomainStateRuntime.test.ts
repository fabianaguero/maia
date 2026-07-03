import { describe, expect, it, vi } from "vitest";

import { buildAppV0DomainState } from "../../src/hooks/appV0DomainStateRuntime";

describe("appV0DomainStateRuntime", () => {
  it("preserves the explicit App-v0 domain slices", () => {
    const state = buildAppV0DomainState({
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
        isConsoleExpanded: false,
        toggleConsoleExpanded: vi.fn(),
        openMonitorInspector: vi.fn(),
      },
      library: {
        tracks: [],
        selectedTrackId: null,
        selectedTrack: null,
        setSelectedTrackId: vi.fn(),
      },
      repositories: {
        repositories: [],
        selectedRepositoryId: null,
        selectedRepository: null,
        setSelectedRepositoryId: vi.fn(),
        importRepositorySource: vi.fn(),
      },
      baseAssets: {
        baseAssets: [],
        importLibraryBaseAsset: vi.fn(),
      },
      monitor: {
        session: null,
        metrics: {
          windowCount: 0,
          processedLines: 0,
          totalAnomalies: 0,
        },
        stopSession: vi.fn(async () => undefined),
        resumeAudio: vi.fn(async () => undefined),
        subscribe: vi.fn(() => vi.fn()),
        audioContext: null,
        setGuideTrack: vi.fn(),
        attachSession: vi.fn(async () => true),
        startSession: vi.fn(async () => true),
        playbackSession: vi.fn(async () => true),
      },
      pastSessions: {
        sessions: [],
      },
    });

    expect(state.preferences.lang).toBe("en");
    expect(state.shellState.currentSection).toBe("monitor");
    expect(state.monitor.metrics.totalAnomalies).toBe(0);
  });
});
