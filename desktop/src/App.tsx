import { Globe2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { loadBootstrapManifest, runAnalyzerRequest } from "./api/analyzer";
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
import type {
  AnalyzerViewMode,
  AppScreen,
  ImportCompositionInput,
  ImportBaseAssetInput,
  ImportRepositoryInput,
  ImportTrackInput,
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

  // Auto-sync selected library track → monitor guide track
  useEffect(() => {
    const track = library.selectedTrack;
    const path = track?.storagePath ?? track?.sourcePath ?? null;
    monitor.setGuideTrack(path);
  }, [library.selectedTrackId, library.selectedTrack?.storagePath, library.selectedTrack?.sourcePath, monitor.setGuideTrack]);

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
        notify("success", "Track imported", `${nextTrack.title} is now in your library.`);
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
        notify("success", "Repository connected", `${nextRepository.title} analysis is ready.`);
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

  function handleOpenMonitoredRepo() {
    const { session } = monitor;
    if (!session) return;
    repositories.setSelectedRepositoryId(session.repoId);
    setAnalysisMode("repo");
    setScreen("inspect");
  }

  const analyzerLabel = isHealthResponse(health)
    ? `${health.payload.analyzerVersion} on ${health.payload.runtime}`
    : booting
      ? "Booting analyzer bridge"
      : "Analyzer unavailable";

  const selectedItemTitle =
    screen === "compose"
      ? compositions.selectedComposition?.title ?? null
      : screen === "inspect" && analysisMode === "repo"
        ? repositories.selectedRepository?.title ?? null
        : screen === "inspect" && analysisMode === "base"
          ? baseAssets.selectedBaseAsset?.title ?? null
          : library.selectedTrack?.title ?? null;

  const isMutating = library.mutating || repositories.mutating || baseAssets.mutating || compositions.mutating;
  const mutateLabel = library.mutating ? "Scanning Track DNA" :
                     repositories.mutating ? "Mapping Repository" :
                     baseAssets.mutating ? "Pool Ingest" : "Rendering Composition";

  return (
    <I18nContext.Provider value={t}>
      <Web3Spinner visible={booting || isMutating} label={booting ? "Booting Maia" : mutateLabel} />
      <div className="ambient-layer" aria-hidden="true">
        <div className="ambient-cyan" />
        <div className="ambient-violet" />
      </div>
      <main className="app-shell">
      <AppSidebar
        currentScreen={screen}
        onScreenChange={setScreen}
        trackCount={library.tracks.length}
        repositoryCount={repositories.repositories.length}
        baseAssetCount={baseAssets.baseAssets.length}
        compositionCount={compositions.compositions.length}
        selectedItemTitle={selectedItemTitle}
        monitorSession={monitor.session}
        monitorMetrics={monitor.metrics}
        onStopMonitor={() => void monitor.stopSession()}
        onOpenMonitoredRepo={handleOpenMonitoredRepo}
      />

      <section className="app-main">
        <header className="topbar panel">
          <div className="topbar-brand">
            <img
              src="/assets/branding/maia-icon-site.png"
              alt="MAIA icon"
              className="topbar-icon"
            />
            <div>
              <h2>{t.workspace}</h2>
              <p className="support-copy">{t.workspaceCopy}</p>
            </div>
          </div>

          <div className="topbar-metrics">
            <div className="topbar-controls">
              <button
                type="button"
                className="control-button"
                onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
              >
                <Globe2 size={14} />
                {t.controls.lang}
              </button>
              <button
                type="button"
                className="control-button"
                onClick={() => setIsDark((v) => !v)}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                {isDark ? t.controls.light : t.controls.dark}
              </button>
            </div>
            <div className="summary-pill">
              <span>Analyzer</span>
              <strong>{analyzerLabel}</strong>
            </div>
          </div>
        </header>

        {health?.warnings.length ? (
          <section className="notice inline-notice">
            {health.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        ) : null}

        {screen === "library" && (
          <LibraryScreen
            tracks={library.tracks}
            repositories={repositories.repositories}
            baseAssets={baseAssets.baseAssets}
            compositions={compositions.compositions}
            newlyImportedId={newlyImportedId}
            selectedTrackId={library.selectedTrackId}
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
            onSeedDemo={library.seedLibrary}
            onSelectTrack={(trackId) => { library.setSelectedTrackId(trackId); setAnalysisMode("track"); }}
            onSelectRepository={(repositoryId) => { repositories.setSelectedRepositoryId(repositoryId); setAnalysisMode("repo"); }}
            onSelectBaseAsset={(baseAssetId) => { baseAssets.setSelectedBaseAssetId(baseAssetId); setAnalysisMode("base"); }}
            onSelectComposition={(compositionId) => { compositions.setSelectedCompositionId(compositionId); }}
            onInspectTrack={(trackId) => { library.setSelectedTrackId(trackId); setAnalysisMode("track"); setScreen("inspect"); }}
            onInspectRepository={(repositoryId) => { repositories.setSelectedRepositoryId(repositoryId); setAnalysisMode("repo"); setScreen("inspect"); }}
            onInspectBaseAsset={(baseAssetId) => { baseAssets.setSelectedBaseAssetId(baseAssetId); setAnalysisMode("base"); setScreen("inspect"); }}
            onInspectComposition={(compositionId) => { compositions.setSelectedCompositionId(compositionId); setScreen("compose"); }}
          />
        )}

        {screen === "inspect" && (
          <InspectScreen
            track={library.selectedTrack}
            repository={repositories.selectedRepository}
            baseAsset={baseAssets.selectedBaseAsset}
            availableTracks={library.tracks}
            availableRepositories={repositories.repositories}
            availableBaseAssets={baseAssets.baseAssets}
            mode={analysisMode}
            analyzerLabel={analyzerLabel}
            onChangeMode={setAnalysisMode}
            onSelectTrack={(id: string) => { library.setSelectedTrackId(id); setAnalysisMode("track"); }}
            onSelectRepository={(id: string) => { repositories.setSelectedRepositoryId(id); setAnalysisMode("repo"); }}
            onSelectBaseAsset={(id: string) => { baseAssets.setSelectedBaseAssetId(id); setAnalysisMode("base"); }}
            onGoLibrary={() => setScreen("library")}
            onGoCompose={() => setScreen("compose")}
          />
        )}

        {screen === "compose" && (
          <ComposeScreen
            composition={compositions.selectedComposition}
            compositions={compositions.compositions}
            baseAssets={baseAssets.baseAssets}
            tracks={library.tracks}
            repositories={repositories.repositories}
            analyzerLabel={analyzerLabel}
            busy={compositions.mutating}
            onImportComposition={handleImportComposition}
            onSelectComposition={(id: string) => compositions.setSelectedCompositionId(id)}
            onGoLibrary={() => setScreen("library")}
          />
        )}

        {screen === "session" && (
          <SessionScreen
            tracks={library.tracks}
            repositories={repositories.repositories}
            sessions={sessions.sessions}
            selectedSessionId={sessions.selectedSessionId}
            loading={sessions.loading}
            mutating={sessions.mutating}
            error={sessions.error}
            activeSessionId={monitor.session?.sessionId ?? null}
            onStartSession={async (input, persistedSessionId) => {
              sessions.clearError();
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
                await sessions.createSession({
                  id: persistedSessionId,
                  label: input.label,
                  sourceId: repositories.repositories.find(
                    (r) => r.sourcePath === input.source,
                  )?.id,
                  trackId: library.tracks.find((t) => t.sourcePath === input.source)?.id,
                  adapterKind: input.adapterKind,
                  mode: "live",
                });
              }
              return success;
            }}
            onStopSession={() => monitor.stopSession()}
            onResume={(sessionId) => sessions.setSelectedSessionId(sessionId)}
            onPlayback={async (sessionId, label, sourcePath) => {
              const ok = await monitor.playbackSession(sessionId, label, sourcePath);
              if (ok) setScreen("inspect");
              return ok;
            }}
            onDelete={(sessionId) => sessions.removeSession(sessionId)}
            onSelectSession={(sessionId) => sessions.setSelectedSessionId(sessionId)}
          />
        )}

        <MonitorWaveformBar tracks={library.tracks} />
      </section>
      </main>
    </I18nContext.Provider>
  );
}
