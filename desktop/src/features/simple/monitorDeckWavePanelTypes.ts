import type React from "react";

export interface AnomalyBurstRegionViewModel {
  id: string;
  startProgress: number;
  endProgress: number;
  severity: number;
  count: number;
}

export interface OverviewAnomalyMarkerViewModel {
  id: string;
  progress: number;
  severity: number;
  timestamp: string;
  message: string;
  leftPercent: number;
}

export interface DeckTimelineMarkerViewModel {
  id: string;
  leftPercent: number;
  label: string;
  emphasis: "major" | "minor" | "playhead";
}

export interface DeckBeatMarkerViewModel {
  id: string;
  leftPercent: number;
  major: boolean;
}

export interface MonitorDeckWavePanelProps {
  overviewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  waveformCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  waveformStageRef: React.RefObject<HTMLDivElement | null>;
  anomalyBurstRegions: AnomalyBurstRegionViewModel[];
  selectedBurstRegionId?: string | null;
  overviewAnomalyMarkers: OverviewAnomalyMarkerViewModel[];
  selectedAnomalyId: string | null;
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  onOverviewPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onOverviewClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onOverviewAnomalyClick: (
    marker: OverviewAnomalyMarkerViewModel,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onOverviewAnomalyPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  deckTimelineMarkers: DeckTimelineMarkerViewModel[];
  deckBeatMarkers: DeckBeatMarkerViewModel[];
  onStagePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  stageHeightPx: number;
}
