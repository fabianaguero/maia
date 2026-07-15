import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../src/i18n/I18nContext";
import { en } from "../../../src/i18n/en";
import { useLibraryScreenController } from "../../../src/features/library/useLibraryScreenController";

const deleteLogSourceConnection = vi.fn();
const useLibraryScreenState = vi.fn();
const useCodeProjectsState = vi.fn();

vi.mock("../../../src/api/repositories", () => ({
  deleteLogSourceConnection: (...args: unknown[]) => deleteLogSourceConnection(...args),
}));

vi.mock("../../../src/features/library/useLibraryScreenState", () => ({
  useLibraryScreenState: (...args: unknown[]) => useLibraryScreenState(...args),
}));

vi.mock("../../../src/features/library/useCodeProjectsState", () => ({
  useCodeProjectsState: (...args: unknown[]) => useCodeProjectsState(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={en}>{children}</I18nContext.Provider>;
}

function createState() {
  return {
    tab: "tracks",
    handleTabChange: vi.fn(),
    logConnections: [],
    logConnectionError: null,
    setLogConnectionError: vi.fn(),
    showForm: true,
    setShowForm: vi.fn(),
    playlistEditorOpen: false,
    playlistEditorId: null,
    playlistName: "",
    setPlaylistName: vi.fn(),
    playlistTrackIds: [],
    openPlaylistEditor: vi.fn(),
    resetPlaylistEditor: vi.fn(),
    togglePlaylistTrack: vi.fn(),
    handleSavePlaylist: vi.fn(),
    refreshLogConnections: vi.fn(),
  };
}

function createProps() {
  return {
    tracks: [
      {
        id: "track-1",
        file: { availabilityState: "missing" },
        analysis: { bpm: null },
      },
      {
        id: "track-2",
        file: { availabilityState: "available" },
        analysis: { bpm: 126 },
      },
    ] as never,
    playlists: [],
    repositories: [
      { id: "repo-1", suggestedBpm: null },
      { id: "repo-2", suggestedBpm: 124 },
    ] as never,
    codeProjects: [],
    baseAssets: [],
    newlyImportedId: null,
    selectedTrackId: null,
    selectedPlaylistId: null,
    selectedRepositoryId: null,
    selectedBaseAssetId: null,
    activeTab: "tracks" as const,
    onTabChange: vi.fn(),
    trackLoading: false,
    repositoryLoading: false,
    baseAssetLoading: false,
    trackBusy: false,
    repositoryBusy: false,
    baseAssetBusy: false,
    trackError: null,
    repositoryError: null,
    baseAssetError: null,
    onImportTrack: vi.fn(async () => true),
    onImportRepository: vi.fn(async () => true),
    onImportBaseAsset: vi.fn(async () => true),
    onReanalyzeTrack: vi.fn(),
    onRelinkTrack: vi.fn(),
    onRelinkMissingTracks: vi.fn(async () => true),
    onReanalyzeRepository: vi.fn(),
    onDeleteTrack: vi.fn(async () => true),
    onDeleteRepository: vi.fn(async () => true),
    onSeedDemo: vi.fn(async () => undefined),
    onSavePlaylist: vi.fn(async () => true),
    onDeletePlaylist: vi.fn(),
    onSelectTrack: vi.fn(),
    onSelectPlaylist: vi.fn(),
    onSelectRepository: vi.fn(),
    onSelectBaseAsset: vi.fn(),
    onInspectTrack: vi.fn(),
    onInspectRepository: vi.fn(),
    onInspectBaseAsset: vi.fn(),
  };
}

describe("useLibraryScreenController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryScreenState.mockReturnValue(createState());
    useCodeProjectsState.mockReturnValue({
      projects: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      testConnection: vi.fn(),
    });
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  it("closes the form and refreshes connections after importing a file source", async () => {
    const state = createState();
    useLibraryScreenState.mockReturnValue(state);
    const props = createProps();
    const { result } = renderHook(() => useLibraryScreenController(props), { wrapper });

    await act(async () => {
      await result.current.handleImportRepository({
        sourceKind: "file",
        sourcePath: "/tmp/service.log",
        title: "service",
      } as never);
    });

    expect(props.onImportRepository).toHaveBeenCalled();
    expect(state.refreshLogConnections).toHaveBeenCalled();
    expect(state.setShowForm).toHaveBeenCalledWith(false);
  });

  it("builds orphan cleanup action for tracks and deletes the matching entries", async () => {
    const state = createState();
    useLibraryScreenState.mockReturnValue(state);
    const props = createProps();
    const { result } = renderHook(() => useLibraryScreenController(props), { wrapper });

    const cleanupAction = result.current.toolbarActions.find(
      (action) => action.id === "clean-track-orphans",
    );

    expect(cleanupAction).toBeDefined();

    await act(async () => {
      await cleanupAction?.onClick();
    });

    expect(confirm).toHaveBeenCalled();
    expect(props.onDeleteTrack).toHaveBeenCalledWith("track-1");
    expect(props.onDeleteTrack).toHaveBeenCalledTimes(1);
  });

  it("surfaces connection deletion failures through the state setter", async () => {
    const state = createState();
    useLibraryScreenState.mockReturnValue(state);
    deleteLogSourceConnection.mockRejectedValueOnce(new Error("delete failed"));

    const { result } = renderHook(() => useLibraryScreenController(createProps()), { wrapper });

    await act(async () => {
      await result.current.handleDeleteLogConnection("conn-1");
    });

    expect(state.setLogConnectionError).toHaveBeenCalledWith("delete failed");
  });
});
