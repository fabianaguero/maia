import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

const appState = vi.hoisted(() => {
  const selectedTrack = {
    id: "track-1",
    title: "Track 1",
    sourcePath: "/music/track-1.wav",
    storagePath: null,
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "wav",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: "/music/track-1.wav",
      storagePath: null,
      sourceKind: "file" as const,
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: "2026-06-25T10:00:00.000Z",
      checksum: null,
      availabilityState: "available" as const,
      playbackSource: "source_file" as const,
    },
    tags: {
      title: "Track 1",
      artist: null,
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-25T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 180,
      waveformBins: [],
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
  };

  const repository = {
    id: "repo-1",
    title: "orders-service",
    sourcePath: "/logs/orders.log",
    storagePath: null,
    sourceKind: "file" as const,
    importedAt: "2026-06-25T10:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.7,
    summary: "summary",
    analyzerStatus: "ready",
    buildSystem: "none",
    primaryLanguage: "log",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };

  return {
    userMode: "simple" as "simple" | "expert",
    selectedTrack,
    repository,
    librarySetSelectedTrackId: vi.fn(),
    librarySetSelectedPlaylistId: vi.fn(),
    repositorySetSelectedRepositoryId: vi.fn(),
    notify: vi.fn(),
    importRepositorySource: vi.fn(async (input?: { sourcePath?: string; label?: string }) => ({
      ...repository,
      sourcePath: input?.sourcePath ?? repository.sourcePath,
      title: input?.label ?? repository.title,
    })),
    importTrack: vi.fn(async () => selectedTrack),
    importBaseAsset: vi.fn(async () => ({
      id: "base-1",
      title: "Base 1",
    })),
    importComposition: vi.fn(async () => ({
      id: "composition-1",
      title: "Composition 1",
    })),
    reanalyzeTrack: vi.fn(async () => selectedTrack),
    relinkTrack: vi.fn(async () => selectedTrack),
    relinkMissingTracks: vi.fn(async () => ({
      relinkedTracks: [selectedTrack],
      unresolvedTrackIds: [],
    })),
    reanalyzeRepository: vi.fn(async () => repository),
    deleteTrack: vi.fn(async () => true),
    deleteRepository: vi.fn(async () => true),
    updateTrackPerformance: vi.fn(async () => selectedTrack),
    updateTrackAnalysis: vi.fn(async () => selectedTrack),
    savePlaylist: vi.fn(async () => ({ id: "playlist-1", name: "Playlist 1" })),
    deletePlaylist: vi.fn(async () => true),
    seedLibrary: vi.fn(async () => undefined),
    discoveredLogs: ["/logs/one.log", "/logs/two.log"],
    monitorSession: null as null | {
      sessionId: string;
      persistedSessionId: string | null;
      repoId: string;
      sourcePath: string;
    },
    monitorPlaybackSession: vi.fn(async () => true),
    monitorStartSession: vi.fn(async () => true),
    monitorStopSession: vi.fn(async () => undefined),
    monitorPausePlayback: vi.fn(),
    monitorSeekPlaybackWindow: vi.fn(),
    monitorSetGuideTrack: vi.fn(),
    monitorSetGuideTrackPlaylist: vi.fn(),
    refreshBookmarks: vi.fn(async () => undefined),
  };
});

vi.mock("../src/api/analyzer", () => ({
  loadBootstrapManifest: vi.fn(async () => ({
    musicStyles: [],
    baseAssetCategories: [],
    defaultTrackMusicStyleId: "house",
    defaultBaseAssetCategoryId: "drums",
  })),
  runAnalyzerRequest: vi.fn(async () => ({
    status: "ok",
    payload: {
      analyzerVersion: "1.0.0",
      runtime: "python3.12",
      supportedActions: ["health"],
      modes: ["track", "repo"],
    },
    warnings: [],
  })),
}));

vi.mock("../src/api/repositories", async () => {
  const actual = await vi.importActual("../src/api/repositories");
  return {
    ...actual,
    discoverRepositoryLogs: vi.fn(async () => appState.discoveredLogs),
  };
});

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  isTauri: vi.fn(() => false),
}));

vi.mock("../src/components/NotificationSystem", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNotify: () => ({ notify: appState.notify }),
}));

vi.mock("../src/features/simple/UserModeContext", () => ({
  UserModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUserMode: () => ({ userMode: appState.userMode }),
}));

vi.mock("../src/features/simple/ModeTransition", () => ({
  useModeTransition: () => ({ isTransitioning: false }),
}));

vi.mock("../src/hooks/useLibrary", () => ({
  useLibrary: () => ({
    tracks: [appState.selectedTrack],
    playlists: [],
    selectedTrack: appState.selectedTrack,
    selectedTrackId: appState.selectedTrack.id,
    selectedPlaylist: null,
    selectedPlaylistId: null,
    setSelectedTrackId: appState.librarySetSelectedTrackId,
    setSelectedPlaylistId: appState.librarySetSelectedPlaylistId,
    loading: false,
    mutating: false,
    error: null,
    importLibraryTrack: appState.importTrack,
    reanalyzeTrack: appState.reanalyzeTrack,
    relinkTrack: appState.relinkTrack,
    relinkMissingTracksFromDirectory: appState.relinkMissingTracks,
    deleteLibraryTrack: appState.deleteTrack,
    updateTrackPerformance: appState.updateTrackPerformance,
    updateTrackAnalysis: appState.updateTrackAnalysis,
    savePlaylist: appState.savePlaylist,
    deletePlaylist: appState.deletePlaylist,
    seedLibrary: appState.seedLibrary,
  }),
}));

vi.mock("../src/hooks/useRepositories", () => ({
  useRepositories: () => ({
    repositories: appState.userMode === "simple" ? [] : [appState.repository],
    selectedRepository: appState.userMode === "simple" ? null : appState.repository,
    selectedRepositoryId: appState.userMode === "simple" ? null : appState.repository.id,
    setSelectedRepositoryId: appState.repositorySetSelectedRepositoryId,
    loading: false,
    mutating: false,
    error: null,
    importRepositorySource: appState.importRepositorySource,
    reanalyzeRepository: appState.reanalyzeRepository,
    deleteLibraryRepository: appState.deleteRepository,
  }),
}));

vi.mock("../src/hooks/useBaseAssets", () => ({
  useBaseAssets: () => ({
    baseAssets: [{ id: "base-1", title: "Base 1" }],
    selectedBaseAsset: { id: "base-1", title: "Base 1" },
    selectedBaseAssetId: "base-1",
    setSelectedBaseAssetId: vi.fn(),
    loading: false,
    mutating: false,
    error: null,
    importLibraryBaseAsset: appState.importBaseAsset,
  }),
}));

vi.mock("../src/hooks/useCompositionResults", () => ({
  useCompositionResults: () => ({
    compositions: [{ id: "composition-1", title: "Composition 1" }],
    selectedComposition: { id: "composition-1", title: "Composition 1" },
    selectedCompositionId: "composition-1",
    setSelectedCompositionId: vi.fn(),
    loading: false,
    mutating: false,
    error: null,
    importLibraryComposition: appState.importComposition,
  }),
}));

vi.mock("../src/hooks/useSessions", () => ({
  useSessions: () => ({
    sessions: [],
    sessionBookmarksBySessionId: {},
    selectedSessionId: null,
    setSelectedSessionId: vi.fn(),
    loading: false,
    mutating: false,
    error: null,
    refreshBookmarks: appState.refreshBookmarks,
    clearError: vi.fn(),
    createSession: vi.fn(async () => undefined),
    removeSession: vi.fn(async () => true),
  }),
}));

vi.mock("../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => ({
    session: appState.monitorSession,
    metrics: { totalAnomalies: 2, processedLines: 10, windowCount: 1 },
    isPlayback: false,
    playbackProgress: null,
    setGuideTrack: appState.monitorSetGuideTrack,
    setGuideTrackPlaylist: appState.monitorSetGuideTrackPlaylist,
    playbackSession: appState.monitorPlaybackSession,
    startSession: appState.monitorStartSession,
    stopSession: appState.monitorStopSession,
    pausePlayback: appState.monitorPausePlayback,
    seekPlaybackWindow: appState.monitorSeekPlaybackWindow,
  }),
}));

vi.mock("../src/components/Web3Spinner", () => ({
  Web3Spinner: ({ visible, label }: { visible: boolean; label: string }) => (
    <div data-testid="spinner">{visible ? label : "idle"}</div>
  ),
}));

vi.mock("../src/components/MonitorWaveformBar", () => ({
  MonitorWaveformBar: () => <div>monitor-waveform</div>,
}));

vi.mock("../src/components/Branding", () => ({
  BrandLockup: () => <div>brand-lockup</div>,
  BrandWordmark: () => <div>brand-wordmark</div>,
}));

vi.mock("../src/components/AppSidebar", () => ({
  AppSidebar: ({
    onOpenConnections,
    onOpenMonitoredRepo,
    currentPillar,
    connectionsActive,
  }: {
    onOpenConnections: () => void;
    onOpenMonitoredRepo: () => void;
    currentPillar: string;
    connectionsActive: boolean;
  }) => (
    <div>
      <div>sidebar-{currentPillar}</div>
      <div>connections-{String(connectionsActive)}</div>
      <button onClick={onOpenConnections}>open-connections</button>
      <button onClick={onOpenMonitoredRepo}>open-monitored-repo</button>
    </div>
  ),
}));

vi.mock("../src/features/simple/SimpleModeWizard", () => ({
  SimpleModeWizard: ({
    onImportRepository,
  }: {
    onImportRepository: (input: {
      sourceKind: "directory";
      sourcePath: string;
      label: string;
    }) => Promise<boolean>;
  }) => (
    <button
      onClick={() =>
        void onImportRepository({
          sourceKind: "directory",
          sourcePath: "/logs",
          label: "Logs",
        })
      }
    >
      wizard-import-repo
    </button>
  ),
}));

vi.mock("../src/features/simple/SimpleModeLibraryView", () => ({
  SimpleModeLibraryView: () => <div>simple-library-view</div>,
}));

vi.mock("../src/features/library/LibraryScreen", () => ({
  LibraryScreen: ({
    activeTab,
    onInspectTrack,
  }: {
    activeTab: string;
    onInspectTrack: (trackId: string) => void;
  }) => (
    <div>
      <div>library-screen-{activeTab}</div>
      <button onClick={() => onInspectTrack("track-1")}>inspect-track</button>
    </div>
  ),
}));

vi.mock("../src/features/inspect/InspectScreen", () => ({
  InspectScreen: () => <div>inspect-screen</div>,
}));

vi.mock("../src/features/compose/ComposeScreen", () => ({
  ComposeScreen: () => <div>compose-screen</div>,
}));

vi.mock("../src/features/session/SessionScreen", () => ({
  SessionScreen: () => <div>session-screen</div>,
}));

import App from "../src/App";

describe("App", () => {
  beforeEach(() => {
    appState.userMode = "simple";
    appState.discoveredLogs = ["/logs/one.log", "/logs/two.log"];
    appState.monitorSession = null;
    appState.notify.mockClear();
    appState.importRepositorySource.mockClear();
    appState.repositorySetSelectedRepositoryId.mockClear();
    appState.monitorSetGuideTrack.mockClear();
    appState.monitorSetGuideTrackPlaylist.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("imports a simple-mode repository and rescues discovered logs", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("wizard-import-repo")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("wizard-import-repo"));

    await waitFor(() => {
      expect(appState.importRepositorySource).toHaveBeenCalled();
    });

    expect(appState.importRepositorySource).toHaveBeenCalledWith({
      sourceKind: "file",
      sourcePath: "/logs/one.log",
      label: "one.log",
    });
    expect(appState.notify).toHaveBeenCalled();
  });

  it("opens expert connections and transitions into inspect", async () => {
    appState.userMode = "expert";

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("library-screen-tracks")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("open-connections"));

    await waitFor(() => {
      expect(screen.getByText("library-screen-connections")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("inspect-track"));

    await waitFor(() => {
      expect(screen.getByText("inspect-screen")).toBeInTheDocument();
    });
  });

  it("opens the monitored repository from the sidebar", async () => {
    appState.userMode = "expert";
    appState.monitorSession = {
      sessionId: "session-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      sourcePath: "/logs/orders.log",
    };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("library-screen-tracks")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("open-monitored-repo"));

    await waitFor(() => {
      expect(screen.getByText("inspect-screen")).toBeInTheDocument();
    });

    expect(appState.repositorySetSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
  });
});
