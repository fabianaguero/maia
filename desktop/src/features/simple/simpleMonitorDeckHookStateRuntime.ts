import type { MouseEvent, PointerEvent, UIEvent } from "react";

import type { LibraryTrack } from "../../types/library";
import type {
  AnomalyBurstRegion,
  DeckSelectedMarker,
  OverviewAnomalyMarker,
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
} from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";

export interface BuildSimpleMonitorDeckHookStateArgs {
  activeTrack: LibraryTrack | null;
  previewTrackId: string | null;
  toggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
  deckPresetLabel: string;
  streamAdapterLabel: string;
  isMonitorActive: boolean;
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  simulateLog: () => void;
  terminalLinesRef: { current: HTMLDivElement | null };
  onTerminalScroll: (event: UIEvent<HTMLDivElement>) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
  focusAnomaly: (anomalyId: string) => void;
  deckBpm: number | null;
  trackElapsedSeconds: number;
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  overviewCanvasRef: { current: HTMLCanvasElement | null };
  waveformCanvasRef: { current: HTMLCanvasElement | null };
  waveformStageRef: { current: HTMLDivElement | null };
  anomalyBurstRegions: AnomalyBurstRegion[];
  selectedBurstRegion: AnomalyBurstRegion | null;
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  handleOverviewPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleOverviewClick: (event: MouseEvent<HTMLDivElement>) => void;
  handleOverviewAnomalyClick: (
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
  handleOverviewAnomalyPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  selectedDeckMarker: DeckSelectedMarker | null;
  deckTimelineMarkers: ReturnType<typeof buildDeckTimelineMarkers>;
  deckBeatMarkers: ReturnType<typeof buildDeckBeatMarkers>;
  handleStagePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleStageClick: (event: MouseEvent<HTMLDivElement>) => void;
  waveformScale: number;
}

export function buildSimpleMonitorDeckHookState(input: BuildSimpleMonitorDeckHookStateArgs) {
  return {
    activeTrack: input.activeTrack,
    previewTrackId: input.previewTrackId,
    toggleTrackPreview: input.toggleTrackPreview,
    deckPresetLabel: input.deckPresetLabel,
    streamAdapterLabel: input.streamAdapterLabel,
    isMonitorActive: input.isMonitorActive,
    liveLines: input.liveLines,
    selectedAnomalyId: input.selectedAnomalyId,
    simulateLog: input.simulateLog,
    terminalLinesRef: input.terminalLinesRef,
    onTerminalScroll: input.onTerminalScroll,
    registerLineRef: input.registerLineRef,
    focusAnomaly: input.focusAnomaly,
    deckBpm: input.deckBpm,
    trackElapsedSeconds: input.trackElapsedSeconds,
    trackWaveProgress: input.trackWaveProgress,
    deckDurationSeconds: input.deckDurationSeconds,
    overviewCanvasRef: input.overviewCanvasRef,
    waveformCanvasRef: input.waveformCanvasRef,
    waveformStageRef: input.waveformStageRef,
    anomalyBurstRegions: input.anomalyBurstRegions,
    selectedBurstRegion: input.selectedBurstRegion,
    overviewAnomalyMarkers: input.overviewAnomalyMarkers,
    overviewWindowLeftPercent: input.overviewWindowLeftPercent,
    overviewWindowWidthPercent: input.overviewWindowWidthPercent,
    overviewPlayheadLeftPercent: input.overviewPlayheadLeftPercent,
    handleOverviewPointerDown: input.handleOverviewPointerDown,
    handleOverviewClick: input.handleOverviewClick,
    handleOverviewAnomalyClick: input.handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown: input.handleOverviewAnomalyPointerDown,
    selectedDeckMarker: input.selectedDeckMarker,
    deckTimelineMarkers: input.deckTimelineMarkers,
    deckBeatMarkers: input.deckBeatMarkers,
    handleStagePointerDown: input.handleStagePointerDown,
    handleStageClick: input.handleStageClick,
    waveformScale: input.waveformScale,
  };
}
