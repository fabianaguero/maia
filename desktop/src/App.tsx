import { Globe2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

import { loadBootstrapManifest, runAnalyzerRequest } from "./api/analyzer";
import { discoverRepositoryLogs } from "./api/repositories";
import type { PersistedSession } from "./api/sessions";
import { AppSidebar } from "./components/AppSidebar";
import { ComposeScreen } from "./features/compose/ComposeScreen";
import { InspectScreen } from "./features/inspect/InspectScreen";
import { LibraryScreen } from "./features/library/LibraryScreen";
import { SessionScreen } from "./features/session/SessionScreen";
import { useMonitor } from "./features/monitor/MonitorContext";
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

function isHealthResponse(
  response: AnalyzerResponse | null,
): response is HealthResponse {
  return Boolean(
    response &&
      response.status === "ok" &&
      "analyzerVersion" in response.payload,
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

function AppContent() {
  const { notify } = useNotify();
  const [manifest, setManifest] = useState<BootstrapManifest | null>(null);
  const [health, setHealth] = useState<AnalyzerResponse | null>(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<AppScreen>("library");
  const [pillar, setPillar] = useState<AppPillar>("curate");
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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
  }, [isDark]);

  useEffect(() => {
    if (screen === "session") {
      void sessions.refreshBookmarks();
    }
  }, [screen, sessions.refreshBookmarks]);

  function armTrackBase(trackId: string | null | undefined) {
    const track =
      typeof trackId === "string"
        ? library.tracks.find((entry) => entry.id === trackId) ?? null
        : null;
    library.setSelectedPlaylistId(null);
    library.setSelectedTrackId(track?.id ?? null);
  }

  function armPlaylistBase(playlistId: string | null | undefined) {
    const playlist =
      typeof playlistId === "string"
        ? library.playlists.find((entry) => entry.id === playlistId) ?? null
        : null;
    const leadTrack = findPlaylistLeadTrack(playlist, library.tracks);
    library.setSelectedPlaylistId(playlist?.id ?? null);
    library.setSelectedTrackId(leadTrack?.id ?? null);
  }

  // Auto-sync selected base track / playlist → monitor guide runtime
  useEffect(() => {
    if (library.selectedPlaylist) {
      const queue = resolvePlaylistTracks(library.selectedPlaylist, library.tracks)
        .map((track) => resolvePlayableTrackPath(track))
        .filter((path): path is string => Boolean(path));
      monitor.setGuideTrackPlaylist(queue);
      return;
    }

    const track = library.selectedTrack;
    const path = track ? resolvePlayableTrackPath(track) : null;
    monitor.setGuideTrack(path);
  }, [
    library.selectedPlaylistId,
    library.selectedPlaylist?.updatedAt,
    library.selectedPlaylist?.trackIds,
    library.selectedTrackId,
    library.selectedTrack?.file.storagePath,
    library.selectedTrack?.file.sourcePath,
    library.tracks,
    monitor.setGuideTrack,
    monitor.setGuideTrackPlaylist,
  ]);

  function armSessionMusicalBase(draft?: {
    trackId?: string;
    playlistId?: string;
  }) {
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

  function primeMonitorGuideTrack(draft?: {
    trackId?: string;
    playlistId?: string;
  }) {
    if (draft?.playlistId) {
      const playlist =
        library.playlists.find((entry) => entry.id === draft.playlistId) ?? null;
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
        ? repositories.repositories.find(
            (entry) => entry.id === session.sourceId,
          )
        : null) ??
      repositories.repositories.find(
        (entry) =>
          session.sourcePath !== null &&
          entry.sourcePath === session.sourcePath,
      ) ??
      null;

    if (!sourceRepository) {
      notify(
        "error",
        "Replay unavailable",
        "Maia could not find the stored source for this session.",
      );
      return false;
    }

    repositories.setSelectedRepositoryId(sourceRepository.id);
    setAnalysisMode("repo");

    const alreadyActiveReplay =
      monitor.isPlayback &&
      monitor.session?.persistedSessionId === session.id;

    const ok = alreadyActiveReplay
      ? true
      : await monitor.playbackSession({
          sessionId: session.id,
          label: session.label || "Unnamed",
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
      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 8000),
      );

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
        notify("success", "Track imported", `${nextTrack.tags.title} is now in your library.`);
        setNewlyImportedId(nextTrack.id);
        setTimeout(() => setNewlyImportedId(null), 3000);
        setAnalysisMode("track");
        setScreen("inspect");
        return true;
      }
    } catch (err) {
      notify("error", "Import failed", String(err));
    }
    return false;
  }

  async function handleImportRepository(input: ImportRepositoryInput) {
    try {
      const nextRepository = await repositories.importRepositorySource(input);
      if (nextRepository) {
        let msg = `${nextRepository.title} connected.`;

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
            msg = `${nextRepository.title} connected. Rescued ${discovered.length} logs.`;
          }
        }

        notify("success", "Repository connected", msg);
        setNewlyImportedId(nextRepository.id);
        setTimeout(() => setNewlyImportedId(null), 3000);
        setAnalysisMode("repo");
        setScreen("inspect");
        return true;
      }
    } catch (err) {
      notify("error", "Connection failed", String(err));
    }
    return false;
  }

  async function handleImportBaseAsset(input: ImportBaseAssetInput) {
    try {
      const nextBaseAsset = await baseAssets.importLibraryBaseAsset(input);
      if (nextBaseAsset) {
        notify("success", "Asset imported", `${nextBaseAsset.title} added to pool.`);
        setNewlyImportedId(nextBaseAsset.id);
        setTimeout(() => setNewlyImportedId(null), 3000);
        setAnalysisMode("base");
        setScreen("inspect");
        return true;
      }
    } catch (err) {
      notify("error", "Asset import failed", String(err));
    }
    return false;
  }

  async function handleImportComposition(input: ImportCompositionInput) {
    try {
      const nextComposition = await compositions.importLibraryComposition(input);
      if (nextComposition) {
        notify("success", "Composition ready", `${nextComposition.title} rendered and added.`);
        return true;
      }
    } catch (err) {
      notify("error", "Composition failed", String(err));
    }
    return false;
  }

  async function handleReanalyzeTrack(trackId: string) {
    try {
      const nextTrack = await library.reanalyzeTrack(trackId);
      if (nextTrack) {
        notify("success", "Re-analysis complete", `${nextTrack.tags.title} analysis updated.`);
        return true;
      }
    } catch (err) {
      notify("error", "Re-analysis failed", String(err));
    }
    return false;
  }

  async function handleReanalyzeRepository(repositoryId: string) {
    try {
      const nextRepository = await repositories.reanalyzeRepository(repositoryId);
      if (nextRepository) {
        notify("success", "Re-analysis complete", `${nextRepository.title} analysis updated.`);
        return true;
      }
    } catch (err) {
      notify("error", "Re-analysis failed", String(err));
    }
    return false;
  }

  async function handleDeleteTrack(trackId: string) {
    try {
      const success = await library.deleteLibraryTrack(trackId);
      if (success) {
        notify("success", "Track deleted", "Track removed from library.");
        return true;
      }
    } catch (err) {
      notify("error", "Delete failed", String(err));
    }
    return false;
  }

  async function handleDeleteRepository(repositoryId: string) {
    try {
      const success = await repositories.deleteLibraryRepository(repositoryId);
      if (success) {
        notify("success", "Repository deleted", "Repository removed from library.");
        return true;
      }
    } catch (err) {
      notify("error", "Delete failed", String(err));
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
        notify("error", "Track update failed", "Maia could not persist track performance state.");
      }
    } catch (err) {
      notify("error", "Track update failed", String(err));
    }
  }

  async function handleUpdateTrackAnalysis(
    trackId: string,
    input: UpdateTrackAnalysisInput,
  ): Promise<void> {
    try {
      const nextTrack = await library.updateTrackAnalysis(trackId, input);
      if (!nextTrack) {
        notify("error", "Beat grid update failed", "Maia could not persist track analysis changes.");
      }
    } catch (err) {
      notify("error", "Beat grid update failed", String(err));
    }
  }

  async function handleSavePlaylist(
    input: SaveBaseTrackPlaylistInput,
  ): Promise<boolean> {
    try {
      const nextPlaylist = await library.savePlaylist(input);
      if (nextPlaylist) {
        notify(
          "success",
          "Playlist saved",
          `${nextPlaylist.name} is ready as a base playlist.`,
        );
        return true;
      }
    } catch (err) {
      notify("error", "Playlist save failed", String(err));
    }
    return false;
  }

  async function handleDeletePlaylist(playlistId: string): Promise<boolean> {
    try {
      const success = await library.deletePlaylist(playlistId);
      if (success) {
        notify("success", "Playlist deleted", "Base playlist removed from library.");
        return true;
      }
    } catch (err) {
      notify("error", "Playlist delete failed", String(err));
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

  const analyzerLabel = isHealthResponse(health)
    ? `${health.payload.analyzerVersion} on ${health.payload.runtime}`
    : booting
      ? "Booting analyzer bridge"
      : "Analyzer unavailable";

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
      ? "Source deck armed"
      : analysisMode === "base"
        ? "Base pool armed"
        : "Track deck armed";

  const selectedItemTitle =
    screen === "compose"
      ? compositions.selectedComposition?.title ?? null
      : screen === "inspect" && analysisMode === "repo"
        ? repositories.selectedRepository?.title ?? null
      : screen === "inspect" && analysisMode === "base"
        ? baseAssets.selectedBaseAsset?.title ?? null
          : library.selectedPlaylist?.name ?? library.selectedTrack?.tags.title ?? null;

  const isMutating = library.mutating || repositories.mutating || baseAssets.mutating || compositions.mutating;
  const mutateLabel = library.mutating ? "Scanning Track DNA" :
                     repositories.mutating ? "Mapping Repository" :
                     baseAssets.mutating ? "Pool Ingest" : "Rendering Composition";

  return (
    <I18nContext.Provider value={t}>
      <Web3Spinner visible={booting || isMutating} label={booting ? "Booting Maia" : mutateLabel} />
      <main className="app-shell">
        <header className="topbar">
          <div className="topbar-brand">
            <img
              src="/assets/branding/maia-wordmark-site.png"
              alt="MAIA"
              className="topbar-wordmark"
            />
            <div className="topbar-copy">
              <span className="topbar-subtitle">{t.workspace}</span>
            </div>
          </div>

          <div className="topbar-controls">
            <button
              type="button"
              className="control-button"
              onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
              title={t.controls.lang}
            >
              <Globe2 size={16} />
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

        {selectedItemTitle && selectedItemTitle.trim() && (
          <section className="waveform-section">
            <div className="waveform-header">
              <div>
                <p className="waveform-label">Now Playing</p>
                <h3 className="waveform-track-title">{selectedItemTitle}</h3>
              </div>
              <div className="status-pills">
                <div className="status-pill">
                  <span>{screenLabel}</span>
                  <strong>{detailDeckLabel}</strong>
                </div>
                {monitor.session && (
                  <div className="status-pill status-pill--live">
                    <span>Live</span>
                    <strong>{monitor.metrics.totalAnomalies} anomalies</strong>
                  </div>
                )}
              </div>
            </div>
            <MonitorWaveformBar tracks={library.tracks} />
          </section>
        )}

      <section className={`app-main role--${pillar}`}>
        <AppSidebar
          currentPillar={pillar}
          onPillarChange={(p) => {
            setPillar(p);
            if (p === "perform") setScreen("session");
            if (p === "design") setScreen("compose");
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
          onHideToBackground={() => {
            if (isTauri()) {
              void invoke("hide_window").catch(() => {});
              notify("info", "Maia is monitoring in the background", "Find it in the system tray to bring it back.");
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

        {pillar === "curate" && screen === "library" && (
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
            onReanalyzeRepository={handleReanalyzeRepository}
            onDeleteTrack={handleDeleteTrack}
            onDeleteRepository={handleDeleteRepository}
            onSeedDemo={library.seedLibrary}
            onSavePlaylist={handleSavePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onSelectTrack={(trackId) => { armTrackBase(trackId); setAnalysisMode("track"); }}
            onSelectPlaylist={armPlaylistBase}
            onSelectRepository={(repositoryId) => { repositories.setSelectedRepositoryId(repositoryId); setAnalysisMode("repo"); }}
            onSelectBaseAsset={(baseAssetId) => { baseAssets.setSelectedBaseAssetId(baseAssetId); setAnalysisMode("base"); }}
            onSelectComposition={(compositionId) => { compositions.setSelectedCompositionId(compositionId); }}
            onInspectTrack={(trackId) => { armTrackBase(trackId); setAnalysisMode("track"); setScreen("inspect"); }}
            onInspectRepository={(repositoryId) => { repositories.setSelectedRepositoryId(repositoryId); setAnalysisMode("repo"); setScreen("inspect"); }}
            onInspectBaseAsset={(baseAssetId) => { baseAssets.setSelectedBaseAssetId(baseAssetId); setAnalysisMode("base"); setScreen("inspect"); }}
            onInspectComposition={(compositionId) => { compositions.setSelectedCompositionId(compositionId); setScreen("compose"); }}
          />
        )}

        {pillar === "curate" && screen === "inspect" && (
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
            onSelectTrack={(id: string) => { armTrackBase(id); setAnalysisMode("track"); }}
            onSelectRepository={(id: string) => { repositories.setSelectedRepositoryId(id); setAnalysisMode("repo"); }}
            onSelectBaseAsset={(id: string) => { baseAssets.setSelectedBaseAssetId(id); setAnalysisMode("base"); }}
            onGoLibrary={() => setScreen("library")}
            onGoCompose={() => setScreen("compose")}
            onUpdateTrackPerformance={handleUpdateTrackPerformance}
            onUpdateTrackAnalysis={handleUpdateTrackAnalysis}
            trackMutating={library.mutating}
          />
        )}

        {pillar === "design" && (
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

        {pillar === "perform" && (
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
            activePlaybackProgress={
              monitor.isPlayback ? monitor.playbackProgress : null
            }
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
                  ? repositories.repositories.find((r) => r.sourcePath === input.source) ??
                    ({
                      id: input.sessionId,
                      title: input.label ?? "Unnamed",
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
                    } as any)
                  : repositories.repositories.find((r) => r.sourcePath === input.source) ??
                    ({
                      id: input.sessionId,
                      title: input.label ?? "Unnamed",
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
                    } as any),
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
      </section>
      </main>
    </I18nContext.Provider>
  );
}
