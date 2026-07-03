import { describe, expect, it, vi } from "vitest";

import { buildAppContentControllerActionBundles } from "../../src/hooks/appContentControllerBundleRuntime";

describe("appContentControllerBundleRuntime", () => {
  it("reduces the full action bundle to the controller surface", () => {
    const input = {
      notify: vi.fn(),
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
    };

    const output = buildAppContentControllerActionBundles(input as never);

    expect(output.monitorActions.startLiveSession).toBe(input.monitorActions.startLiveSession);
    expect(output.selectionActions.startSimpleMonitoring).toBe(
      input.selectionActions.startSimpleMonitoring,
    );
    expect(output.navigationActions.handleOpenConnections).toBe(
      input.navigationActions.handleOpenConnections,
    );
  });
});
