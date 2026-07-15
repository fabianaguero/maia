import type { MouseEvent, PointerEvent, RefObject } from "react";

import type {
  MonitorLegendItemViewModel,
  MonitorMetaChipViewModel,
} from "./activeMonitorDeckViewModel";
import type {
  AnomalyBurstRegion,
  OverviewAnomalyMarker,
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
} from "./monitorDeckViewModel";
import { MonitorDeckHeader } from "./MonitorDeckHeader";
import { MonitorDeckWavePanel } from "./MonitorDeckWavePanel";
import { truncateMiddle } from "./monitorDisplay";

export interface MonitorActiveDeckSectionProps {
  monitorSourcePath: string;
  deckTrackLine: string;
  trackMissing: boolean;
  legendItems: MonitorLegendItemViewModel[];
  metaChips: MonitorMetaChipViewModel[];
  focusBadgeLabel: string | null;
  focusBadgeTone: "warning" | "critical" | null;
  focusTimestamp: string | null;
  focusMessage: string | null;
  focusCueCode: string | null;
  focusBurstLabel: string | null;
  overviewCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformStageRef: RefObject<HTMLDivElement | null>;
  anomalyBurstRegions: AnomalyBurstRegion[];
  selectedBurstRegionId: string | null;
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  selectedAnomalyId: string | null;
  trackWaveProgress: number;
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
}

export function MonitorActiveDeckSection(props: MonitorActiveDeckSectionProps) {
  return (
    <div className="waveform-section-hd">
      <div className="monitor-deck-shell">
        <MonitorDeckHeader
          deckTrackLine={props.deckTrackLine}
          trackMissing={props.trackMissing}
          logSourceLine={truncateMiddle(props.monitorSourcePath, 52)}
          legendItems={props.legendItems}
          metaChips={props.metaChips}
          focusBadgeLabel={props.focusBadgeLabel}
          focusBadgeTone={props.focusBadgeTone}
          focusTimestamp={props.focusTimestamp}
          focusMessage={props.focusMessage}
          focusCueCode={props.focusCueCode}
          focusBurstLabel={props.focusBurstLabel}
        />
        <MonitorDeckWavePanel
          overviewCanvasRef={props.overviewCanvasRef}
          waveformCanvasRef={props.waveformCanvasRef}
          waveformStageRef={props.waveformStageRef}
          anomalyBurstRegions={props.anomalyBurstRegions}
          selectedBurstRegionId={props.selectedBurstRegionId}
          overviewAnomalyMarkers={props.overviewAnomalyMarkers}
          selectedAnomalyId={props.selectedAnomalyId}
          trackWaveProgress={props.trackWaveProgress}
          overviewWindowLeftPercent={props.overviewWindowLeftPercent}
          overviewWindowWidthPercent={props.overviewWindowWidthPercent}
          overviewPlayheadLeftPercent={props.overviewPlayheadLeftPercent}
          onOverviewPointerDown={props.onOverviewPointerDown}
          onOverviewClick={props.onOverviewClick}
          onOverviewAnomalyClick={props.onOverviewAnomalyClick}
          onOverviewAnomalyPointerDown={props.onOverviewAnomalyPointerDown}
          deckTimelineMarkers={props.deckTimelineMarkers}
          deckBeatMarkers={props.deckBeatMarkers}
          onStagePointerDown={props.onStagePointerDown}
          onStageClick={props.onStageClick}
          stageHeightPx={props.stageHeightPx}
        />
        <div className="waveform-glow-bg" />
      </div>
    </div>
  );
}
