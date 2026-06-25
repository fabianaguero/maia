import type { MouseEvent, PointerEvent, RefObject, UIEvent } from "react";

import type { MonitorLogLine } from "./monitorLogParsing";
import type {
  AnomalyBurstRegion,
  DeckSelectedMarker,
  OverviewAnomalyMarker,
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
} from "./monitorDeckViewModel";
import { MonitorActiveHeader } from "./MonitorActiveHeader";
import { LiveTailPanel } from "./LiveTailPanel";
import { MonitorDeckHeader } from "./MonitorDeckHeader";
import { MonitorDeckWavePanel } from "./MonitorDeckWavePanel";
import { truncateMiddle } from "./monitorDisplay";
import { useT } from "../../i18n/I18nContext";

interface SimpleMonitorActiveViewProps {
  isConnectingMonitor: boolean;
  monitorSourceTitle: string;
  monitorSourcePath: string;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  totalAnomalies: number;
  uptimeLabel: string;
  onStop: () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onRefresh: () => void;
  onSimulateLog: () => void;
  terminalLinesRef: RefObject<HTMLDivElement | null>;
  onTerminalScroll: (event: UIEvent<HTMLDivElement>) => void;
  liveLines: MonitorLogLine[];
  streamAdapterLabel: string;
  selectedAnomalyId: string | null;
  onSelectAnomalyLine: (anomalyId: string) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
  monitorTrackTitle: string;
  musicStyleLabel?: string | null;
  deckBpm: number | null;
  trackElapsedSeconds: number;
  deckRemainingSeconds: number | null;
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstCount: number | null;
  overviewCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformStageRef: RefObject<HTMLDivElement | null>;
  anomalyBurstRegions: AnomalyBurstRegion[];
  selectedBurstRegionId: string | null;
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  onOverviewPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onOverviewClick: (event: MouseEvent<HTMLDivElement>) => void;
  onOverviewAnomalyClick: (
    marker: {
      id: string;
      progress: number;
      severity: number;
      timestamp: string;
      message: string;
      leftPercent: number;
    },
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  onOverviewAnomalyPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  deckTimelineMarkers: ReturnType<typeof buildDeckTimelineMarkers>;
  deckBeatMarkers: ReturnType<typeof buildDeckBeatMarkers>;
  onStagePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: MouseEvent<HTMLDivElement>) => void;
  stageHeightPx: number;
  trackFooterText: string;
  audioStatus: AudioContextState;
  onResumeAudio: () => Promise<void> | void;
}

export function SimpleMonitorActiveView({
  isConnectingMonitor,
  monitorSourceTitle,
  monitorSourcePath,
  isAnomalyFilterActive,
  onToggleAnomalyFilter,
  onClearAnomalyFilter,
  totalAnomalies,
  uptimeLabel,
  onStop,
  isConsoleExpanded,
  onToggleConsole,
  onRefresh,
  onSimulateLog,
  terminalLinesRef,
  onTerminalScroll,
  liveLines,
  streamAdapterLabel,
  selectedAnomalyId,
  onSelectAnomalyLine,
  registerLineRef,
  monitorTrackTitle,
  musicStyleLabel,
  deckBpm,
  trackElapsedSeconds,
  deckRemainingSeconds,
  selectedDeckMarker,
  selectedBurstCount,
  overviewCanvasRef,
  waveformCanvasRef,
  waveformStageRef,
  anomalyBurstRegions,
  selectedBurstRegionId,
  overviewAnomalyMarkers,
  overviewWindowLeftPercent,
  overviewWindowWidthPercent,
  overviewPlayheadLeftPercent,
  onOverviewPointerDown,
  onOverviewClick,
  onOverviewAnomalyClick,
  onOverviewAnomalyPointerDown,
  deckTimelineMarkers,
  deckBeatMarkers,
  onStagePointerDown,
  onStageClick,
  stageHeightPx,
  trackFooterText,
  audioStatus,
  onResumeAudio,
}: SimpleMonitorActiveViewProps) {
  const t = useT();
  const streamStatusLabel = isConnectingMonitor
    ? t.simpleMode.monitor.sourceStatusConnecting.replace("{adapter}", streamAdapterLabel)
    : liveLines.length > 0
      ? t.simpleMode.monitor.sourceStatusLive
          .replace("{adapter}", streamAdapterLabel)
          .replace("{count}", String(liveLines.length))
      : t.simpleMode.monitor.sourceStatusActive.replace("{adapter}", streamAdapterLabel);
  const audioStatusLabel =
    audioStatus === "running"
      ? t.simpleMode.common.audioActive
      : t.simpleMode.monitor.audioStatusPaused;

  return (
    <div className="monitor-active">
      <MonitorActiveHeader
        isConnectingMonitor={isConnectingMonitor}
        monitorSourceTitle={monitorSourceTitle}
        monitorSourcePath={monitorSourcePath}
        isAnomalyFilterActive={isAnomalyFilterActive}
        totalAnomalies={totalAnomalies}
        uptimeLabel={uptimeLabel}
        onToggleAnomalyFilter={onToggleAnomalyFilter}
        onStop={onStop}
      />

      <LiveTailPanel
        isConsoleExpanded={isConsoleExpanded}
        onToggleConsole={onToggleConsole}
        isAnomalyFilterActive={isAnomalyFilterActive}
        onClearAnomalyFilter={onClearAnomalyFilter}
        onRefresh={onRefresh}
        onSimulateLog={onSimulateLog}
        terminalLinesRef={terminalLinesRef}
        onTerminalScroll={onTerminalScroll}
        liveLines={liveLines}
        isConnectingMonitor={isConnectingMonitor}
        monitorSourcePath={monitorSourcePath}
        streamAdapterLabel={streamAdapterLabel}
        selectedAnomalyId={selectedAnomalyId}
        onSelectAnomalyLine={onSelectAnomalyLine}
        registerLineRef={registerLineRef}
      />

      <div className="waveform-section-hd">
        <div className="monitor-deck-shell">
          <MonitorDeckHeader
            monitorTrackTitle={monitorTrackTitle}
            musicStyleLabel={musicStyleLabel}
            deckBpm={deckBpm}
            trackElapsedSeconds={trackElapsedSeconds}
            deckRemainingSeconds={deckRemainingSeconds}
            selectedDeckMarker={selectedDeckMarker}
            selectedBurstCount={selectedBurstCount}
          />
          <MonitorDeckWavePanel
            overviewCanvasRef={overviewCanvasRef}
            waveformCanvasRef={waveformCanvasRef}
            waveformStageRef={waveformStageRef}
            anomalyBurstRegions={anomalyBurstRegions}
            selectedBurstRegionId={selectedBurstRegionId}
            overviewAnomalyMarkers={overviewAnomalyMarkers}
            selectedAnomalyId={selectedAnomalyId}
            overviewWindowLeftPercent={overviewWindowLeftPercent}
            overviewWindowWidthPercent={overviewWindowWidthPercent}
            overviewPlayheadLeftPercent={overviewPlayheadLeftPercent}
            onOverviewPointerDown={onOverviewPointerDown}
            onOverviewClick={onOverviewClick}
            onOverviewAnomalyClick={onOverviewAnomalyClick}
            onOverviewAnomalyPointerDown={onOverviewAnomalyPointerDown}
            deckTimelineMarkers={deckTimelineMarkers}
            deckBeatMarkers={deckBeatMarkers}
            onStagePointerDown={onStagePointerDown}
            onStageClick={onStageClick}
            stageHeightPx={stageHeightPx}
            trackFooterText={trackFooterText}
            logFooterText={truncateMiddle(monitorSourcePath, 52)}
          />
          <div className="waveform-glow-bg" />
        </div>
      </div>

      <div className="monitor-footer">
        <div className="monitor-footer__status">
          <span className="monitor-footer__status-pill">{streamStatusLabel}</span>
          <span
            className={`monitor-footer__status-pill ${audioStatus === "running" ? "is-live" : "is-muted"}`}
          >
            {audioStatusLabel}
          </span>
        </div>
        <div className="monitor-footer__actions">
          <button className="btn-secondary" onClick={onStop}>
            {t.simpleMode.common.endSession}
          </button>
          <button className="btn-ghost" onClick={() => void onResumeAudio()}>
            {audioStatus === "running"
              ? t.simpleMode.common.audioActive
              : t.simpleMode.common.resumeAudio}
          </button>
          <button className="btn-ghost">{t.simpleMode.common.bookmarkAnomaly}</button>
        </div>
      </div>
    </div>
  );
}
