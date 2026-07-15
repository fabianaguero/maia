import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildLibraryScreenViewModel,
  resolveLibraryConnectionKindLabel,
  resolveLibrarySourceKindLabel,
  resolveLibraryStatusBadgeClass,
  resolveLibraryStatusLabel,
} from "../../../src/features/library/libraryScreenViewModel";

describe("libraryScreenViewModel", () => {
  it("builds tabs and track toolbar state", () => {
    const model = buildLibraryScreenViewModel({
      activeTab: "tracks",
      showForm: false,
      counts: {
        tracks: 4,
        repositories: 2,
        codeProjects: 0,
        logConnections: 1,
        baseAssets: 3,
        missingTracks: 2,
      },
      loadingState: {
        trackLoading: false,
        repositoryLoading: false,
        baseAssetLoading: false,
      },
      errorState: {
        trackError: null,
        repositoryError: null,
        logConnectionError: null,
        baseAssetError: null,
      },
      t: en,
    });

    expect(model.tabs).toEqual([
      { id: "tracks", label: en.library.sounds, count: 4 },
      { id: "sources", label: en.library.logSources, count: 2 },
      { id: "projects", label: "Code Projects", count: 0 },
      { id: "connections", label: en.library.connections, count: 1 },
      { id: "bases", label: en.library.profiles, count: 3 },
    ]);
    expect(model.toolbar).toMatchObject({
      eyebrow: en.library.sounds,
      count: 4,
      title: en.library.toolbarSoundsTitle,
      note: en.library.toolbarSoundsNote,
      formToggleLabel: en.library.importTrack,
      showSeedDemo: true,
      showNewPlaylist: true,
      showRelinkMissing: true,
      showCleanOrphans: true,
    });
    expect(model.emptyState).toEqual({
      title: en.library.noTracksYet,
      body: en.library.noTracksBody,
      actionLabel: en.library.addTrack,
    });
  });

  it("switches toolbar and error/loading state for connections", () => {
    const model = buildLibraryScreenViewModel({
      activeTab: "connections",
      showForm: true,
      counts: {
        tracks: 0,
        repositories: 0,
        codeProjects: 0,
        logConnections: 5,
        baseAssets: 0,
        missingTracks: 0,
      },
      loadingState: {
        trackLoading: false,
        repositoryLoading: true,
        baseAssetLoading: false,
      },
      errorState: {
        trackError: null,
        repositoryError: "repo failed",
        logConnectionError: "connector failed",
        baseAssetError: null,
      },
      t: en,
    });

    expect(model.loading).toBe(false);
    expect(model.error).toBe("connector failed");
    expect(model.toolbar).toMatchObject({
      eyebrow: en.library.connections,
      count: 5,
      title: en.library.toolbarConnectionsTitle,
      note: en.library.toolbarConnectionsNote,
      formToggleLabel: en.library.cancel,
      showSeedDemo: false,
      showNewPlaylist: false,
      showRelinkMissing: false,
      showCleanOrphans: false,
    });
    expect(model.emptyState.actionLabel).toBe(en.library.addConnection);
  });

  it("resolves source and connection labels and status display", () => {
    expect(resolveLibrarySourceKindLabel("directory", en)).toBe(en.library.directory);
    expect(resolveLibrarySourceKindLabel("custom-source", en)).toBe("custom-source");
    expect(resolveLibraryConnectionKindLabel("gcp_cloud_run", en)).toBe(
      en.simpleMode.connections.gcpCloudRun,
    );
    expect(resolveLibraryConnectionKindLabel("unknown-kind", en)).toBe("unknown-kind");
    expect(resolveLibraryStatusBadgeClass("ready")).toBe("status-badge--ready");
    expect(resolveLibraryStatusBadgeClass("analyzed")).toBe("status-badge--analyzed");
    expect(resolveLibraryStatusBadgeClass("pending")).toBe("status-badge--pending");
    expect(resolveLibraryStatusLabel("ready", en)).toBe(en.library.statusReady);
    expect(resolveLibraryStatusLabel("analyzed", en)).toBe(en.library.statusAnalyzed);
    expect(resolveLibraryStatusLabel("pending", en)).toBe(en.library.statusPending);
  });
});
