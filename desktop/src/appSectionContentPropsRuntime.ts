import type { AppCurateSectionProps } from "./AppCurateSection";
import type { AppSectionContentProps } from "./AppSectionContent";
import type { AppSessionSectionProps } from "./AppSessionSection";

export function buildAppCurateSectionProps(
  props: AppSectionContentProps,
  state: {
    showSimpleWizard: boolean;
    showSimpleLibrary: boolean;
    showExpertLibrary: boolean;
  },
): AppCurateSectionProps {
  return {
    userMode: props.userMode,
    showSimpleWizard: state.showSimpleWizard,
    showSimpleLibrary: state.showSimpleLibrary,
    showExpertLibrary: state.showExpertLibrary,
    manifest: props.manifest,
    musicStyles: props.musicStyles,
    baseAssetCategories: props.baseAssetCategories,
    defaultTrackMusicStyleId: props.defaultTrackMusicStyleId,
    defaultBaseAssetCategoryId: props.defaultBaseAssetCategoryId,
    libraryTab: props.libraryTab,
    tracks: props.tracks,
    playlists: props.playlists,
    repositories: props.repositories,
    baseAssets: props.baseAssets,
    compositions: props.compositions,
    newlyImportedId: props.newlyImportedId,
    selectedTrackId: props.selectedTrackId,
    selectedPlaylistId: props.selectedPlaylistId,
    selectedRepositoryId: props.selectedRepositoryId,
    selectedBaseAssetId: props.selectedBaseAssetId,
    selectedCompositionId: props.selectedCompositionId,
    trackLoading: props.trackLoading,
    repositoryLoading: props.repositoryLoading,
    baseAssetLoading: props.baseAssetLoading,
    compositionLoading: props.compositionLoading,
    trackBusy: props.trackBusy,
    repositoryBusy: props.repositoryBusy,
    baseAssetBusy: props.baseAssetBusy,
    compositionBusy: props.compositionBusy,
    trackError: props.trackError,
    repositoryError: props.repositoryError,
    baseAssetError: props.baseAssetError,
    compositionError: props.compositionError,
    onImportTrack: props.onImportTrack,
    onImportRepository: props.onImportRepository,
    onImportBaseAsset: props.onImportBaseAsset,
    onImportComposition: props.onImportComposition,
    onReanalyzeTrack: props.onReanalyzeTrack,
    onRelinkTrack: props.onRelinkTrack,
    onRelinkMissingTracks: props.onRelinkMissingTracks,
    onReanalyzeRepository: props.onReanalyzeRepository,
    onDeleteTrack: props.onDeleteTrack,
    onDeleteRepository: props.onDeleteRepository,
    onSeedDemo: props.onSeedDemo,
    onSavePlaylist: props.onSavePlaylist,
    onDeletePlaylist: props.onDeletePlaylist,
    onSelectSimpleTrack: props.onSelectSimpleTrack,
    onSelectSimpleRepository: props.onSelectSimpleRepository,
    onSelectTrack: props.onSelectTrack,
    onSelectPlaylist: props.onSelectPlaylist,
    onSelectRepository: props.onSelectRepository,
    onSelectBaseAsset: props.onSelectBaseAsset,
    onSelectComposition: props.onSelectComposition,
    onInspectTrack: props.onInspectTrack,
    onInspectRepository: props.onInspectRepository,
    onInspectBaseAsset: props.onInspectBaseAsset,
    onInspectComposition: props.onInspectComposition,
    onStartSimpleMonitoring: props.onStartSimpleMonitoring,
    onStartSimpleWizardSession: props.onStartSimpleWizardSession,
    onTabChange: props.onTabChange,
  };
}

export function buildAppInspectSectionProps(props: AppSectionContentProps) {
  return {
    track: props.selectedTrack,
    repository: props.selectedRepository,
    baseAsset: props.selectedBaseAsset,
    availableTracks: props.tracks,
    availablePlaylists: props.playlists,
    availableRepositories: props.repositories,
    availableBaseAssets: props.baseAssets,
    mode: props.analysisMode,
    analyzerLabel: props.analyzerLabel,
    onChangeMode: props.onChangeAnalysisMode,
    onSelectTrack: props.onSelectTrack,
    onSelectRepository: props.onSelectRepository,
    onSelectBaseAsset: props.onSelectBaseAsset,
    onGoLibrary: props.onGoLibrary,
    onGoCompose: props.onGoCompose,
    onUpdateTrackPerformance: props.onUpdateTrackPerformance,
    onUpdateTrackAnalysis: props.onUpdateTrackAnalysis,
    trackMutating: props.trackBusy,
  };
}

export function buildAppComposeSectionProps(props: AppSectionContentProps) {
  return {
    composition: props.selectedComposition,
    compositions: props.compositions,
    baseAssets: props.baseAssets,
    tracks: props.tracks,
    playlists: props.playlists,
    repositories: props.repositories,
    analyzerLabel: props.analyzerLabel,
    busy: props.compositionBusy,
    onImportComposition: props.onImportComposition,
    onSelectComposition: props.onSelectComposition,
    onGoLibrary: props.onGoLibrary,
  };
}

export function buildAppSessionSectionProps(props: AppSectionContentProps): AppSessionSectionProps {
  return {
    monitorSession: props.monitorSession,
    monitorIsPlayback: props.monitorIsPlayback,
    monitorPlaybackProgress: props.monitorPlaybackProgress,
    tracks: props.tracks,
    playlists: props.playlists,
    repositories: props.repositories,
    sessions: props.sessions,
    sessionBookmarksBySessionId: props.sessionBookmarksBySessionId,
    selectedSessionId: props.selectedSessionId,
    sessionsLoading: props.sessionsLoading,
    sessionsMutating: props.sessionsMutating,
    sessionsError: props.sessionsError,
    onStartSession: props.onStartSession,
    onStopSession: props.onStopSession,
    onResumeSession: props.onResumeSession,
    onPlaybackSession: props.onPlaybackSession,
    onReplayBookmark: props.onReplayBookmark,
    onDeleteSession: props.onDeleteSession,
    onSelectSession: props.onSelectSession,
  };
}
