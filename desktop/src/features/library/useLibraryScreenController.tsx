import { useT } from "../../i18n/I18nContext";
import type { LibraryScreenControllerInput } from "./libraryScreenControllerTypes";
import { buildLibraryScreenViewModel } from "./libraryScreenViewModel";
import { countMissingLibraryTracks } from "./libraryScreenToolbarRuntime";
import {
  buildLibraryScreenControllerHookResult,
  buildLibraryScreenImportActionsHookInput,
  buildLibraryScreenStateHookInput,
  buildLibraryScreenToolbarActionsHookInput,
  buildLibraryScreenViewModelInput,
} from "./libraryScreenControllerHookRuntime";
import { useLibraryScreenState } from "./useLibraryScreenState";
import { useLibraryScreenImportActions } from "./useLibraryScreenImportActions";
import { useLibraryScreenToolbarActions } from "./useLibraryScreenToolbarActions";
import { useCodeProjectsState } from "./useCodeProjectsState";

export function useLibraryScreenController({
  tracks,
  playlists,
  repositories,
  baseAssets,
  newlyImportedId,
  selectedTrackId,
  selectedPlaylistId,
  selectedRepositoryId,
  selectedBaseAssetId,
  activeTab,
  onTabChange,
  trackLoading,
  repositoryLoading,
  baseAssetLoading,
  trackError,
  repositoryError,
  baseAssetError,
  onImportTrack,
  onImportRepository,
  onImportBaseAsset,
  onReanalyzeTrack,
  onRelinkTrack,
  onRelinkMissingTracks,
  onReanalyzeRepository,
  onDeleteTrack,
  onDeleteRepository,
  onSeedDemo,
  onSavePlaylist,
  onDeletePlaylist,
  onSelectTrack,
  onSelectPlaylist,
  onSelectRepository,
  onSelectBaseAsset,
  onInspectTrack,
  onInspectRepository,
  onInspectBaseAsset,
}: LibraryScreenControllerInput) {
  const t = useT();
  const {
    tab,
    handleTabChange,
    logConnections,
    logConnectionError,
    setLogConnectionError,
    showForm,
    setShowForm,
    playlistEditorOpen,
    playlistEditorId,
    playlistName,
    setPlaylistName,
    playlistTrackIds,
    openPlaylistEditor,
    resetPlaylistEditor,
    togglePlaylistTrack,
    handleSavePlaylist,
    refreshLogConnections,
  } = useLibraryScreenState(
    buildLibraryScreenStateHookInput({
      activeTab,
      onSavePlaylist,
      onSelectPlaylist,
      onTabChange,
      playlists,
      selectedPlaylistId,
    }),
  );

  const {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleDeleteLogConnection,
  } = useLibraryScreenImportActions(
    buildLibraryScreenImportActionsHookInput({
      onImportTrack,
      onImportRepository,
      onImportBaseAsset,
      refreshLogConnections,
      setShowForm,
      setLogConnectionError,
    }),
  );

  const missingTrackCount = countMissingLibraryTracks(tracks);
  const { projects: codeProjects } = useCodeProjectsState();

  const viewModel = buildLibraryScreenViewModel(
    buildLibraryScreenViewModelInput({
      activeTab: tab,
      showForm,
      tracksCount: tracks.length,
      repositoriesCount: repositories.length,
      codeProjectsCount: codeProjects.length,
      logConnectionsCount: logConnections.length,
      baseAssetsCount: baseAssets.length,
      missingTrackCount,
      trackLoading,
      repositoryLoading,
      baseAssetLoading,
      trackError,
      repositoryError,
      logConnectionError,
      baseAssetError,
      t,
    }),
  );

  const toolbarActions = useLibraryScreenToolbarActions(
    buildLibraryScreenToolbarActionsHookInput({
      t,
      tab,
      showForm,
      setShowForm,
      viewModel,
      missingTrackCount,
      tracks,
      repositories,
      openPlaylistEditor,
      onSeedDemo,
      onRelinkMissingTracks,
      onDeleteTrack,
      onDeleteRepository,
    }),
  );

  return buildLibraryScreenControllerHookResult({
    t,
    tab,
    viewModel,
    toolbarActions,
    showForm,
    setShowForm,
    handleTabChange,
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    refreshLogConnections,
    logConnections,
    playlistEditorOpen,
    playlistEditorId,
    playlistName,
    setPlaylistName,
    playlistTrackIds,
    openPlaylistEditor,
    resetPlaylistEditor,
    togglePlaylistTrack,
    handleSavePlaylist,
    handleDeleteLogConnection,
    selectedTrackId,
    selectedPlaylistId,
    selectedRepositoryId,
    selectedBaseAssetId,
    newlyImportedId,
    tracks,
    playlists,
    repositories,
    baseAssets,
    onDeleteTrack,
    onInspectTrack,
    onReanalyzeTrack,
    onRelinkTrack,
    onSelectTrack,
    onDeleteRepository,
    onInspectRepository,
    onReanalyzeRepository,
    onSelectRepository,
    onInspectBaseAsset,
    onSelectBaseAsset,
    onDeletePlaylist,
    onSelectPlaylist,
  });
}
