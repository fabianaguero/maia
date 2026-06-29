import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAppV0ContentModel } from "../../src/hooks/useAppV0ContentModel";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

const mockedHooks = vi.hoisted(() => ({
  useUserMode: vi.fn(() => ({ userMode: "simple" as const })),
  useAppV0PreferencesState: vi.fn(() => ({
    lang: "en" as const,
    setLang: vi.fn(),
    skin: "nightfall" as const,
    setSkin: vi.fn(),
    setupPreferences: {
      defaultCloudLookback: "10m",
      idleHoldMs: 900,
      tailWindowRows: 1200,
    },
    updateSetupPreference: vi.fn(),
  })),
  useAppV0ShellState: vi.fn(() => ({
    currentSection: "monitor" as const,
    setCurrentSection: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebarCollapsed: vi.fn(),
    isConsoleExpanded: false,
    openMonitorInspector: vi.fn(),
    toggleConsoleExpanded: vi.fn(),
  })),
  useLibrary: vi.fn(() => ({
    tracks: [],
    selectedTrack: null,
    selectedTrackId: null,
    setSelectedTrackId: vi.fn(),
  })),
  useRepositories: vi.fn(() => ({
    repositories: [],
    selectedRepository: null,
    selectedRepositoryId: null,
    setSelectedRepositoryId: vi.fn(),
    importRepositorySource: vi.fn(async () => null),
  })),
  useBaseAssets: vi.fn(() => ({
    baseAssets: [],
    importLibraryBaseAsset: vi.fn(async () => null),
  })),
  useCompositionResults: vi.fn(),
  useMonitor: vi.fn(() => ({
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
    stopSession: vi.fn(async () => undefined),
    subscribe: vi.fn(() => vi.fn()),
    audioContext: null,
  })),
  useSessions: vi.fn(() => ({
    sessions: [],
  })),
  useAppV0MonitorScreenState: vi.fn(() => ({
    t: en,
    isMonitoring: false,
    fallbackViewModel: {
      message: "Nothing here",
      hint: "Use the sidebar",
    },
    monitorOrchestrator: {
      startLibraryMonitoring: vi.fn(async () => ({ ok: true as const })),
      startSourceMonitoring: vi.fn(async () => ({ ok: true as const })),
      replaySession: vi.fn(async () => undefined),
    },
    shellViewModel: {
      monitoringStatus: {
        source: undefined,
        anomalies: 0,
        uptime: "0s",
        confidence: 87,
      },
      selectedItem: "Monitor",
      floatingWaveformBar: {
        isVisible: false,
      },
    },
    waveformBins: undefined,
    reportMonitorLaunchFailure: vi.fn(),
  })),
}));

vi.mock("../../src/features/simple/UserModeContext", () => ({
  useUserMode: mockedHooks.useUserMode,
}));

vi.mock("../../src/hooks/useAppV0PreferencesState", () => ({
  useAppV0PreferencesState: mockedHooks.useAppV0PreferencesState,
}));

vi.mock("../../src/hooks/useAppV0ShellState", () => ({
  useAppV0ShellState: mockedHooks.useAppV0ShellState,
}));

vi.mock("../../src/hooks/useLibrary", () => ({
  useLibrary: mockedHooks.useLibrary,
}));

vi.mock("../../src/hooks/useRepositories", () => ({
  useRepositories: mockedHooks.useRepositories,
}));

vi.mock("../../src/hooks/useBaseAssets", () => ({
  useBaseAssets: mockedHooks.useBaseAssets,
}));

vi.mock("../../src/hooks/useCompositionResults", () => ({
  useCompositionResults: mockedHooks.useCompositionResults,
}));

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: mockedHooks.useMonitor,
}));

vi.mock("../../src/hooks/useSessions", () => ({
  useSessions: mockedHooks.useSessions,
}));

vi.mock("../../src/hooks/useAppV0MonitorScreenState", () => ({
  useAppV0MonitorScreenState: mockedHooks.useAppV0MonitorScreenState,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={en}>{children}</I18nContext.Provider>;
}

describe("useAppV0ContentModel", () => {
  it("assembles the mounted App-v0 shell model from its dependency hooks", () => {
    const { result } = renderHook(() => useAppV0ContentModel(), { wrapper });

    expect(result.current.t).toBe(en);
    expect(result.current.screenModel.appShellProps.currentSection).toBe("monitor");
    expect(result.current.screenModel.sectionContentInput.currentSection).toBe("monitor");
    expect(result.current.screenModel.floatingWaveformBarProps).toBeNull();
  });
});
