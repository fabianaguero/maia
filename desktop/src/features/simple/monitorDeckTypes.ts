export interface WaveformAnomalyMarker {
  id: string;
  lineId: string;
  timestamp: string;
  message: string;
  severity: number;
  progress: number;
}

export interface LogWaveOverlayPoint {
  level: number;
  heat: number;
}

export interface DeckSelectedMarker {
  id: string;
  severity: number;
  progress: number;
  timestamp: string;
  message: string;
}

export interface OverviewAnomalyDensityPoint {
  warning: number;
  critical: number;
}

export interface AnomalyBurstRegion {
  id: string;
  startProgress: number;
  endProgress: number;
  severity: number;
  count: number;
}

export interface OverviewAnomalyMarker extends WaveformAnomalyMarker {
  leftPercent: number;
}

export interface MonitorDeckDerivedState {
  overviewWaveSamples: number[];
  overviewAnomalyDensity: OverviewAnomalyDensityPoint[];
  anomalyBurstRegions: AnomalyBurstRegion[];
  overviewWindowWidthPercent: number;
  overviewWindowLeftPercent: number;
  overviewPlayheadLeftPercent: number;
  logWaveOverlay: LogWaveOverlayPoint[];
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstRegion: AnomalyBurstRegion | null;
}

export const MONITOR_TRACK_WINDOW_POINTS = 420;
