import { Globe2, Moon, Sun } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

import { loadBootstrapManifest, runAnalyzerRequest } from "./api/analyzer";
import { discoverRepositoryLogs } from "./api/repositories";
import type { PersistedSession } from "./api/sessions";
import { AppSidebar } from "./components/AppSidebar";
import { useMonitor } from "./features/monitor/MonitorContext";
import { UserModeProvider, useUserMode } from "./features/simple/UserModeContext";
import { useModeTransition } from "./features/simple/ModeTransition";
import { useSessions } from "./hooks/useSessions";
import { useBaseAssets } from "./hooks/useBaseAssets";
import { useCompositionResults } from "./hooks/useCompositionResults";
import { useLibrary } from "./hooks/useLibrary";
import { useRepositories } from "./hooks/useRepositories";
import { NotificationProvider, useNotify } from "./components/NotificationSystem";
import { Web3Spinner } from "./components/Web3Spinner";
import { MonitorWaveformBar } from "./components/MonitorWaveformBar";
import { en } from "./i18n/en";
import { es } from "./i18n/es";
import { I18nContext } from "./i18n/I18nContext";
import {
  createHealthRequest,
  type AnalyzerResponse,
  type BootstrapManifest,
  type HealthResponse,
} from "./contracts";
import { findPlaylistLeadTrack, resolvePlaylistTracks } from "./utils/playlist";
import { resolvePlayableTrackPath } from "./utils/track";
import type {
  AnalyzerViewMode,
  AppScreen,
  AppPillar,
  SaveBaseTrackPlaylistInput,
  ImportCompositionInput,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  ImportTrackInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "./types/library";
import type { LibraryTab } from "./features/library/LibraryScreen";

const ComposeScreen = lazy(() =>
  import("./features/compose/ComposeScreen").then((module) => ({
    default: module.ComposeScreen,
  })),
);
const InspectScreen = lazy(() =>
  import("./features/inspect/InspectScreen").then((module) => ({
    default: module.InspectScreen,
  })),
);
const LibraryScreen = lazy(() =>
  import("./features/library/LibraryScreen").then((module) => ({
    default: module.LibraryScreen,
  })),
);
const SessionScreen = lazy(() =>
  import("./features/session/SessionScreen").then((module) => ({
    default: module.SessionScreen,
  })),
);
const SimpleModeWizard = lazy(() =>
  import("./features/simple/SimpleModeWizard").then((module) => ({
    default: module.SimpleModeWizard,
  })),
);
const SimpleModeLibraryView = lazy(() =>
  import("./features/simple/SimpleModeLibraryView").then((module) => ({
    default: module.SimpleModeLibraryView,
  })),
);

function isHealthResponse(response: AnalyzerResponse | null): response is HealthResponse {
  return Boolean(response && response.status === "ok" && "analyzerVersion" in response.payload);
}

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
  const selectedGuidePlaylist = library.selectedPlaylist;
  const selectedGuideTrack = library.selectedTrack;
  const setMonitorGuideTrack = monitor.setGuideTrack;
  const setMonitorGuideTrackPlaylist = monitor.setGuideTrackPlaylist;

  // Simple mode routing: collapse to just library and session
  const effectivePillar = userMode === "simple" && pillar === "design" ? "curate" : pillar;
  const effectiveScreen =
    userMode === "simple" && (screen === "inspect" || screen === "compose") ? "library" : screen;

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

  function armTrackBase(trackId: string | null | undefined) {
    const track =
      typeof trackId === "string"
        ? (library.tracks.find((entry) => entry.id === trackId) ?? null)
        : null;
    library.setSelectedPlaylistId(null);
    library.setSelectedTrackId(track?.id ?? null);
  }

  function armPlaylistBase(playlistId: string | null | undefined) {
    const playlist =
      typeof playlistId === "string"
        ? (library.playlists.find((entry) => entry.id === playlistId) ?? null)
        : null;
    const leadTrack = findPlaylistLeadTrack(playlist, library.tracks);
    library.setSelectedPlaylistId(playlist?.id ?? null);
    library.setSelectedTrackId(leadTrack?.id ?? null);
  }

  // Auto-sync selected base track / playlist → monitor guide runtime
  useEffect(() => {
    if (selectedGuidePlaylist) {
      const queue = resolvePlaylistTracks(selectedGuidePlaylist, library.tracks)
        .map((track) => resolvePlayableTrackPath(track))
        .filter((path): path is string => Boolean(path));
      setMonitorGuideTrackPlaylist(queue);
      return;
    }

    const path = selectedGuideTrack ? resolvePlayableTrackPath(selectedGuideTrack) : null;
    setMonitorGuideTrack(path);
  }, [
    library.tracks,
    selectedGuidePlaylist,
    selectedGuideTrack,
    setMonitorGuideTrack,
    setMonitorGuideTrackPlaylist,
  ]);

  function armSessionMusicalBase(draft?: { trackId?: string; playlistId?: string }) {
    if (draft?.playlistId) {
      armPlaylistBase(draft.playlistId);
      return;
    }

    if (draft?.trackId) {
      armTrackBase(draft.trackId);
      return;
    }

    library.setSelectedPlaylistId(null);
    library.setSelectedTrackId(null);
  }

  function primeMonitorGuideTrack(draft?: { trackId?: string; playlistId?: string }) {
    if (draft?.playlistId) {
      const playlist = library.playlists.find((entry) => entry.id === draft.playlistId) ?? null;
      const queue = resolvePlaylistTracks(playlist, library.tracks)
        .map((track) => resolvePlayableTrackPath(track))
        .filter((path): path is string => Boolean(path));
      monitor.setGuideTrackPlaylist(queue);
      return;
    }

    if (draft?.trackId) {
      const track = library.tracks.find((entry) => entry.id === draft.trackId) ?? null;
      monitor.setGuideTrack(track ? resolvePlayableTrackPath(track) : null);
      return;
    }

    monitor.setGuideTrack(null);
  }

  async function startReplaySession(
    session: PersistedSession,
    replayWindowIndex?: number,
  ): Promise<boolean> {
    sessions.setSelectedSessionId(session.id);
    armSessionMusicalBase({
      trackId: session.trackId ?? undefined,
      playlistId: session.playlistId ?? undefined,
    });
    primeMonitorGuideTrack({
      trackId: session.trackId ?? undefined,
      playlistId: session.playlistId ?? undefined,
    });

    const sourceRepository =
      (session.sourceId
        ? repositories.repositories.find((entry) => entry.id === session.sourceId)
        : null) ??
      repositories.repositories.find(
        (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
      ) ??
      null;

    if (!sourceRepository) {
      notify("error", t.appShell.replayUnavailableTitle, t.appShell.replayUnavailableBody);
      return false;
    }

    repositories.setSelectedRepositoryId(sourceRepository.id);
    setAnalysisMode("repo");

    const alreadyActiveReplay =
      monitor.isPlayback && monitor.session?.persistedSessionId === session.id;

    const ok = alreadyActiveReplay
      ? true
      : await monitor.playbackSession({
          sessionId: session.id,
          label: session.label || t.session.unnamedSession,
          sourcePath: session.sourcePath || "",
          repoId: sourceRepository.id ?? session.sourceId,
        });

    if (!ok) {
      return false;
    }

    if (typeof replayWindowIndex === "number") {
      monitor.pausePlayback();
      monitor.seekPlaybackWindow(replayWindowIndex);
    }

    setAnalysisMode("repo");
    setScreen("inspect");
    return true;
  }

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

  async function handleImportTrack(input: ImportTrackInput) {
    try {
      const nextTrack = await library.importLibraryTrack(input);
      if (nextTrack) {
        notify(
          "success",
          t.appShell.trackImportedTitle,
          t.appShell.trackImportedBody.replace("{title}", nextTrack.tags.title),
        );
        setNewlyImportedId(nextTrack.id);
        setTimeout(() => setNewlyImportedId(null), 3000);
        setAnalysisMode("track");
        setScreen("inspect");
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.importFailedTitle, String(err));
    }
    return false;
  }

  async function handleImportRepository(input: ImportRepositoryInput) {
    try {
      const nextRepository = await repositories.importRepositorySource(input);
      if (nextRepository) {
        let msg = t.appShell.repositoryConnectedBody.replace("{title}", nextRepository.title);

        // Log Discovery v5.3: Automatically scan and import logs from directory
        if (input.sourceKind === "directory") {
          const discovered = await discoverRepositoryLogs(input.sourcePath);
          if (discovered.length > 0) {
            // Import discovered logs in background
            for (const logPath of discovered) {
              const fileName = logPath.split("/").pop() || logPath;
              // We don't wait for each one's analysis, just register them
              void repositories.importRepositorySource({
                sourceKind: "file",
                sourcePath: logPath,
                label: fileName,
              });
            }
            msg = t.appShell.repositoryConnectedRescuedBody
              .replace("{title}", nextRepository.title)
              .replace("{count}", String(discovered.length));
          }
        }

        notify("success", t.appShell.repositoryConnectedTitle, msg);
        setNewlyImportedId(nextRepository.id);
        setTimeout(() => setNewlyImportedId(null), 3000);
        setAnalysisMode("repo");
        setScreen("inspect");
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.connectionFailedTitle, String(err));
    }
    return false;
  }

  async function handleImportBaseAsset(input: ImportBaseAssetInput) {
    try {
      const nextBaseAsset = await baseAssets.importLibraryBaseAsset(input);
      if (nextBaseAsset) {
        notify(
          "success",
          t.appShell.assetImportedTitle,
          t.appShell.assetImportedBody.replace("{title}", nextBaseAsset.title),
        );
        setNewlyImportedId(nextBaseAsset.id);
        setTimeout(() => setNewlyImportedId(null), 3000);
        setAnalysisMode("base");
        setScreen("inspect");
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.assetImportFailedTitle, String(err));
    }
    return false;
  }

  async function handleImportComposition(input: ImportCompositionInput) {
    try {
      const nextComposition = await compositions.importLibraryComposition(input);
      if (nextComposition) {
        notify(
          "success",
          t.appShell.compositionReadyTitle,
          t.appShell.compositionReadyBody.replace("{title}", nextComposition.title),
        );
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.compositionFailedTitle, String(err));
    }
    return false;
  }

  async function handleReanalyzeTrack(trackId: string) {
    try {
      const nextTrack = await library.reanalyzeTrack(trackId);
      if (nextTrack) {
        notify(
          "success",
          t.appShell.reanalysisCompleteTitle,
          t.appShell.reanalysisCompleteBody.replace("{title}", nextTrack.tags.title),
        );
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.reanalysisFailedTitle, String(err));
    }
    return false;
  }

  async function handleRelinkTrack(trackId: string) {
    try {
      const nextTrack = await library.relinkTrack(trackId);
      if (nextTrack) {
        notify(
          "success",
          t.appShell.trackRelinkedTitle,
          t.appShell.trackRelinkedBody.replace("{title}", nextTrack.tags.title),
        );
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.relinkFailedTitle, String(err));
    }
    return false;
  }

  async function handleRelinkMissingTracks() {
    try {
      const result = await library.relinkMissingTracksFromDirectory();
      if (!result) {
        return false;
      }

      const relinkedCount = result.relinkedTracks.length;
      const unresolvedCount = result.unresolvedTrackIds.length;
      if (relinkedCount > 0) {
        notify(
          "success",
          t.appShell.missingTracksRelinkedTitle,
          unresolvedCount > 0
            ? t.appShell.missingTracksRelinkedPartialBody
                .replace("{resolved}", String(relinkedCount))
                .replace("{missing}", String(unresolvedCount))
            : t.appShell.missingTracksRelinkedSuccessBody.replace("{count}", String(relinkedCount)),
        );
      } else {
        notify("info", t.appShell.noMatchesFoundTitle, t.appShell.noMatchesFoundBody);
      }
      return true;
    } catch (err) {
      notify("error", t.appShell.bulkRelinkFailedTitle, String(err));
    }
    return false;
  }

  async function handleReanalyzeRepository(repositoryId: string) {
    try {
      const nextRepository = await repositories.reanalyzeRepository(repositoryId);
      if (nextRepository) {
        notify(
          "success",
          t.appShell.reanalysisCompleteTitle,
          t.appShell.reanalysisCompleteBody.replace("{title}", nextRepository.title),
        );
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.reanalysisFailedTitle, String(err));
    }
    return false;
  }

  async function handleDeleteTrack(trackId: string) {
    try {
      const success = await library.deleteLibraryTrack(trackId);
      if (success) {
        notify("success", t.appShell.trackDeletedTitle, t.appShell.trackDeletedBody);
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.deleteFailedTitle, String(err));
    }
    return false;
  }

  async function handleDeleteRepository(repositoryId: string) {
    try {
      const success = await repositories.deleteLibraryRepository(repositoryId);
      if (success) {
        notify("success", t.appShell.repositoryDeletedTitle, t.appShell.repositoryDeletedBody);
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.deleteFailedTitle, String(err));
    }
    return false;
  }

  async function handleUpdateTrackPerformance(
    trackId: string,
    input: UpdateTrackPerformanceInput,
  ): Promise<void> {
    try {
      const nextTrack = await library.updateTrackPerformance(trackId, input);
      if (!nextTrack) {
        notify("error", t.appShell.trackUpdateFailedTitle, t.appShell.trackUpdateFailedBody);
      }
    } catch (err) {
      notify("error", t.appShell.trackUpdateFailedTitle, String(err));
    }
  }

  async function handleUpdateTrackAnalysis(
    trackId: string,
    input: UpdateTrackAnalysisInput,
  ): Promise<void> {
    try {
      const nextTrack = await library.updateTrackAnalysis(trackId, input);
      if (!nextTrack) {
        notify("error", t.appShell.beatGridUpdateFailedTitle, t.appShell.beatGridUpdateFailedBody);
      }
    } catch (err) {
      notify("error", t.appShell.beatGridUpdateFailedTitle, String(err));
    }
  }

  async function handleSavePlaylist(input: SaveBaseTrackPlaylistInput): Promise<boolean> {
    try {
      const nextPlaylist = await library.savePlaylist(input);
      if (nextPlaylist) {
        notify(
          "success",
          t.appShell.playlistSavedTitle,
          t.appShell.playlistSavedBody.replace("{name}", nextPlaylist.name),
        );
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.playlistSaveFailedTitle, String(err));
    }
    return false;
  }

  async function handleDeletePlaylist(playlistId: string): Promise<boolean> {
    try {
      const success = await library.deletePlaylist(playlistId);
      if (success) {
        notify("success", t.appShell.playlistDeletedTitle, t.appShell.playlistDeletedBody);
        return true;
      }
    } catch (err) {
      notify("error", t.appShell.playlistDeleteFailedTitle, String(err));
    }
    return false;
  }

  function handleOpenMonitoredRepo() {
    const { session } = monitor;
    if (!session) return;
    repositories.setSelectedRepositoryId(session.repoId);
    setAnalysisMode("repo");
    setScreen("inspect");
    setPillar("curate");
  }

  function handleOpenConnections() {
    setPillar("curate");
    setScreen("library");
    setLibraryTab("connections");
  }

  const analyzerLabel = isHealthResponse(health)
    ? `${health.payload.analyzerVersion} on ${health.payload.runtime}`
    : booting
      ? t.appShell.bootingAnalyzerBridge
      : t.appShell.analyzerUnavailable;

  const screenLabel =
    screen === "library"
      ? t.nav.library.label
      : screen === "session"
        ? t.nav.session.label
        : screen === "inspect"
          ? t.nav.inspect.label
          : t.nav.compose.label;

  const detailDeckLabel =
    analysisMode === "repo"
      ? t.appShell.sourceDeckArmed
      : analysisMode === "base"
        ? t.appShell.basePoolArmed
        : t.appShell.trackDeckArmed;

  const selectedItemTitle =
    screen === "compose"
      ? (compositions.selectedComposition?.title ?? null)
      : screen === "inspect" && analysisMode === "repo"
        ? (repositories.selectedRepository?.title ?? null)
        : screen === "inspect" && analysisMode === "base"
          ? (baseAssets.selectedBaseAsset?.title ?? null)
          : (library.selectedPlaylist?.name ?? library.selectedTrack?.tags.title ?? null);

  const isMutating =
    library.mutating || repositories.mutating || baseAssets.mutating || compositions.mutating;
  const mutateLabel = library.mutating
    ? t.appShell.scanningTrackDna
    : repositories.mutating
      ? t.appShell.mappingRepository
      : baseAssets.mutating
        ? t.appShell.poolIngest
        : t.appShell.renderingComposition;

  return (
    <I18nContext.Provider value={t}>
      <Web3Spinner
        visible={booting || isMutating}
        label={booting ? t.appShell.bootingMaia : mutateLabel}
      />
      <main className="app-shell">
        <header className="topbar">
          <div className="topbar-brand">
            {userMode === "expert" && (
              <img
                src="/assets/branding/maia-wordmark-site.png"
                alt="MAIA"
                className="topbar-wordmark"
              />
            )}
            {userMode === "simple" && <span className="topbar-simple-title">{t.workspace}</span>}
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
              setPillar(userMode === "simple" && p === "design" ? "curate" : p);
              if (p === "perform") setScreen("session");
              if (p === "design" && userMode === "expert") setScreen("compose");
              if (p === "curate") setScreen("library");
            }}
            trackCount={library.tracks.length}
            repositoryCount={repositories.repositories.length}
            baseAssetCount={baseAssets.baseAssets.length}
            compositionCount={compositions.compositions.length}
            selectedItemTitle={selectedItemTitle}
            monitorSession={monitor.session}
            monitorMetrics={monitor.metrics}
            onStopMonitor={() => void monitor.stopSession()}
            onOpenMonitoredRepo={handleOpenMonitoredRepo}
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
            {effectivePillar === "curate" &&
              effectiveScreen === "library" &&
              userMode === "simple" &&
              !monitor.session &&
              repositories.repositories.length === 0 && (
                <SimpleModeWizard
                  busyRepository={repositories.mutating}
                  busyBaseAsset={baseAssets.mutating}
                  onImportRepository={handleImportRepository}
                  onImportBaseAsset={handleImportBaseAsset}
                  onStartSession={async (repoId, presetId) => {
                    const repo = repositories.repositories.find((r) => r.id === repoId);
                    const preset = baseAssets.baseAssets.find((b) => b.id === presetId);
                    if (!repo || !preset) return;
                    setPillar("perform");
                    setScreen("session");
                  }}
                  repositoryCount={repositories.repositories.length}
                  baseAssetCount={baseAssets.baseAssets.length}
                  baseAssetCategories={manifest?.baseAssetCategories ?? []}
                  defaultCategoryId={manifest?.defaultBaseAssetCategoryId}
                />
              )}

            {effectivePillar === "curate" &&
              effectiveScreen === "library" &&
              userMode === "simple" &&
              repositories.repositories.length > 0 && (
                <SimpleModeLibraryView
                  tracks={library.tracks}
                  repositories={repositories.repositories}
                  baseAssets={baseAssets.baseAssets}
                  selectedRepositoryId={repositories.selectedRepositoryId}
                  selectedTrackId={library.selectedTrackId}
                  onSelectRepository={(repositoryId) => {
                    repositories.setSelectedRepositoryId(repositoryId);
                  }}
                  onSelectTrack={(trackId) => {
                    library.setSelectedTrackId(trackId);
                  }}
                  onImportRepository={handleImportRepository}
                  onImportBaseAsset={handleImportBaseAsset}
                  onStartMonitoring={(repoId, trackId) => {
                    const repo = repositories.repositories.find((r) => r.id === repoId);
                    if (!repo) return;
                    library.setSelectedTrackId(trackId ?? null);
                    setPillar("perform");
                    setScreen("session");
                  }}
                />
              )}

            {effectivePillar === "curate" &&
              effectiveScreen === "library" &&
              userMode === "expert" && (
                <LibraryScreen
                  tracks={library.tracks}
                  playlists={library.playlists}
                  repositories={repositories.repositories}
                  baseAssets={baseAssets.baseAssets}
                  compositions={compositions.compositions}
                  newlyImportedId={newlyImportedId}
                  selectedTrackId={library.selectedTrackId}
                  selectedPlaylistId={library.selectedPlaylistId}
                  selectedRepositoryId={repositories.selectedRepositoryId}
                  selectedBaseAssetId={baseAssets.selectedBaseAssetId}
                  selectedCompositionId={compositions.selectedCompositionId}
                  activeTab={libraryTab}
                  onTabChange={setLibraryTab}
                  manifest={manifest}
                  musicStyles={manifest?.musicStyles ?? []}
                  baseAssetCategories={manifest?.baseAssetCategories ?? []}
                  defaultTrackMusicStyleId={manifest?.defaultTrackMusicStyleId}
                  defaultBaseAssetCategoryId={manifest?.defaultBaseAssetCategoryId}
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
                  onSelectTrack={(trackId) => {
                    armTrackBase(trackId);
                    setAnalysisMode("track");
                  }}
                  onSelectPlaylist={armPlaylistBase}
                  onSelectRepository={(repositoryId) => {
                    repositories.setSelectedRepositoryId(repositoryId);
                    setAnalysisMode("repo");
                  }}
                  onSelectBaseAsset={(baseAssetId) => {
                    baseAssets.setSelectedBaseAssetId(baseAssetId);
                    setAnalysisMode("base");
                  }}
                  onSelectComposition={(compositionId) => {
                    compositions.setSelectedCompositionId(compositionId);
                  }}
                  onInspectTrack={(trackId) => {
                    armTrackBase(trackId);
                    setAnalysisMode("track");
                    setScreen("inspect");
                  }}
                  onInspectRepository={(repositoryId) => {
                    repositories.setSelectedRepositoryId(repositoryId);
                    setAnalysisMode("repo");
                    setScreen("inspect");
                  }}
                  onInspectBaseAsset={(baseAssetId) => {
                    baseAssets.setSelectedBaseAssetId(baseAssetId);
                    setAnalysisMode("base");
                    setScreen("inspect");
                  }}
                  onInspectComposition={(compositionId) => {
                    compositions.setSelectedCompositionId(compositionId);
                    setScreen("compose");
                  }}
                />
              )}

            {userMode === "expert" &&
              effectivePillar === "curate" &&
              effectiveScreen === "inspect" && (
                <InspectScreen
                  track={library.selectedTrack}
                  repository={repositories.selectedRepository}
                  baseAsset={baseAssets.selectedBaseAsset}
                  availableTracks={library.tracks}
                  availablePlaylists={library.playlists}
                  availableRepositories={repositories.repositories}
                  availableBaseAssets={baseAssets.baseAssets}
                  mode={analysisMode}
                  analyzerLabel={analyzerLabel}
                  onChangeMode={setAnalysisMode}
                  onSelectTrack={(id: string) => {
                    armTrackBase(id);
                    setAnalysisMode("track");
                  }}
                  onSelectRepository={(id: string) => {
                    repositories.setSelectedRepositoryId(id);
                    setAnalysisMode("repo");
                  }}
                  onSelectBaseAsset={(id: string) => {
                    baseAssets.setSelectedBaseAssetId(id);
                    setAnalysisMode("base");
                  }}
                  onGoLibrary={() => setScreen("library")}
                  onGoCompose={() => setScreen("compose")}
                  onUpdateTrackPerformance={handleUpdateTrackPerformance}
                  onUpdateTrackAnalysis={handleUpdateTrackAnalysis}
                  trackMutating={library.mutating}
                />
              )}

            {userMode === "expert" && effectivePillar === "design" && (
              <ComposeScreen
                composition={compositions.selectedComposition}
                compositions={compositions.compositions}
                baseAssets={baseAssets.baseAssets}
                tracks={library.tracks}
                playlists={library.playlists}
                repositories={repositories.repositories}
                analyzerLabel={analyzerLabel}
                busy={compositions.mutating}
                onImportComposition={handleImportComposition}
                onSelectComposition={(id: string) => compositions.setSelectedCompositionId(id)}
                onGoLibrary={() => setScreen("library")}
              />
            )}

            {effectivePillar === "perform" && (
              <SessionScreen
                tracks={library.tracks}
                playlists={library.playlists}
                repositories={repositories.repositories}
                sessions={sessions.sessions}
                sessionBookmarksBySessionId={sessions.sessionBookmarksBySessionId}
                selectedSessionId={sessions.selectedSessionId}
                loading={sessions.loading}
                mutating={sessions.mutating}
                error={sessions.error}
                activeSessionId={
                  monitor.session?.persistedSessionId ?? monitor.session?.sessionId ?? null
                }
                activeSessionMode={
                  monitor.session ? (monitor.isPlayback ? "playback" : "live") : null
                }
                activePlaybackProgress={monitor.isPlayback ? monitor.playbackProgress : null}
                onStartSession={async (input, persistedSessionId, draft) => {
                  sessions.clearError();
                  armSessionMusicalBase({
                    trackId: draft?.trackId,
                    playlistId: draft?.playlistId,
                  });
                  primeMonitorGuideTrack({
                    trackId: draft?.trackId,
                    playlistId: draft?.playlistId,
                  });
                  const success = await monitor.startSession(
                    input.adapterKind === "file"
                      ? (repositories.repositories.find((r) => r.sourcePath === input.source) ??
                          ({
                            id: input.sessionId,
                            title: input.label ?? t.session.unnamedSession,
                            sourcePath: input.source,
                            storagePath: null,
                            sourceKind: "file",
                            importedAt: new Date().toISOString(),
                            suggestedBpm: null,
                            confidence: 0,
                            summary: "",
                            analyzerStatus: "pending",
                            buildSystem: "",
                            primaryLanguage: "",
                            javaFileCount: 0,
                            testFileCount: 0,
                            notes: [],
                            tags: [],
                            metrics: {},
                          } as any))
                      : (repositories.repositories.find((r) => r.sourcePath === input.source) ??
                          ({
                            id: input.sessionId,
                            title: input.label ?? t.session.unnamedSession,
                            sourcePath: input.source,
                            storagePath: null,
                            sourceKind: "directory",
                            importedAt: new Date().toISOString(),
                            suggestedBpm: null,
                            confidence: 0,
                            summary: "",
                            analyzerStatus: "pending",
                            buildSystem: "",
                            primaryLanguage: "",
                            javaFileCount: 0,
                            testFileCount: 0,
                            notes: [],
                            tags: [],
                            metrics: {},
                          } as any)),
                    input,
                    persistedSessionId,
                  );
                  if (success) {
                    const isExistingSession = sessions.sessions.some(
                      (entry) => entry.id === persistedSessionId,
                    );
                    if (!isExistingSession) {
                      await sessions.createSession({
                        id: persistedSessionId,
                        label: input.label,
                        sourceId: draft?.sourceId,
                        trackId: draft?.trackId,
                        playlistId: draft?.playlistId,
                        adapterKind: input.adapterKind,
                        mode: "live",
                      });
                    } else {
                      sessions.setSelectedSessionId(persistedSessionId);
                    }
                  }
                  return success;
                }}
                onStopSession={() => monitor.stopSession()}
                onResume={(sessionId) => sessions.setSelectedSessionId(sessionId)}
                onPlayback={async (session) => {
                  return startReplaySession(session);
                }}
                onReplayBookmark={async (session, replayWindowIndex) =>
                  startReplaySession(session, replayWindowIndex)
                }
                onDelete={(sessionId) => sessions.removeSession(sessionId)}
                onSelectSession={(sessionId) => sessions.setSelectedSessionId(sessionId)}
              />
            )}
          </Suspense>
        </section>
      </main>
    </I18nContext.Provider>
  );
}
