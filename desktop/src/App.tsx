import { useEffect, useState } from "react";

import { loadBootstrapManifest, runAnalyzerRequest } from "./api/analyzer";
import { AppSidebar } from "./components/AppSidebar";
import { AnalyzerScreen } from "./features/analyzer/AnalyzerScreen";
import { LibraryScreen } from "./features/library/LibraryScreen";
import { useMonitor } from "./features/monitor/MonitorContext";
import { useBaseAssets } from "./hooks/useBaseAssets";
import { useCompositionResults } from "./hooks/useCompositionResults";
import { useLibrary } from "./hooks/useLibrary";
import { useRepositories } from "./hooks/useRepositories";
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
  const [manifest, setManifest] = useState<BootstrapManifest | null>(null);
  const [health, setHealth] = useState<AnalyzerResponse | null>(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<AppScreen>("library");
  const [analysisMode, setAnalysisMode] = useState<AnalyzerViewMode>("track");
  const library = useLibrary();
  const repositories = useRepositories();
  const baseAssets = useBaseAssets();
  const compositions = useCompositionResults();
  const monitor = useMonitor();

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const [nextManifest, nextHealth] = await Promise.all([
        loadBootstrapManifest(),
        runAnalyzerRequest(createHealthRequest()),
      ]);

      if (!active) {
        return;
      }

      setManifest(nextManifest);
      setHealth(nextHealth);
      setBooting(false);
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function handleImportTrack(input: ImportTrackInput) {
    const nextTrack = await library.importLibraryTrack(input);
    if (nextTrack) {
      setAnalysisMode("track");
      setScreen("analyzer");
      return true;
    }

    return false;
  }

  async function handleImportRepository(input: ImportRepositoryInput) {
    const nextRepository = await repositories.importRepositorySource(input);
    if (nextRepository) {
      setAnalysisMode("repo");
      setScreen("analyzer");
      return true;
    }

    return false;
  }

  async function handleImportBaseAsset(input: ImportBaseAssetInput) {
    const nextBaseAsset = await baseAssets.importLibraryBaseAsset(input);
    if (nextBaseAsset) {
      setAnalysisMode("base");
      setScreen("analyzer");
      return true;
    }

    return false;
  }

  async function handleImportComposition(input: ImportCompositionInput) {
    const nextComposition = await compositions.importLibraryComposition(input);
    if (nextComposition) {
      setAnalysisMode("composition");
      setScreen("analyzer");
      return true;
    }

    return false;
  }

  function handleOpenMonitoredRepo() {
    const { session } = monitor;
    if (!session) return;
    repositories.setSelectedRepositoryId(session.repoId);
    setAnalysisMode("repo");
    setScreen("analyzer");
  }

  const analyzerLabel = isHealthResponse(health)
    ? `${health.payload.analyzerVersion} on ${health.payload.runtime}`
    : booting
      ? "Booting analyzer bridge"
      : "Analyzer unavailable";
  const selectedItemTitle =
    analysisMode === "composition"
      ? compositions.selectedComposition?.title
        ?? baseAssets.selectedBaseAsset?.title
        ?? library.selectedTrack?.title
        ?? repositories.selectedRepository?.title
        ?? null
      : analysisMode === "repo"
      ? repositories.selectedRepository?.title
        ?? library.selectedTrack?.title
        ?? baseAssets.selectedBaseAsset?.title
        ?? compositions.selectedComposition?.title
        ?? null
      : analysisMode === "base"
        ? baseAssets.selectedBaseAsset?.title
          ?? library.selectedTrack?.title
          ?? repositories.selectedRepository?.title
          ?? compositions.selectedComposition?.title
          ?? null
        : library.selectedTrack?.title
          ?? repositories.selectedRepository?.title
          ?? baseAssets.selectedBaseAsset?.title
          ?? compositions.selectedComposition?.title
          ?? null;

  return (
    <main className="app-shell">
      <AppSidebar
        currentScreen={screen}
        onScreenChange={setScreen}
        trackCount={library.tracks.length}
        repositoryCount={repositories.repositories.length}
        baseAssetCount={baseAssets.baseAssets.length}
        compositionCount={compositions.compositions.length}
        selectedItemTitle={selectedItemTitle}
        manifest={manifest}
        analyzerLabel={analyzerLabel}
        monitorSession={monitor.session}
        monitorMetrics={monitor.metrics}
        onStopMonitor={() => void monitor.stopSession()}
        onOpenMonitoredRepo={handleOpenMonitoredRepo}
      />

      <section className="app-main">
        <header className="topbar panel">
          <div>
            <p className="eyebrow">Desktop runtime</p>
            <h2>Local analysis workspace</h2>
            <p className="support-copy">
              Tracks, code/log sources, reusable sonic assets, and composition plans persist
              locally, mixing analyzer heuristics with deterministic fallbacks while the MVP
              matures toward full software sonification.
            </p>
          </div>

          <div className="topbar-metrics">
            <div className="summary-pill">
              <span>Runtime</span>
              <strong>{manifest?.runtimeMode ?? "frontend-only"}</strong>
            </div>
            <div className="summary-pill">
              <span>Analyzer</span>
              <strong>{analyzerLabel}</strong>
            </div>
            <div className="summary-pill">
              <span>Database</span>
              <strong>{manifest?.persistenceMode ?? "fallback"}</strong>
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

        {screen === "library" ? (
          <LibraryScreen
            tracks={library.tracks}
            repositories={repositories.repositories}
            baseAssets={baseAssets.baseAssets}
            compositions={compositions.compositions}
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
            onSelectTrack={(trackId) => {
              library.setSelectedTrackId(trackId);
              setAnalysisMode("track");
            }}
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
              setAnalysisMode("composition");
            }}
            onInspectTrack={(trackId) => {
              library.setSelectedTrackId(trackId);
              setAnalysisMode("track");
              setScreen("analyzer");
            }}
            onInspectRepository={(repositoryId) => {
              repositories.setSelectedRepositoryId(repositoryId);
              setAnalysisMode("repo");
              setScreen("analyzer");
            }}
            onInspectBaseAsset={(baseAssetId) => {
              baseAssets.setSelectedBaseAssetId(baseAssetId);
              setAnalysisMode("base");
              setScreen("analyzer");
            }}
            onInspectComposition={(compositionId) => {
              compositions.setSelectedCompositionId(compositionId);
              setAnalysisMode("composition");
              setScreen("analyzer");
            }}
          />
        ) : (
          <AnalyzerScreen
            track={library.selectedTrack}
            repository={repositories.selectedRepository}
            baseAsset={baseAssets.selectedBaseAsset}
            composition={compositions.selectedComposition}
            availableBaseAssets={baseAssets.baseAssets}
            availableCompositions={compositions.compositions}
            availableTracks={library.tracks}
            mode={analysisMode}
            analyzerLabel={analyzerLabel}
            onGoLibrary={() => setScreen("library")}
          />
        )}
      </section>
    </main>
  );
}
