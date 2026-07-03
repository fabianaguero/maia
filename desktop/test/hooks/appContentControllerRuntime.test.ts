import { describe, expect, it, vi } from "vitest";

import {
  buildAppContentControllerValue,
  buildAppContentMutationInput,
  buildAppContentSessionEffectsInput,
  buildAppContentStatusInput,
} from "../../src/hooks/appContentControllerRuntime";

describe("appContentControllerRuntime", () => {
  it("builds status, mutation, session-effect, and controller payloads from domain state", () => {
    const domainState = {
      userMode: "simple",
      isTransitioning: false,
      manifest: { musicStyles: [] },
      health: { ok: true },
      booting: false,
      shellState: {
        screen: "library",
        setScreen: vi.fn(),
        pillar: "design",
        setPillar: vi.fn(),
        libraryTab: "tracks",
        setLibraryTab: vi.fn(),
        analysisMode: "repo",
        setAnalysisMode: vi.fn(),
        isDark: true,
        setIsDark: vi.fn(),
        lang: "es",
        setLang: vi.fn(),
        newlyImportedId: "track-9",
        setNewlyImportedId: vi.fn(),
      },
      t: { common: "t" },
      library: {
        selectedTrack: { id: "track-1" },
        selectedPlaylist: { name: "Late Night" },
        mutating: false,
      },
      repositories: {
        selectedRepository: { id: "repo-1" },
        mutating: true,
      },
      baseAssets: {
        selectedBaseAsset: { id: "base-1" },
        mutating: false,
      },
      compositions: {
        selectedComposition: { id: "comp-1" },
        mutating: true,
      },
      monitor: { id: "monitor" },
      sessions: {
        refreshBookmarks: vi.fn(),
      },
    } as never;

    expect(buildAppContentStatusInput(domainState)).toMatchObject({
      analysisMode: "repo",
      playlistName: "Late Night",
      screen: "library",
    });
    expect(buildAppContentMutationInput(domainState)).toEqual({
      baseAssetsMutating: false,
      compositionsMutating: true,
      libraryMutating: false,
      repositoriesMutating: true,
    });
    expect(buildAppContentSessionEffectsInput(domainState)).toEqual({
      screen: "library",
      refreshSessionBookmarks: domainState.sessions.refreshBookmarks,
    });

    const controller = buildAppContentControllerValue({
      domainState,
      actionBundles: {
        monitorActions: {
          startReplaySession: vi.fn(),
          startLiveSession: vi.fn(),
          openMonitoredRepo: vi.fn(),
        },
        catalogActions: {
          handleImportTrack: vi.fn(),
        },
        selectionActions: {
          startSimpleMonitoring: vi.fn(),
        },
        navigationActions: {
          handleOpenConnections: vi.fn(),
        },
      } as never,
      effectivePillar: "curate",
      effectiveScreen: "library",
      analyzerLabel: "Analyzer ready",
      detailDeckLabel: "Deck ready",
      screenLabel: "Library",
      selectedItemTitle: "Track One",
      isMutating: true,
      mutateLabel: "Saving",
    });

    expect(controller.effectivePillar).toBe("curate");
    expect(controller.screen).toBe("library");
    expect(controller.startSimpleMonitoring).toBeTypeOf("function");
    expect(controller.handleOpenConnections).toBeTypeOf("function");
    expect(controller.mutateLabel).toBe("Saving");
  });
});
