import { Suspense } from "react";

import { AppSectionContent } from "./AppSectionContent";
import { AppSidebar } from "./components/AppSidebar";
import { AppMonitorOverview } from "./components/AppMonitorOverview";
import { AppTopbar } from "./components/AppTopbar";
import { UserModeProvider, useUserMode } from "./features/simple/UserModeContext";
import { NotificationProvider } from "./components/NotificationSystem";
import { Web3Spinner } from "./components/Web3Spinner";
import { I18nContext } from "./i18n/I18nContext";
import { useAppContentController } from "./hooks/useAppContentController";

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
  const { userMode } = useUserMode();
  const {
    t,
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
    selectedItemTitle,
    isMutating,
    mutateLabel,
  } = useAppContentController();

  return (
    <I18nContext.Provider value={t}>
      <Web3Spinner
        visible={booting || isMutating}
        label={booting ? t.appShell.bootingMaia : mutateLabel}
      />
      <main className="app-shell">
        <AppTopbar
          userMode={userMode}
          isDark={isDark}
          lang={lang}
          workspaceLabel={t.workspace}
          controls={t.controls}
          onToggleLanguage={() => setLang((current) => (current === "en" ? "es" : "en"))}
          onToggleTheme={() => setIsDark((current) => !current)}
        />

        <AppMonitorOverview
          userMode={userMode}
          selectedItemTitle={selectedItemTitle}
          screenLabel={t.appShell.nowPlaying}
          detailDeckLabel={detailDeckLabel}
          liveLabel={t.appShell.live}
          hasMonitorSession={Boolean(monitor.session)}
          monitorMetrics={monitor.metrics}
          anomalyLabel={t.simpleMode.monitor.anomalies}
          tracks={library.tracks}
        />

        <section
          className={`app-main role--${pillar} ${isTransitioning ? "opacity-transition" : ""}`}
          key={`${userMode}-${pillar}`}
        >
          <AppSidebar
            currentPillar={effectivePillar}
            onPillarChange={handlePillarChange}
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
            onHideToBackground={handleHideToBackground}
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
