import { ConnectionsScreen } from "./features/simple/ConnectionsScreen";
import { MonitorSetupScreen } from "./features/simple/MonitorSetupScreen";
import { ProLibraryScreen } from "./features/simple/ProLibraryScreen";
import { ProMonitorScreen } from "./features/simple/ProMonitorScreen";
import { SimpleModeLibraryView } from "./features/simple/SimpleModeLibraryView";
import { SimpleMonitorScreen } from "./features/simple/SimpleMonitorScreen";
import {
  buildAppV0FallbackPanelStyle,
  buildAppV0SectionRenderModel,
  type AppV0SectionContentInput,
} from "./appV0SectionContentRuntime";

type AppV0SectionContentProps = AppV0SectionContentInput;

export function AppV0SectionContent({
  currentSection,
  userMode,
  fallbackViewModel,
  setupPreferences,
  lang,
  skin,
  onChangeLanguage,
  onChangeSkin,
  onUpdateSetupPreference,
  monitorSession,
  monitorMetrics,
  pastSessions,
  repositories,
  tracks,
  baseAssets,
  selectedRepositoryId,
  onSelectRepository,
  onImportRepository,
  onImportBaseAsset,
  selectedTrackId,
  onSelectTrack,
  onStartLibraryMonitoring,
  onStopMonitor,
  onResumeAudio,
  audioStatus,
  audioContext,
  monitorTrackName,
  waveformBins,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  isConsoleExpanded,
  onToggleConsole,
}: AppV0SectionContentProps) {
  const renderModel = buildAppV0SectionRenderModel({
    currentSection,
    userMode,
    fallbackViewModel,
    setupPreferences,
    lang,
    skin,
    onChangeLanguage,
    onChangeSkin,
    onUpdateSetupPreference,
    monitorSession,
    monitorMetrics,
    pastSessions,
    repositories,
    tracks,
    baseAssets,
    selectedRepositoryId,
    onSelectRepository,
    onImportRepository,
    onImportBaseAsset,
    selectedTrackId,
    onSelectTrack,
    onStartLibraryMonitoring,
    onStopMonitor,
    onResumeAudio,
    audioStatus,
    audioContext,
    monitorTrackName,
    waveformBins,
    onStartMonitoring,
    onReplaySession,
    subscribe,
    isConsoleExpanded,
    onToggleConsole,
  });

  switch (renderModel.kind) {
    case "simple-monitor":
      return <SimpleMonitorScreen {...renderModel.simpleMonitorProps} />;
    case "pro-monitor":
      return <ProMonitorScreen />;
    case "simple-library":
      return (
        <div style={{ display: "flex", gap: "2rem", height: "100%" }}>
          <div style={{ flex: 1 }}>
            <SimpleModeLibraryView {...renderModel.simpleLibraryProps} />
          </div>
        </div>
      );
    case "pro-library":
      return <ProLibraryScreen {...renderModel.proLibraryProps} />;
    case "connections":
      return <ConnectionsScreen {...renderModel.connectionsProps} />;
    case "setup":
      return <MonitorSetupScreen {...renderModel.setupProps} />;
    case "fallback":
    default:
      return (
        <div style={buildAppV0FallbackPanelStyle()}>
          <p>{renderModel.fallbackViewModel.message}</p>
          <p style={{ marginTop: "1rem", fontSize: "12px", color: "#7a8297" }}>
            {renderModel.fallbackViewModel.hint}
          </p>
        </div>
      );
  }
}
