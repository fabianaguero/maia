import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useSessionScreenEffects: vi.fn(),
}));

vi.mock("../../src/hooks/useAppContentSessionEffects", () => ({
  useAppContentSessionEffects: mocks.useSessionScreenEffects,
}));

import { useAppContentDerivedState } from "../../src/hooks/useAppContentDerivedState";

function createDomainState() {
  return {
    userMode: "simple" as const,
    isTransitioning: false,
    manifest: { musicStyles: [] },
    health: null,
    booting: true,
    shellState: {
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
    },
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
  };
}

describe("useAppContentDerivedState", () => {
  it("derives route, status, mutation state, and session effects input", () => {
    const domainState = createDomainState();

    const { result } = renderHook(() => useAppContentDerivedState(domainState));

    expect(mocks.useSessionScreenEffects).toHaveBeenCalledWith({
      screen: "library",
      refreshSessionBookmarks: domainState.sessions.refreshBookmarks,
    });
    expect(result.current).toEqual({
      effectivePillar: "curate",
      effectiveScreen: "library",
      analyzerLabel: "Booting analyzer bridge",
      detailDeckLabel: "Source deck armed",
      screenLabel: "Library",
      selectedItemTitle: "Track One",
      isMutating: true,
      mutateLabel: "Mapping repository",
    });
  });
});
