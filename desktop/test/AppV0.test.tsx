import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppContentV0 } from "../src/App-v0";

const hooksMock = vi.hoisted(() => {
  const selectedTrack = {
    id: "track-1",
    title: "Daft Punk - Around The World",
    sourcePath: "/tracks/around-the-world.mp3",
    file: {
      sourcePath: "/tracks/around-the-world.mp3",
      storagePath: null,
      sourceKind: "file" as const,
      fileExtension: "mp3",
      sizeBytes: 1024,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available" as const,
      playbackSource: "source_file" as const,
    },
    tags: {
      title: "Daft Punk - Around The World",
      artist: "Daft Punk",
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-25T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.9,
      durationSeconds: 360,
      waveformBins: [0.1, 0.2, 0.3],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
    importedAt: "2026-06-25T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds: 360,
    waveformBins: [0.1, 0.2, 0.3],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "mp3",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    storagePath: null,
  };

  const repositories = [
    {
      id: "repo-1",
      title: "visits-service",
      sourcePath: "/logs/visits-service.log",
      storagePath: null,
      sourceKind: "file" as const,
      importedAt: "2026-06-25T20:00:00.000Z",
      suggestedBpm: 126,
      confidence: 0.8,
      summary: "summary",
      analyzerStatus: "ready",
      buildSystem: "none",
      primaryLanguage: "log",
      javaFileCount: 0,
      testFileCount: 0,
      waveformBins: [0.4, 0.3],
      beatGrid: [],
      bpmCurve: [],
      notes: [],
      tags: [],
      metrics: {},
    },
  ];

  return {
    selectedTrack,
    repositories,
    useUserMode: vi.fn(() => ({ userMode: "simple" as const })),
    useLibrary: vi.fn(() => ({
      tracks: [selectedTrack],
      selectedTrack,
      selectedTrackId: selectedTrack.id,
      setSelectedTrackId: vi.fn(),
    })),
    useRepositories: vi.fn(() => ({
      repositories,
      selectedRepository: repositories[0],
      selectedRepositoryId: repositories[0].id,
      setSelectedRepositoryId: vi.fn(),
      importRepositorySource: vi.fn(async () => repositories[0]),
    })),
    useBaseAssets: vi.fn(() => ({
      baseAssets: [],
      importLibraryBaseAsset: vi.fn(async () => null),
    })),
    useCompositionResults: vi.fn(),
    useSessions: vi.fn(() => ({
      sessions: [],
    })),
    monitorStopSession: vi.fn(async () => undefined),
    monitorResumeAudio: vi.fn(async () => undefined),
    monitorSubscribe: vi.fn(() => vi.fn()),
    useMonitor: vi.fn(() => ({
      session: {
        sessionId: "session-1",
        persistedSessionId: null,
        repoId: "repo-1",
        repoTitle: "visits-service",
        trackId: "track-1",
        trackName: "Daft Punk - Around The World",
        sourcePath: "/logs/visits-service.log",
        adapterKind: "file",
        pollMode: "session",
        startedAt: Date.now() - 5000,
      },
      metrics: {
        windowCount: 2,
        processedLines: 40,
        totalAnomalies: 3,
      },
      setGuideTrack: vi.fn(),
      resumeAudio: vi.fn(async () => undefined),
      attachSession: vi.fn(async () => true),
      startSession: vi.fn(async () => true),
      playbackSession: vi.fn(async () => true),
      stopSession: vi.fn(async () => undefined),
      audioContext: {
        state: "running",
      },
      subscribe: vi.fn(() => vi.fn()),
    })),
    loadAppV0Preferences: vi.fn(() => ({
      lang: "en" as const,
      skin: "daybreak" as const,
      setupPreferences: {
        playbackVolume: 0.42,
      },
    })),
    persistAppV0Language: vi.fn(),
    persistAppV0SetupPreferences: vi.fn(),
    persistAppV0Skin: vi.fn(),
    applyAppV0SkinPreference: vi.fn(),
    startLogSourceConnection: vi.fn(),
    startLibraryMonitoring: vi.fn(async () => ({ ok: true as const })),
    startSourceMonitoring: vi.fn(async () => ({ ok: false as const, reason: "boom" })),
    replaySession: vi.fn(),
  };
});

vi.mock("../src/features/simple/UserModeContext", () => ({
  UserModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUserMode: hooksMock.useUserMode,
}));

vi.mock("../src/hooks/useLibrary", () => ({
  useLibrary: hooksMock.useLibrary,
}));

vi.mock("../src/hooks/useRepositories", () => ({
  useRepositories: hooksMock.useRepositories,
}));

vi.mock("../src/hooks/useBaseAssets", () => ({
  useBaseAssets: hooksMock.useBaseAssets,
}));

vi.mock("../src/hooks/useCompositionResults", () => ({
  useCompositionResults: hooksMock.useCompositionResults,
}));

vi.mock("../src/hooks/useSessions", () => ({
  useSessions: hooksMock.useSessions,
}));

vi.mock("../src/features/monitor/MonitorContext", () => ({
  useMonitor: hooksMock.useMonitor,
}));

vi.mock("../src/appV0Preferences", async () => {
  const actual = await vi.importActual("../src/appV0Preferences");
  return {
    ...actual,
    loadAppV0Preferences: hooksMock.loadAppV0Preferences,
    persistAppV0Language: hooksMock.persistAppV0Language,
    persistAppV0SetupPreferences: hooksMock.persistAppV0SetupPreferences,
    persistAppV0Skin: hooksMock.persistAppV0Skin,
    applyAppV0SkinPreference: hooksMock.applyAppV0SkinPreference,
  };
});

vi.mock("../src/api/repositories", async () => {
  const actual = await vi.importActual("../src/api/repositories");
  return {
    ...actual,
    startLogSourceConnection: hooksMock.startLogSourceConnection,
  };
});

vi.mock("../src/appV0MonitorOrchestration", () => ({
  createAppV0MonitorOrchestrator: vi.fn(() => ({
    startLibraryMonitoring: hooksMock.startLibraryMonitoring,
    startSourceMonitoring: hooksMock.startSourceMonitoring,
    replaySession: hooksMock.replaySession,
  })),
}));

vi.mock("../src/components/AppShell", () => ({
  AppShell: ({
    children,
    currentSection,
    onSectionChange,
    onInspect,
    onStopMonitoring,
    onToggleCollapse,
  }: {
    children: React.ReactNode;
    currentSection: string;
    onSectionChange?: (section: "connections") => void;
    onInspect?: () => void;
    onStopMonitoring?: () => void;
    onToggleCollapse?: () => void;
  }) => (
    <div>
      <div data-testid="shell-section">{currentSection}</div>
      <button onClick={() => onSectionChange?.("connections")}>goto-connections</button>
      <button onClick={() => onInspect?.()}>inspect-monitor</button>
      <button onClick={() => onStopMonitoring?.()}>stop-monitoring</button>
      <button onClick={() => onToggleCollapse?.()}>toggle-sidebar</button>
      {children}
    </div>
  ),
}));

vi.mock("../src/AppV0SectionContent", () => ({
  AppV0SectionContent: ({
    currentSection,
    isConsoleExpanded,
    onStartLibraryMonitoring,
    onStartMonitoring,
  }: {
    currentSection: string;
    isConsoleExpanded: boolean;
    onStartLibraryMonitoring: (repoId: string) => Promise<void>;
    onStartMonitoring: (source: unknown, trackId?: string) => Promise<void>;
  }) => (
    <div>
      <div data-testid="content-section">{currentSection}</div>
      <div data-testid="content-console">{String(isConsoleExpanded)}</div>
      <button onClick={() => void onStartLibraryMonitoring("repo-1")}>launch-library</button>
      <button
        onClick={() =>
          void onStartMonitoring(
            { kind: "repository", repoId: "repo-1", sourcePath: "/logs/visits-service.log" },
            "track-1",
          )
        }
      >
        launch-source
      </button>
    </div>
  ),
}));

vi.mock("../src/components/WaveformBar", () => ({
  WaveformBar: ({ source, anomalies }: { source: string; anomalies: number }) => (
    <div data-testid="waveform-bar">
      {source}::{anomalies}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("AppContentV0", () => {
  it("hydrates persisted preferences and updates section state from shell actions", async () => {
    render(<AppContentV0 />);

    await waitFor(() => {
      expect(hooksMock.loadAppV0Preferences).toHaveBeenCalledWith(window.localStorage);
    });

    await waitFor(() => {
      expect(hooksMock.persistAppV0Language).toHaveBeenCalledWith(window.localStorage, "en");
      expect(hooksMock.persistAppV0Skin).toHaveBeenCalledWith(window.localStorage, "daybreak");
      expect(hooksMock.applyAppV0SkinPreference).toHaveBeenCalledWith(
        document.documentElement,
        "daybreak",
      );
    });

    fireEvent.click(screen.getByText("goto-connections"));
    expect(screen.getByTestId("shell-section")).toHaveTextContent("connections");
    expect(screen.getByTestId("content-section")).toHaveTextContent("connections");

    fireEvent.click(screen.getByText("inspect-monitor"));
    expect(screen.getByTestId("shell-section")).toHaveTextContent("monitor");
    expect(screen.getByTestId("content-console")).toHaveTextContent("true");
  });

  it("delegates launches to the monitor orchestrator and reports source launch failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AppContentV0 />);

    fireEvent.click(screen.getByText("launch-library"));
    await waitFor(() => {
      expect(hooksMock.startLibraryMonitoring).toHaveBeenCalledWith("repo-1");
    });

    fireEvent.click(screen.getByText("launch-source"));
    await waitFor(() => {
      expect(hooksMock.startSourceMonitoring).toHaveBeenCalledWith(
        { kind: "repository", repoId: "repo-1", sourcePath: "/logs/visits-service.log" },
        "track-1",
      );
    });
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "🎵 Failed to start monitor launch",
        "boom",
      );
    });

    consoleError.mockRestore();
  });
});
