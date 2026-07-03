import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const shellState = {
    screen: "library" as const,
    setScreen: vi.fn(),
    pillar: "design" as const,
    setPillar: vi.fn(),
    libraryTab: "tracks" as const,
    setLibraryTab: vi.fn(),
    analysisMode: "repo" as const,
    setAnalysisMode: vi.fn(),
    isDark: true,
    setIsDark: vi.fn(),
    lang: "es" as const,
    setLang: vi.fn(),
    newlyImportedId: null,
    setNewlyImportedId: vi.fn(),
  };

  return {
    domainState: {
      userMode: "simple" as const,
      isTransitioning: false,
      manifest: { musicStyles: [] },
      health: null,
      booting: true,
      shellState,
      t: {
        appShell: {
          analyzerUnavailable: "Analyzer unavailable",
          basePoolArmed: "Base pool armed",
          bootingAnalyzerBridge: "Booting analyzer bridge",
          mappingRepository: "Mapping repository",
          poolIngest: "Pool ingest",
          renderingComposition: "Rendering composition",
          scanningTrackDna: "Scanning track DNA",
          sourceDeckArmed: "Source deck armed",
          trackDeckArmed: "Track deck armed",
        },
        nav: {
          compose: { label: "Compose" },
          inspect: { label: "Inspect" },
          library: { label: "Library" },
          session: { label: "Session" },
        },
      },
      library: {
        tracks: [{ id: "track-1", tags: { title: "Track One" } }],
        selectedTrack: { id: "track-1", tags: { title: "Track One" } },
        selectedPlaylist: null,
        mutating: false,
      },
      repositories: {
        selectedRepository: { title: "orders-service" },
        mutating: true,
      },
      baseAssets: {
        selectedBaseAsset: null,
        mutating: false,
      },
      compositions: {
        selectedComposition: null,
        mutating: false,
      },
      monitor: {},
      sessions: {
        refreshBookmarks: vi.fn(),
      },
    },
    actionBundles: {
      monitorActions: {
        armTrackBase: vi.fn(),
        armPlaylistBase: vi.fn(),
        startReplaySession: vi.fn(),
        startLiveSession: vi.fn(),
        openMonitoredRepo: vi.fn(),
      },
      catalogActions: {
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
      },
      selectionActions: {
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
      },
      navigationActions: {
        handleOpenConnections: vi.fn(),
        handlePillarChange: vi.fn(),
        handleHideToBackground: vi.fn(),
      },
    },
    useSessionScreenEffects: vi.fn(),
  };
});

vi.mock("../../src/hooks/useAppContentDomainState", () => ({
  useAppContentDomainState: () => mocks.domainState,
}));

vi.mock("../../src/hooks/useAppContentActionBundles", () => ({
  useAppContentActionBundles: () => mocks.actionBundles,
}));

vi.mock("../../src/hooks/useAppContentSessionEffects", () => ({
  useAppContentSessionEffects: mocks.useSessionScreenEffects,
}));

import { useAppContentController } from "../../src/hooks/useAppContentController";

describe("useAppContentController", () => {
  it("assembles shell route, mutation, status, and action bundles", () => {
    const { result } = renderHook(() => useAppContentController());

    expect(mocks.useSessionScreenEffects).toHaveBeenCalledWith({
      screen: "library",
      refreshSessionBookmarks: mocks.domainState.sessions.refreshBookmarks,
    });
    expect(result.current.effectivePillar).toBe("curate");
    expect(result.current.effectiveScreen).toBe("library");
    expect(result.current.analyzerLabel).toBe("Booting analyzer bridge");
    expect(result.current.detailDeckLabel).toBe("Source deck armed");
    expect(result.current.screenLabel).toBe("Library");
    expect(result.current.selectedItemTitle).toBe("Track One");
    expect(result.current.isMutating).toBe(true);
    expect(result.current.mutateLabel).toBe("Mapping repository");
    expect(result.current.startSimpleMonitoring).toBe(
      mocks.actionBundles.selectionActions.startSimpleMonitoring,
    );
    expect(result.current.handleOpenConnections).toBe(
      mocks.actionBundles.navigationActions.handleOpenConnections,
    );
    expect(result.current.startLiveSession).toBe(
      mocks.actionBundles.monitorActions.startLiveSession,
    );
  });
});
