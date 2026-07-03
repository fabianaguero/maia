import { describe, expect, it, vi } from "vitest";

import {
  buildAppMonitorOverviewProps,
  buildAppShellLayoutState,
  buildAppShellSpinnerState,
  buildAppSidebarProps,
  buildAppTopbarProps,
} from "../src/appShellPropsRuntime";
import type { useAppContentController } from "../src/hooks/useAppContentController";
import { en } from "../src/i18n/en";

type AppContentControllerValue = ReturnType<typeof useAppContentController>;

function createController(
  overrides: Partial<AppContentControllerValue> = {},
): AppContentControllerValue {
  return {
    t: en,
    screen: "library",
    pillar: "curate",
    libraryTab: "tracks",
    analysisMode: "track",
    isDark: true,
    lang: "en",
    newlyImportedId: null,
    library: {
      tracks: [],
      playlists: [],
      selectedTrack: null,
      selectedTrackId: null,
      selectedPlaylist: null,
      selectedPlaylistId: null,
      loading: false,
      mutating: false,
      error: null,
      seedLibrary: vi.fn(async () => undefined),
    } as AppContentControllerValue["library"],
    repositories: {
      repositories: [],
      selectedRepository: null,
      selectedRepositoryId: null,
      loading: false,
      mutating: false,
      error: null,
    } as AppContentControllerValue["repositories"],
    baseAssets: {
      baseAssets: [],
      selectedBaseAsset: null,
      selectedBaseAssetId: null,
      loading: false,
      mutating: false,
      error: null,
    } as AppContentControllerValue["baseAssets"],
    compositions: {
      compositions: [],
      selectedComposition: null,
      selectedCompositionId: null,
      loading: false,
      mutating: false,
      error: null,
    } as AppContentControllerValue["compositions"],
    monitor: {
      session: null,
      metrics: { totalAnomalies: 0, processedLines: 0, windowCount: 0 },
      isPlayback: false,
      playbackProgress: null,
      stopSession: vi.fn(async () => undefined),
    } as AppContentControllerValue["monitor"],
    sessions: {
      sessionBookmarksBySessionId: {},
      sessions: [],
      selectedSessionId: null,
      loading: false,
      mutating: false,
      error: null,
      setSelectedSessionId: vi.fn(),
      removeSession: vi.fn(async () => undefined),
    } as AppContentControllerValue["sessions"],
    manifest: null,
    health: null,
    booting: false,
    isTransitioning: false,
    effectivePillar: "curate",
    effectiveScreen: "library",
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
    screenLabel: "Library",
    selectedItemTitle: "orders-service",
    isMutating: false,
    mutateLabel: "Saving",
    ...overrides,
  } as AppContentControllerValue;
}

describe("appShellPropsRuntime", () => {
  it("builds spinner and layout shell state", () => {
    expect(
      buildAppShellSpinnerState({
        booting: true,
        isMutating: true,
        bootingLabel: "Booting",
        mutateLabel: "Saving",
      }),
    ).toEqual({
      visible: true,
      label: "Booting",
    });

    expect(
      buildAppShellLayoutState({
        pillar: "curate",
        isTransitioning: true,
        userMode: "expert",
      }),
    ).toEqual({
      mainClassName: "app-main role--curate opacity-transition",
      mainKey: "expert-curate",
    });
  });

  it("builds topbar toggles and monitor overview props from controller state", () => {
    const controller = createController({
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
        metrics: { totalAnomalies: 3, processedLines: 9, windowCount: 1 },
        isPlayback: false,
        playbackProgress: null,
        stopSession: vi.fn(async () => undefined),
      } as AppContentControllerValue["monitor"],
    });

    const topbarProps = buildAppTopbarProps(controller, "simple");
    topbarProps.onToggleLanguage();
    topbarProps.onToggleTheme();

    expect(controller.setLang).toHaveBeenCalledWith(expect.any(Function));
    expect(controller.setIsDark).toHaveBeenCalledWith(expect.any(Function));

    expect(buildAppMonitorOverviewProps(controller, "expert")).toMatchObject({
      userMode: "expert",
      selectedItemTitle: "orders-service",
      detailDeckLabel: "Deck",
      hasMonitorSession: true,
      anomalyLabel: en.simpleMode.monitor.anomalies,
    });
  });

  it("marks connections active only for the curated library connections screen", () => {
    const controller = createController({
      pillar: "curate",
      screen: "library",
      libraryTab: "connections",
    });

    const sidebarProps = buildAppSidebarProps(controller);
    sidebarProps.onStopMonitor();

    expect(sidebarProps.connectionsActive).toBe(true);
    expect(controller.monitor.stopSession).toHaveBeenCalledTimes(1);
  });
});
