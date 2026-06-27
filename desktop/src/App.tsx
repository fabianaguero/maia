import { Globe2, Moon, Sun } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

import { AppSectionContent } from "./AppSectionContent";
import { loadBootstrapManifest, runAnalyzerRequest } from "./api/analyzer";
import { AppSidebar } from "./components/AppSidebar";
import { BrandLockup, BrandWordmark } from "./components/Branding";
import { useMonitor } from "./features/monitor/MonitorContext";
import { UserModeProvider, useUserMode } from "./features/simple/UserModeContext";
import { useModeTransition } from "./features/simple/ModeTransition";
import { useSessions } from "./hooks/useSessions";
import { useBaseAssets } from "./hooks/useBaseAssets";
import { useCompositionResults } from "./hooks/useCompositionResults";
import { useAppCatalogActions } from "./hooks/useAppCatalogActions";
import { useLibrary } from "./hooks/useLibrary";
import { useAppMonitorActions } from "./hooks/useAppMonitorActions";
import { useAppSelectionActions } from "./hooks/useAppSelectionActions";
import { useRepositories } from "./hooks/useRepositories";
import { NotificationProvider, useNotify } from "./components/NotificationSystem";
import { Web3Spinner } from "./components/Web3Spinner";
import { MonitorWaveformBar } from "./components/MonitorWaveformBar";
import { en } from "./i18n/en";
import { es } from "./i18n/es";
import { I18nContext } from "./i18n/I18nContext";
import {
  buildAppContentStatusViewModel,
  resolveAppContentRouteState,
  resolveAppMutationState,
  resolveAppOpenConnectionsState,
  resolveAppPillarNavigationState,
} from "./appContentRuntime";
import {
  createHealthRequest,
  type AnalyzerResponse,
  type BootstrapManifest,
} from "./contracts";
import type {
  AnalyzerViewMode,
  AppPillar,
  AppScreen,
} from "./types/library";
import type { LibraryTab } from "./features/library/LibraryScreen";

export default function App() {
  return (
    <NotificationProvider>
      <UserModeProvider>
        <AppContent />
      </UserModeProvider>
    </NotificationProvider>
  );
}

function AppContent() {
  const { notify } = useNotify();
  const { userMode } = useUserMode();
  const { isTransitioning } = useModeTransition();
  const [manifest, setManifest] = useState<BootstrapManifest | null>(null);
  const [health, setHealth] = useState<AnalyzerResponse | null>(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<AppScreen>("library");
  const [pillar, setPillar] = useState<AppPillar>("curate");
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("tracks");
  const [analysisMode, setAnalysisMode] = useState<AnalyzerViewMode>("track");
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [newlyImportedId, setNewlyImportedId] = useState<string | null>(null);
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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
  }, [isDark]);

  useEffect(() => {
    if (screen === "session") {
      void refreshSessionBookmarks();
    }
  }, [refreshSessionBookmarks, screen]);

  const {
    armTrackBase,
    armPlaylistBase,
    startReplaySession,
    startLiveSession,
    openMonitoredRepo,
  } = useAppMonitorActions({
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

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));

      try {
        const [nextManifest, nextHealth] = await Promise.all([
          loadBootstrapManifest(),
          Promise.race([runAnalyzerRequest(createHealthRequest()), timeout]),
        ]);

        if (!active) {
          return;
        }

        setManifest(nextManifest ?? undefined);
        if (nextHealth) setHealth(nextHealth);
      } catch {
        // silently continue — manifest fallback is already handled inside loadBootstrapManifest
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  function handleOpenConnections() {
    const nextState = resolveAppOpenConnectionsState();
    setPillar(nextState.pillar);
    setScreen(nextState.screen);
    setLibraryTab(nextState.libraryTab);
  }

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

  return (
    <I18nContext.Provider value={t}>
      <Web3Spinner
        visible={booting || isMutating}
        label={booting ? t.appShell.bootingMaia : mutateLabel}
      />
      <main className="app-shell">
        <header className="topbar">
          <div className="topbar-brand">
            {userMode === "expert" && <BrandWordmark className="topbar-wordmark" />}
            {userMode === "simple" && (
              <BrandLockup
                className="topbar-brand-lockup"
                wordmarkClassName="topbar-wordmark"
              />
            )}
            {userMode === "expert" && (
              <div className="topbar-copy">
                <span className="topbar-subtitle">{t.workspace}</span>
              </div>
            )}
          </div>

          <div className="topbar-controls">
            <button
              type="button"
              className="control-button"
              onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
              title={t.controls.lang}
            >
              <Globe2 size={16} />
              <span className="sr-only">
                {lang === "en" ? t.controls.spanish : t.controls.english}
              </span>
            </button>
            <button
              type="button"
              className="control-button"
              onClick={() => setIsDark((v) => !v)}
              title={isDark ? t.controls.light : t.controls.dark}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {selectedItemTitle && selectedItemTitle.trim() && userMode === "expert" && (
          <section className="waveform-section">
            <div className="waveform-header">
              <div>
                <p className="waveform-label">{t.appShell.nowPlaying}</p>
                <h3 className="waveform-track-title">{selectedItemTitle}</h3>
              </div>
              <div className="status-pills">
                <div className="status-pill">
                  <span>{screenLabel}</span>
                  <strong>{detailDeckLabel}</strong>
                </div>
                {monitor.session && (
                  <div className="status-pill status-pill--live">
                    <span>{t.appShell.live}</span>
                    <strong>
                      {monitor.metrics.totalAnomalies}{" "}
                      {t.simpleMode.monitor.anomalies.toLowerCase()}
                    </strong>
                  </div>
                )}
              </div>
            </div>
            <MonitorWaveformBar tracks={library.tracks} />
          </section>
        )}

        <section
          className={`app-main role--${pillar} ${isTransitioning ? "opacity-transition" : ""}`}
          key={`${userMode}-${pillar}`}
        >
          <AppSidebar
            currentPillar={effectivePillar}
            onPillarChange={(p) => {
              const nextState = resolveAppPillarNavigationState(userMode, p);
              setPillar(nextState.pillar);
              setScreen(nextState.screen);
            }}
            trackCount={library.tracks.length}
            repositoryCount={repositories.repositories.length}
            baseAssetCount={baseAssets.baseAssets.length}
            compositionCount={compositions.compositions.length}
            selectedItemTitle={selectedItemTitle}
            monitorSession={monitor.session}
            monitorMetrics={monitor.metrics}
            onStopMonitor={() => void monitor.stopSession()}
            onOpenMonitoredRepo={openMonitoredRepo}
            onOpenConnections={handleOpenConnections}
            connectionsActive={
              pillar === "curate" && screen === "library" && libraryTab === "connections"
            }
            onHideToBackground={() => {
              if (isTauri()) {
                void invoke("hide_window").catch(() => {});
                notify(
                  "info",
                  t.appShell.monitoringBackgroundTitle,
                  t.appShell.monitoringBackgroundBody,
                );
              }
            }}
          />

          {health?.warnings.length ? (
            <section className="notice inline-notice">
              {health.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </section>
          ) : null}

          <Suspense
            fallback={
              <section className="notice inline-notice">
                <p>{t.simpleMode.status.loading}</p>
              </section>
            }
          >
            <AppSectionContent
              userMode={userMode}
              effectivePillar={effectivePillar}
              effectiveScreen={effectiveScreen}
              monitorSession={monitor.session}
              monitorIsPlayback={monitor.isPlayback}
              monitorPlaybackProgress={monitor.playbackProgress}
              manifest={manifest}
              musicStyles={manifest?.musicStyles ?? []}
              baseAssetCategories={manifest?.baseAssetCategories ?? []}
              defaultTrackMusicStyleId={manifest?.defaultTrackMusicStyleId}
              defaultBaseAssetCategoryId={manifest?.defaultBaseAssetCategoryId}
              libraryTab={libraryTab}
              tracks={library.tracks}
              playlists={library.playlists}
              repositories={repositories.repositories}
              baseAssets={baseAssets.baseAssets}
              compositions={compositions.compositions}
              newlyImportedId={newlyImportedId}
              selectedTrack={library.selectedTrack}
              selectedTrackId={library.selectedTrackId}
              selectedPlaylistId={library.selectedPlaylistId}
              selectedRepository={repositories.selectedRepository}
              selectedRepositoryId={repositories.selectedRepositoryId}
              selectedBaseAsset={baseAssets.selectedBaseAsset}
              selectedBaseAssetId={baseAssets.selectedBaseAssetId}
              selectedComposition={compositions.selectedComposition}
              selectedCompositionId={compositions.selectedCompositionId}
              trackLoading={library.loading}
              repositoryLoading={repositories.loading}
              baseAssetLoading={baseAssets.loading}
              compositionLoading={compositions.loading}
              trackBusy={library.mutating}
              repositoryBusy={repositories.mutating}
              baseAssetBusy={baseAssets.mutating}
              compositionBusy={compositions.mutating}
              trackError={library.error}
              repositoryError={repositories.error}
              baseAssetError={baseAssets.error}
              compositionError={compositions.error}
              analysisMode={analysisMode}
              analyzerLabel={analyzerLabel}
              sessionBookmarksBySessionId={sessions.sessionBookmarksBySessionId}
              sessions={sessions.sessions}
              selectedSessionId={sessions.selectedSessionId}
              sessionsLoading={sessions.loading}
              sessionsMutating={sessions.mutating}
              sessionsError={sessions.error}
              onImportTrack={handleImportTrack}
              onImportRepository={handleImportRepository}
              onImportBaseAsset={handleImportBaseAsset}
              onImportComposition={handleImportComposition}
              onReanalyzeTrack={handleReanalyzeTrack}
              onRelinkTrack={handleRelinkTrack}
              onRelinkMissingTracks={handleRelinkMissingTracks}
              onReanalyzeRepository={handleReanalyzeRepository}
              onDeleteTrack={handleDeleteTrack}
              onDeleteRepository={handleDeleteRepository}
              onSeedDemo={library.seedLibrary}
              onSavePlaylist={handleSavePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onSelectSimpleTrack={selectSimpleTrack}
              onSelectSimpleRepository={selectSimpleRepository}
              onSelectTrack={selectTrack}
              onSelectPlaylist={selectPlaylist}
              onSelectRepository={selectRepository}
              onSelectBaseAsset={selectBaseAsset}
              onSelectComposition={selectComposition}
              onInspectTrack={inspectTrack}
              onInspectRepository={inspectRepository}
              onInspectBaseAsset={inspectBaseAsset}
              onInspectComposition={inspectComposition}
              onGoLibrary={goLibrary}
              onGoCompose={goCompose}
              onTabChange={setLibraryTab}
              onChangeAnalysisMode={setAnalysisMode}
              onUpdateTrackPerformance={handleUpdateTrackPerformance}
              onUpdateTrackAnalysis={handleUpdateTrackAnalysis}
              onStartSimpleMonitoring={startSimpleMonitoring}
              onStartSimpleWizardSession={startSimpleWizardSession}
              onStartSession={startLiveSession}
              onStopSession={() => monitor.stopSession()}
              onResumeSession={(sessionId) => sessions.setSelectedSessionId(sessionId)}
              onPlaybackSession={startReplaySession}
              onReplayBookmark={(session, replayWindowIndex) =>
                startReplaySession(session, replayWindowIndex)
              }
              onDeleteSession={(sessionId) => sessions.removeSession(sessionId)}
              onSelectSession={(sessionId) => sessions.setSelectedSessionId(sessionId)}
            />
          </Suspense>
        </section>
      </main>
    </I18nContext.Provider>
  );
}
