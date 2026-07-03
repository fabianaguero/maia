import type {
  AppContentActionBundles,
  AppContentControllerActionBundles,
} from "./appContentControllerTypes";

export function buildAppContentControllerActionBundles(
  actionBundles: AppContentActionBundles,
): AppContentControllerActionBundles {
  return {
    monitorActions: {
      startReplaySession: actionBundles.monitorActions.startReplaySession,
      startLiveSession: actionBundles.monitorActions.startLiveSession,
      openMonitoredRepo: actionBundles.monitorActions.openMonitoredRepo,
    },
    catalogActions: {
      handleImportTrack: actionBundles.catalogActions.handleImportTrack,
      handleImportRepository: actionBundles.catalogActions.handleImportRepository,
      handleImportBaseAsset: actionBundles.catalogActions.handleImportBaseAsset,
      handleImportComposition: actionBundles.catalogActions.handleImportComposition,
      handleReanalyzeTrack: actionBundles.catalogActions.handleReanalyzeTrack,
      handleRelinkTrack: actionBundles.catalogActions.handleRelinkTrack,
      handleRelinkMissingTracks: actionBundles.catalogActions.handleRelinkMissingTracks,
      handleReanalyzeRepository: actionBundles.catalogActions.handleReanalyzeRepository,
      handleDeleteTrack: actionBundles.catalogActions.handleDeleteTrack,
      handleDeleteRepository: actionBundles.catalogActions.handleDeleteRepository,
      handleUpdateTrackPerformance: actionBundles.catalogActions.handleUpdateTrackPerformance,
      handleUpdateTrackAnalysis: actionBundles.catalogActions.handleUpdateTrackAnalysis,
      handleSavePlaylist: actionBundles.catalogActions.handleSavePlaylist,
      handleDeletePlaylist: actionBundles.catalogActions.handleDeletePlaylist,
    },
    selectionActions: {
      selectSimpleTrack: actionBundles.selectionActions.selectSimpleTrack,
      selectSimpleRepository: actionBundles.selectionActions.selectSimpleRepository,
      selectTrack: actionBundles.selectionActions.selectTrack,
      selectPlaylist: actionBundles.selectionActions.selectPlaylist,
      selectRepository: actionBundles.selectionActions.selectRepository,
      selectBaseAsset: actionBundles.selectionActions.selectBaseAsset,
      selectComposition: actionBundles.selectionActions.selectComposition,
      inspectTrack: actionBundles.selectionActions.inspectTrack,
      inspectRepository: actionBundles.selectionActions.inspectRepository,
      inspectBaseAsset: actionBundles.selectionActions.inspectBaseAsset,
      inspectComposition: actionBundles.selectionActions.inspectComposition,
      goLibrary: actionBundles.selectionActions.goLibrary,
      goCompose: actionBundles.selectionActions.goCompose,
      startSimpleMonitoring: actionBundles.selectionActions.startSimpleMonitoring,
      startSimpleWizardSession: actionBundles.selectionActions.startSimpleWizardSession,
    },
    navigationActions: {
      handleOpenConnections: actionBundles.navigationActions.handleOpenConnections,
      handlePillarChange: actionBundles.navigationActions.handlePillarChange,
      handleHideToBackground: actionBundles.navigationActions.handleHideToBackground,
    },
  };
}
