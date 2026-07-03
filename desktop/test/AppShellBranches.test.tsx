import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { en } from "../src/i18n/en";

const state = vi.hoisted(() => ({
  userMode: "simple" as "simple" | "expert",
  controller: null as ReturnType<typeof createControllerState> | null,
}));

vi.mock("../src/components/NotificationSystem", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../src/features/simple/UserModeContext", () => ({
  UserModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUserMode: () => ({ userMode: state.userMode }),
}));

vi.mock("../src/components/Web3Spinner", () => ({
  Web3Spinner: ({ visible, label }: { visible: boolean; label: string }) => (
    <div data-testid="spinner">{visible ? label : "idle"}</div>
  ),
}));

vi.mock("../src/components/AppTopbar", () => ({
  AppTopbar: ({
    onToggleLanguage,
    onToggleTheme,
  }: {
    onToggleLanguage: () => void;
    onToggleTheme: () => void;
  }) => (
    <div>
      <button onClick={onToggleLanguage}>toggle-language</button>
      <button onClick={onToggleTheme}>toggle-theme</button>
    </div>
  ),
}));

vi.mock("../src/components/AppMonitorOverview", () => ({
  AppMonitorOverview: () => <div>monitor-overview</div>,
}));

vi.mock("../src/components/AppSidebar", () => ({
  AppSidebar: ({
    onStopMonitor,
    onOpenConnections,
    connectionsActive,
  }: {
    onStopMonitor: () => void;
    onOpenConnections: () => void;
    connectionsActive: boolean;
  }) => (
    <div>
      <button onClick={onStopMonitor}>stop-monitor</button>
      <button onClick={onOpenConnections}>open-connections</button>
      <span>connections-active-{String(connectionsActive)}</span>
    </div>
  ),
}));

vi.mock("../src/AppSectionContent", () => ({
  AppSectionContent: ({
    onReplayBookmark,
    onStopSession,
    onResumeSession,
    onDeleteSession,
    onSelectSession,
    musicStyles,
    baseAssetCategories,
    defaultTrackMusicStyleId,
    defaultBaseAssetCategoryId,
  }: {
    onReplayBookmark: (
      session: {
        id: string;
        label: string | null;
        sourcePath: string | null;
        sourceId: string | null;
      },
      replayWindowIndex?: number,
    ) => void;
    onStopSession: () => void;
    onResumeSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onSelectSession: (sessionId: string) => void;
    musicStyles: { id: string }[];
    baseAssetCategories: { id: string }[];
    defaultTrackMusicStyleId?: string;
    defaultBaseAssetCategoryId?: string;
  }) => (
    <div>
      <span>music-styles-{musicStyles.length}</span>
      <span>base-asset-categories-{baseAssetCategories.length}</span>
      <span>default-track-style-{defaultTrackMusicStyleId ?? "none"}</span>
      <span>default-base-category-{defaultBaseAssetCategoryId ?? "none"}</span>
      <button
        onClick={() =>
          onReplayBookmark(
            {
              id: "session-1",
              label: "Replay 1",
              sourcePath: "/logs/replay.log",
              sourceId: "repo-1",
            },
            7,
          )
        }
      >
        replay-bookmark
      </button>
      <button onClick={onStopSession}>content-stop-session</button>
      <button onClick={() => onResumeSession("resume-1")}>content-resume-session</button>
      <button onClick={() => onDeleteSession("delete-1")}>content-delete-session</button>
      <button onClick={() => onSelectSession("select-1")}>content-select-session</button>
    </div>
  ),
}));

vi.mock("../src/hooks/useAppContentController", () => ({
  useAppContentController: () => state.controller,
}));

function createControllerState() {
  return {
    t: en,
    isTransitioning: false,
    manifest: null,
    health: null as null | { warnings: string[] },
    booting: false,
    screen: "monitor",
    pillar: "monitor",
    libraryTab: "tracks",
    analysisMode: "track",
    isDark: true,
    lang: "en" as const,
    newlyImportedId: null,
    library: {
      tracks: [],
      playlists: [],
      selectedTrack: null,
      selectedTrackId: null,
      selectedPlaylistId: null,
      loading: false,
      mutating: false,
      error: null,
      seedLibrary: vi.fn(async () => undefined),
    },
    repositories: {
      repositories: [],
      selectedRepository: null,
      selectedRepositoryId: null,
      loading: false,
      mutating: false,
      error: null,
    },
    baseAssets: {
      baseAssets: [],
      selectedBaseAsset: null,
      selectedBaseAssetId: null,
      loading: false,
      mutating: false,
      error: null,
    },
    compositions: {
      compositions: [],
      selectedComposition: null,
      selectedCompositionId: null,
      loading: false,
      mutating: false,
      error: null,
    },
    monitor: {
      session: {
        sessionId: "stream-1",
        persistedSessionId: "persisted-1",
        repoId: "repo-1",
        repoTitle: "orders-service",
        sourcePath: "/logs/orders.log",
        adapterKind: "file",
        pollMode: "session",
        startedAt: 1,
      },
      metrics: { totalAnomalies: 3, processedLines: 12, windowCount: 1 },
      isPlayback: false,
      playbackProgress: null,
      stopSession: vi.fn(async () => undefined),
    },
    sessions: {
      sessionBookmarksBySessionId: {},
      sessions: [],
      selectedSessionId: null,
      loading: false,
      mutating: false,
      error: null,
      setSelectedSessionId: vi.fn(),
      removeSession: vi.fn(async () => true),
    },
    effectivePillar: "monitor",
    effectiveScreen: "monitor",
    handleImportTrack: vi.fn(),
    handleImportRepository: vi.fn(),
    handleImportBaseAsset: vi.fn(),
    handleImportComposition: vi.fn(),
    handleReanalyzeTrack: vi.fn(),
    handleRelinkTrack: vi.fn(),
    handleRelinkMissingTracks: vi.fn(),
    handleReanalyzeRepository: vi.fn(),
    handleDeleteTrack: vi.fn(),
    handleDeleteRepository: vi.fn(),
    handleUpdateTrackPerformance: vi.fn(),
    handleUpdateTrackAnalysis: vi.fn(),
    handleSavePlaylist: vi.fn(),
    handleDeletePlaylist: vi.fn(),
    selectSimpleTrack: vi.fn(),
    selectSimpleRepository: vi.fn(),
    selectTrack: vi.fn(),
    selectPlaylist: vi.fn(),
    selectRepository: vi.fn(),
    selectBaseAsset: vi.fn(),
    selectComposition: vi.fn(),
    inspectTrack: vi.fn(),
    inspectRepository: vi.fn(),
    inspectBaseAsset: vi.fn(),
    inspectComposition: vi.fn(),
    goLibrary: vi.fn(),
    goCompose: vi.fn(),
    startSimpleMonitoring: vi.fn(),
    startSimpleWizardSession: vi.fn(),
    startReplaySession: vi.fn(async () => true),
    startLiveSession: vi.fn(async () => true),
    openMonitoredRepo: vi.fn(),
    handleOpenConnections: vi.fn(),
    handlePillarChange: vi.fn(),
    handleHideToBackground: vi.fn(),
    setLang: vi.fn(),
    setIsDark: vi.fn(),
    setLibraryTab: vi.fn(),
    setAnalysisMode: vi.fn(),
    analyzerLabel: "Analyzer",
    detailDeckLabel: "Deck",
    selectedItemTitle: "orders-service",
    isMutating: false,
    mutateLabel: "Mutating",
  };
}

import App from "../src/App";

describe("App shell branches", () => {
  beforeEach(() => {
    state.userMode = "simple";
    state.controller = createControllerState();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders health warnings and wires replay bookmark callbacks through AppSectionContent", () => {
    state.controller.health = {
      warnings: ["Warning alpha", "Warning beta"],
    };

    render(<App />);

    expect(screen.getByText("Warning alpha")).toBeInTheDocument();
    expect(screen.getByText("Warning beta")).toBeInTheDocument();

    fireEvent.click(screen.getByText("replay-bookmark"));
    fireEvent.click(screen.getByText("content-stop-session"));
    fireEvent.click(screen.getByText("content-resume-session"));
    fireEvent.click(screen.getByText("content-delete-session"));
    fireEvent.click(screen.getByText("content-select-session"));

    expect(state.controller.startReplaySession).toHaveBeenCalledWith(
      {
        id: "session-1",
        label: "Replay 1",
        sourcePath: "/logs/replay.log",
        sourceId: "repo-1",
      },
      7,
    );
    expect(state.controller.monitor.stopSession).toHaveBeenCalledTimes(1);
    expect(state.controller.sessions.setSelectedSessionId).toHaveBeenCalledWith("resume-1");
    expect(state.controller.sessions.removeSession).toHaveBeenCalledWith("delete-1");
    expect(state.controller.sessions.setSelectedSessionId).toHaveBeenCalledWith("select-1");
  });

  it("wires topbar and sidebar shell actions to the controller", () => {
    render(<App />);

    fireEvent.click(screen.getByText("toggle-language"));
    fireEvent.click(screen.getByText("toggle-theme"));
    fireEvent.click(screen.getByText("stop-monitor"));
    fireEvent.click(screen.getByText("open-connections"));

    expect(state.controller.setLang).toHaveBeenCalledWith(expect.any(Function));
    expect(state.controller.setIsDark).toHaveBeenCalledWith(expect.any(Function));
    expect(state.controller.monitor.stopSession).toHaveBeenCalledTimes(1);
    expect(state.controller.handleOpenConnections).toHaveBeenCalledTimes(1);
  });

  it("renders mutating shell state with transition class, active connections, and manifest-derived defaults", () => {
    state.userMode = "expert";
    state.controller.isTransitioning = true;
    state.controller.isMutating = true;
    state.controller.booting = false;
    state.controller.mutateLabel = "Saving deck";
    state.controller.pillar = "curate";
    state.controller.screen = "library";
    state.controller.libraryTab = "connections";
    state.controller.manifest = {
      musicStyles: [{ id: "house" }],
      baseAssetCategories: [{ id: "fx" }],
      defaultTrackMusicStyleId: "house",
      defaultBaseAssetCategoryId: "fx",
    };

    render(<App />);

    expect(screen.getByTestId("spinner")).toHaveTextContent("Saving deck");
    expect(screen.getByText("connections-active-true")).toBeInTheDocument();
    expect(screen.getByText("music-styles-1")).toBeInTheDocument();
    expect(screen.getByText("base-asset-categories-1")).toBeInTheDocument();
    expect(screen.getByText("default-track-style-house")).toBeInTheDocument();
    expect(screen.getByText("default-base-category-fx")).toBeInTheDocument();
    expect(document.querySelector(".app-main")).toHaveClass("role--curate", "opacity-transition");
  });

  it("prioritizes the booting label in the shell spinner", () => {
    state.controller.booting = true;
    state.controller.isMutating = true;
    state.controller.mutateLabel = "Saving deck";

    render(<App />);

    expect(screen.getByTestId("spinner")).toHaveTextContent(en.appShell.bootingMaia);
  });
});
