import {
  buildAppContentStatusViewModel,
  resolveAppContentRouteState,
  resolveAppMutationState,
} from "../appContentRuntime";
import { useNotify } from "../components/NotificationSystem";
import { useBaseAssets } from "../hooks/useBaseAssets";
import { useAppCatalogActions } from "../hooks/useAppCatalogActions";
import { useAppContentBootstrap } from "../hooks/useAppContentBootstrap";
import { useAppContentNavigationActions } from "../hooks/useAppContentNavigationActions";
import { useAppContentShellState } from "../hooks/useAppContentShellState";
import { useAppContentSessionEffects } from "../hooks/useAppContentSessionEffects";
import { useAppMonitorActions } from "../hooks/useAppMonitorActions";
import { useAppSelectionActions } from "../hooks/useAppSelectionActions";
import { useCompositionResults } from "../hooks/useCompositionResults";
import { useLibrary } from "../hooks/useLibrary";
import { useRepositories } from "../hooks/useRepositories";
import { useSessions } from "../hooks/useSessions";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import { useMonitor } from "../features/monitor/MonitorContext";
import { useModeTransition } from "../features/simple/ModeTransition";
import { useUserMode } from "../features/simple/UserModeContext";

export function useAppContentController() {
  const { notify } = useNotify();
  const { userMode } = useUserMode();
  const { isTransitioning } = useModeTransition();
  const { manifest, health, booting } = useAppContentBootstrap();
  const {
    screen,
    setScreen,
    pillar,
    setPillar,
    libraryTab,
    setLibraryTab,
    analysisMode,
    setAnalysisMode,
    isDark,
    setIsDark,
    lang,
    setLang,
    newlyImportedId,
    setNewlyImportedId,
  } = useAppContentShellState();
  const t = lang === "es" ? es : en;
  const library = useLibrary();
  const repositories = useRepositories();
  const baseAssets = useBaseAssets();
  const compositions = useCompositionResults();
  const monitor = useMonitor();
  const sessions = useSessions();
  const refreshSessionBookmarks = sessions.refreshBookmarks;

  const { effectivePillar, effectiveScreen } = resolveAppContentRouteState(
    userMode,
    pillar,
    screen,
  );

  useAppContentSessionEffects({
    screen,
    refreshSessionBookmarks,
  });

  const { armTrackBase, armPlaylistBase, startReplaySession, startLiveSession, openMonitoredRepo } =
    useAppMonitorActions({
      t,
      library,
      repositories,
      sessions,
      monitor,
      notify,
      setAnalysisMode,
      setScreen,
      setPillar,
    });
  const {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleImportComposition,
    handleReanalyzeTrack,
    handleRelinkTrack,
    handleRelinkMissingTracks,
    handleReanalyzeRepository,
    handleDeleteTrack,
    handleDeleteRepository,
    handleUpdateTrackPerformance,
    handleUpdateTrackAnalysis,
    handleSavePlaylist,
    handleDeletePlaylist,
  } = useAppCatalogActions({
    t,
    notify,
    setNewlyImportedId,
    setAnalysisMode,
    setScreen,
    library,
    repositories,
    baseAssets,
    compositions,
  });
  const {
    selectSimpleTrack,
    selectSimpleRepository,
    selectTrack,
    selectPlaylist,
    selectRepository,
    selectBaseAsset,
    selectComposition,
    inspectTrack,
    inspectRepository,
    inspectBaseAsset,
    inspectComposition,
    goLibrary,
    goCompose,
    startSimpleMonitoring,
    startSimpleWizardSession,
  } = useAppSelectionActions({
    armPlaylistBase,
    armTrackBase,
    library,
    repositories,
    baseAssets,
    compositions,
    setAnalysisMode,
    setPillar,
    setScreen,
  });
  const { handleOpenConnections, handlePillarChange, handleHideToBackground } =
    useAppContentNavigationActions({
      userMode,
      notify,
      t,
      setPillar,
      setScreen,
      setLibraryTab,
    });

  const { analyzerLabel, detailDeckLabel, screenLabel, selectedItemTitle } =
    buildAppContentStatusViewModel(
      {
        analysisMode,
        baseAsset: baseAssets.selectedBaseAsset,
        booting,
        composition: compositions.selectedComposition,
        health,
        playlistName: library.selectedPlaylist?.name ?? null,
        repository: repositories.selectedRepository,
        screen,
        track: library.selectedTrack,
      },
      t,
    );

  const { isMutating, mutateLabel } = resolveAppMutationState(
    {
      baseAssetsMutating: baseAssets.mutating,
      compositionsMutating: compositions.mutating,
      libraryMutating: library.mutating,
      repositoriesMutating: repositories.mutating,
    },
    t,
  );

  return {
    t,
    userMode,
    isTransitioning,
    manifest,
    health,
    booting,
    screen,
    pillar,
    libraryTab,
    analysisMode,
    isDark,
    lang,
    newlyImportedId,
    library,
    repositories,
    baseAssets,
    compositions,
    monitor,
    sessions,
    effectivePillar,
    effectiveScreen,
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleImportComposition,
    handleReanalyzeTrack,
    handleRelinkTrack,
    handleRelinkMissingTracks,
    handleReanalyzeRepository,
    handleDeleteTrack,
    handleDeleteRepository,
    handleUpdateTrackPerformance,
    handleUpdateTrackAnalysis,
    handleSavePlaylist,
    handleDeletePlaylist,
    selectSimpleTrack,
    selectSimpleRepository,
    selectTrack,
    selectPlaylist,
    selectRepository,
    selectBaseAsset,
    selectComposition,
    inspectTrack,
    inspectRepository,
    inspectBaseAsset,
    inspectComposition,
    goLibrary,
    goCompose,
    startSimpleMonitoring,
    startSimpleWizardSession,
    startReplaySession,
    startLiveSession,
    openMonitoredRepo,
    handleOpenConnections,
    handlePillarChange,
    handleHideToBackground,
    setLang,
    setIsDark,
    setLibraryTab,
    setAnalysisMode,
    analyzerLabel,
    detailDeckLabel,
    screenLabel,
    selectedItemTitle,
    isMutating,
    mutateLabel,
  };
}
