import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildLibraryScreenControllerHookResult,
  buildLibraryScreenImportActionsHookInput,
  buildLibraryScreenStateHookInput,
  buildLibraryScreenToolbarActionsHookInput,
  buildLibraryScreenViewModelInput,
} from "../../../src/features/library/libraryScreenControllerHookRuntime";

describe("libraryScreenControllerHookRuntime", () => {
  it("builds state and import-action hook inputs from controller props", () => {
    const stateInput = buildLibraryScreenStateHookInput({
      activeTab: "tracks",
      onSavePlaylist: vi.fn(async () => true),
      onSelectPlaylist: vi.fn(),
      onTabChange: vi.fn(),
      playlists: [],
      selectedPlaylistId: null,
    });
    const importInput = buildLibraryScreenImportActionsHookInput({
      onImportTrack: vi.fn(async () => true),
      onImportRepository: vi.fn(async () => true),
      onImportBaseAsset: vi.fn(async () => true),
      refreshLogConnections: vi.fn(async () => undefined),
      setShowForm: vi.fn(),
      setLogConnectionError: vi.fn(),
    });

    expect(stateInput.activeTab).toBe("tracks");
    expect(stateInput.playlists).toEqual([]);
    expect(importInput.onImportRepository).toBeTypeOf("function");
    expect(importInput.refreshLogConnections).toBeTypeOf("function");
  });

  it("builds view-model and toolbar inputs from derived library state", () => {
    const viewModelInput = buildLibraryScreenViewModelInput({
      activeTab: "connections",
      showForm: true,
      tracksCount: 4,
      repositoriesCount: 2,
      logConnectionsCount: 3,
      baseAssetsCount: 1,
      missingTrackCount: 1,
      trackLoading: false,
      repositoryLoading: false,
      baseAssetLoading: false,
      trackError: null,
      repositoryError: null,
      logConnectionError: "oops",
      baseAssetError: null,
      t: en,
    });
    const toolbarInput = buildLibraryScreenToolbarActionsHookInput({
      t: en,
      tab: "tracks",
      showForm: false,
      setShowForm: vi.fn(),
      viewModel: {
        toolbar: {
          showSeedDemo: true,
          showNewPlaylist: true,
          showRelinkMissing: true,
          showCleanOrphans: true,
          formToggleLabel: "Import",
        },
      } as never,
      missingTrackCount: 1,
      tracks: [{ id: "track-1" }] as never,
      repositories: [{ id: "repo-1" }] as never,
      openPlaylistEditor: vi.fn(),
      onSeedDemo: vi.fn(async () => undefined),
      onRelinkMissingTracks: vi.fn(async () => true),
      onDeleteTrack: vi.fn(async () => true),
      onDeleteRepository: vi.fn(async () => true),
    });
    const result = buildLibraryScreenControllerHookResult({
      t: en,
      tab: "tracks",
      viewModel: {
        toolbar: {
          formToggleLabel: "Import",
        },
      } as never,
      toolbarActions: [],
    });

    expect(viewModelInput.counts.logConnections).toBe(3);
    expect(viewModelInput.errorState.logConnectionError).toBe("oops");
    expect(toolbarInput.missingTrackCount).toBe(1);
    expect(toolbarInput.t).toBe(en);
    expect(result.tab).toBe("tracks");
  });
});
