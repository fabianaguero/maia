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
import { MonitorActiveDeckSection } from "./MonitorActiveDeckSection";
import { MonitorActiveFooter } from "./MonitorActiveFooter";
import { LiveTailPanel } from "./LiveTailPanel";
import { useT } from "../../i18n/I18nContext";
import { buildSimpleMonitorActiveViewSections } from "./simpleMonitorActiveViewRuntime";

export interface SimpleMonitorActiveViewProps {
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
  monitorTrackMissing: boolean;
  musicStyleLabel?: string | null;
  deckPresetLabel?: string | null;
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
  audioStatus: AudioContextState;
  onResumeAudio: () => Promise<void> | void;
}

export function SimpleMonitorActiveView({ ...props }: SimpleMonitorActiveViewProps) {
  const t = useT();
  const { headerProps, deckSectionProps, liveTailProps, footerProps } =
    buildSimpleMonitorActiveViewSections({
      t,
      props,
    });

  return (
    <div className="monitor-active">
      <MonitorActiveHeader {...headerProps} />
      <MonitorActiveDeckSection {...deckSectionProps} />
      <LiveTailPanel {...liveTailProps} />
      <MonitorActiveFooter {...footerProps} />
    </div>
  );
}
