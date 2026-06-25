import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { SimpleMonitorScreen } from "./features/simple/SimpleMonitorScreen";
import { ProMonitorScreen } from "./features/simple/ProMonitorScreen";
import { ProLibraryScreen } from "./features/simple/ProLibraryScreen";
import { SimpleModeLibraryView } from "./features/simple/SimpleModeLibraryView";
import { ConnectionsScreen } from "./features/simple/ConnectionsScreen";
import { MonitorSetupScreen } from "./features/simple/MonitorSetupScreen";
import { WaveformBar } from "./components/WaveformBar";
import { UserModeProvider, useUserMode } from "./features/simple/UserModeContext";
import type { AppSection } from "./features/simple/appSections";
import { I18nContext } from "./i18n/I18nContext";
import { es } from "./i18n/es";
import { en } from "./i18n/en";
import { NotificationProvider } from "./components/NotificationSystem";
import { startLogSourceConnection } from "./api/repositories";
import { useLibrary } from "./hooks/useLibrary";
import { useRepositories } from "./hooks/useRepositories";
import { useBaseAssets } from "./hooks/useBaseAssets";
import { useCompositionResults } from "./hooks/useCompositionResults";
import { useMonitor } from "./features/monitor/MonitorContext";
import { useSessions } from "./hooks/useSessions";
import { getTrackTitle, resolvePlayableTrackPath } from "./utils/track";

const APP_V0_LANG_STORAGE_KEY = "maia.app-v0.lang";

function AppContentV0() {
  const { userMode } = useUserMode();
  const [lang, setLang] = useState<"en" | "es">("es");
  const [currentSection, setCurrentSection] = useState<AppSection>("monitor");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  const library = useLibrary();
  const repositories = useRepositories();
  const baseAssets = useBaseAssets();
  useCompositionResults();
  const monitor = useMonitor();
  const pastSessions = useSessions();

  const isMonitoring = !!monitor.session;

  const t = lang === "es" ? es : en;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = window.localStorage.getItem(APP_V0_LANG_STORAGE_KEY);
    if (saved === "en" || saved === "es") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(APP_V0_LANG_STORAGE_KEY, lang);
  }, [lang]);

  const uptimeSeconds = monitor.session
    ? Math.floor((Date.now() - monitor.session.startedAt) / 1000)
    : 0;
  const uptimeLabel =
    uptimeSeconds < 60
      ? `${uptimeSeconds}s`
      : `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`;

  const renderContent = () => {
    switch (currentSection) {
      case "monitor":
        return userMode === "simple" ? (
          <SimpleMonitorScreen
            session={monitor.session}
            metrics={monitor.metrics}
            pastSessions={pastSessions.sessions}
            repositories={repositories.repositories}
            tracks={library.tracks}
            onStop={() => monitor.stopSession()}
            onResumeAudio={() => monitor.resumeAudio()}
            audioStatus={monitor.audioContext?.state || "closed"}
            audioContext={monitor.audioContext}
            trackName={monitor.session?.trackName}
            waveformBins={
              library.tracks.find((t) => getTrackTitle(t) === monitor.session?.trackName)?.analysis
                ?.waveformBins
            }
            onStartMonitoring={async (source, trackId) => {
              try {
                console.log("🎵 onStartMonitoring called:", {
                  source,
                  trackId,
                  trackIds: library.tracks.map((t) => t.id),
                });
                const track = library.tracks.find((t) => t.id === trackId);
                const guideTrackPath = track ? resolvePlayableTrackPath(track) : null;
                const sessionId =
                  typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                if (!track) {
                  console.error("🎵 No track selected for monitoring start");
                  return;
                }

                if (guideTrackPath) {
                  monitor.setGuideTrack(guideTrackPath);
                }
                await monitor.resumeAudio();

                if (source.origin === "connection" && source.connectionId) {
                  console.log("🎵 Starting connection:", { source, track: !!track });
                  const streamSession = await startLogSourceConnection({
                    connectionId: source.connectionId,
                    sessionId,
                    startFromBeginning: false,
                  });

                  const success = await monitor.attachSession({
                    session: streamSession,
                    repoId: source.id,
                    repoTitle: source.title,
                    trackTitle: getTrackTitle(track),
                  });
                  if (success) {
                    setCurrentSection("monitor");
                  }
                  return;
                }

                const repo = repositories.repositories.find((r) => r.id === source.id);
                console.log("🎵 Found file source:", {
                  repo: !!repo,
                  track: !!track,
                  sourcePath: guideTrackPath,
                });
                if (!repo) {
                  console.error("🎵 Monitor source not found in repositories:", source);
                  return;
                }

                const success = await monitor.startSession(repo, {
                  sessionId,
                  source: repo.sourcePath,
                  adapterKind: "file",
                  trackTitle: getTrackTitle(track),
                  startFromBeginning: true, // Ensure we see existing logs
                });
                if (success) setCurrentSection("monitor");
              } catch (error) {
                console.error("🎵 Failed to start monitoring source", error);
              }
            }}
            onReplaySession={async (sessionId, sourcePath, repoTitle) => {
              await monitor.playbackSession({
                sessionId,
                sourcePath,
                label: repoTitle,
              });
            }}
            subscribe={monitor.subscribe}
            isConsoleExpanded={isConsoleExpanded}
            onToggleConsole={() => setIsConsoleExpanded(!isConsoleExpanded)}
          />
        ) : (
          <ProMonitorScreen />
        );
      case "library":
        return userMode === "simple" ? (
          <div style={{ display: "flex", gap: "2rem", height: "100%" }}>
            <div style={{ flex: 1 }}>
              <SimpleModeLibraryView
                tracks={library.tracks}
                repositories={repositories.repositories}
                baseAssets={baseAssets.baseAssets}
                selectedRepositoryId={repositories.selectedRepositoryId}
                onSelectRepository={(id) => repositories.setSelectedRepositoryId(id)}
                onImportRepository={async (input) => {
                  const repo = await repositories.importRepositorySource(input);
                  return !!repo;
                }}
                onImportBaseAsset={async (input) => {
                  const asset = await baseAssets.importLibraryBaseAsset(input);
                  return !!asset;
                }}
                selectedTrackId={library.selectedTrackId}
                onSelectTrack={(id) => library.setSelectedTrackId(id)}
                onStartMonitoring={async (repoId) => {
                  const repo = repositories.repositories.find((r) => r.id === repoId);
                  const track = library.selectedTrack ?? library.tracks[0];
                  if (repo && track) {
                    const sessionId =
                      typeof crypto.randomUUID === "function"
                        ? crypto.randomUUID()
                        : `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                    const guideTrackPath = resolvePlayableTrackPath(track);
                    if (guideTrackPath) {
                      monitor.setGuideTrack(guideTrackPath);
                    }
                    await monitor.resumeAudio(); // Auto-resume on start
                    const success = await monitor.startSession(repo, {
                      sessionId,
                      source: repo.sourcePath,
                      adapterKind: "file",
                      trackTitle: getTrackTitle(track),
                      startFromBeginning: true, // Ensure we see existing logs
                    });
                    if (success) setCurrentSection("monitor");
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <ProLibraryScreen
            tracks={library.tracks}
            repositories={repositories.repositories}
            baseAssets={baseAssets.baseAssets}
          />
        );
      case "connections":
        return <ConnectionsScreen />;
      case "setup":
        return <MonitorSetupScreen lang={lang} onChangeLanguage={setLang} />;
      default:
        return (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#a8b3c1",
              fontSize: "14px",
            }}
          >
            <p>
              {lang === "es"
                ? "Sección no implementada en esta versión de desarrollo"
                : "Section not implemented in this development build"}
            </p>
            <p style={{ marginTop: "1rem", fontSize: "12px", color: "#7a8297" }}>
              {lang === "es"
                ? "Usá el lateral para navegar a Monitor o Biblioteca"
                : "Use the sidebar to navigate to Monitor or Library"}
            </p>
          </div>
        );
    }
  };

  return (
    <I18nContext.Provider value={t}>
      <>
        <AppShell
          currentSection={currentSection as any}
          isMonitoring={isMonitoring}
          monitoringStatus={{
            source: monitor.session?.repoTitle,
            anomalies: monitor.metrics.totalAnomalies,
            uptime: uptimeLabel,
            confidence: 87,
          }}
          trackCount={library.tracks.length}
          repositoryCount={repositories.repositories.length}
          baseAssetCount={baseAssets.baseAssets.length}
          onSectionChange={(section) => setCurrentSection(section)}
          onInspect={() => {
            setCurrentSection("monitor");
            setIsConsoleExpanded(true);
          }}
          onStopMonitoring={() => {
            void monitor.stopSession();
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {renderContent()}
          <div
            className="app-content-header"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              zIndex: 100,
              display: "flex",
              gap: "1rem",
            }}
          >
            {/* Audio activation button removed - now automatic */}
          </div>
        </AppShell>
        {isMonitoring && currentSection !== "monitor" && (
          <WaveformBar
            isActive={true}
            source={monitor.session?.repoTitle || t.simpleMode.common.unknown}
            anomalies={monitor.metrics.totalAnomalies}
            uptime={
              Math.floor(
                (Date.now() - (monitor.session?.startedAt || Date.now())) / 1000,
              ).toString() + "s"
            }
            onStop={() => monitor.stopSession()}
            onInspect={() => setCurrentSection("monitor")}
          />
        )}
      </>
    </I18nContext.Provider>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <UserModeProvider>
        <AppContentV0 />
      </UserModeProvider>
    </NotificationProvider>
  );
}
