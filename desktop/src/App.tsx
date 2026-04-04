import { useEffect, useState } from "react";

import { loadBootstrapManifest, runAnalyzerRequest } from "./api/analyzer";
import { AppSidebar } from "./components/AppSidebar";
import { AnalyzerScreen } from "./features/analyzer/AnalyzerScreen";
import { LibraryScreen } from "./features/library/LibraryScreen";
import { useLibrary } from "./hooks/useLibrary";
import {
  createHealthRequest,
  type AnalyzerResponse,
  type BootstrapManifest,
  type HealthResponse,
} from "./contracts";
import type { AppScreen, ImportTrackInput } from "./types/library";

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
  const library = useLibrary();

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
      setScreen("analyzer");
      return true;
    }

    return false;
  }

  const analyzerLabel = isHealthResponse(health)
    ? `${health.payload.analyzerVersion} on ${health.payload.runtime}`
    : booting
      ? "Booting analyzer bridge"
      : "Analyzer unavailable";

  return (
    <main className="app-shell">
      <AppSidebar
        currentScreen={screen}
        onScreenChange={setScreen}
        trackCount={library.tracks.length}
        selectedTrackTitle={library.selectedTrack?.title ?? null}
        manifest={manifest}
        analyzerLabel={analyzerLabel}
      />

      <section className="app-main">
        <header className="topbar panel">
          <div>
            <p className="eyebrow">Desktop runtime</p>
            <h2>Local analysis workspace</h2>
            <p className="support-copy">
              Tracks and mocked analyzer state persist locally, ready for the
              real waveform and repo heuristics to replace them.
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
            selectedTrackId={library.selectedTrackId}
            manifest={manifest}
            loading={library.loading}
            busy={library.mutating}
            error={library.error}
            onImportTrack={handleImportTrack}
            onSeedDemo={library.seedLibrary}
            onSelectTrack={library.setSelectedTrackId}
            onInspectTrack={(trackId) => {
              library.setSelectedTrackId(trackId);
              setScreen("analyzer");
            }}
          />
        ) : (
          <AnalyzerScreen
            track={library.selectedTrack}
            analyzerLabel={analyzerLabel}
            onGoLibrary={() => setScreen("library")}
          />
        )}
      </section>
    </main>
  );
}
