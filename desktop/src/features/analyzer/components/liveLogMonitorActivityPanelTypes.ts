import type { CSSProperties, ReactNode, RefObject } from "react";

import type { LiveLogMarker } from "../../../types/library";
import type { RoutedLiveCue } from "./liveSonificationScene";
import type { AnomalySourceRow, SyncTailRow } from "./liveLogMonitorPanelRuntime";

export type WaveBarStyle = CSSProperties & {
  "--bar-height": string;
  "--bar-opacity": number;
};

export type TailCellStyle = CSSProperties & {
  "--cell-opacity": number;
};

export interface LiveLogMonitorActivityLabels {
  liveSystemRhythm: string;
  liveSystemRhythmCopy: string;
  awaitingSystemPulse: string;
  idleUpper: string;
  waveAnomalyMarkers: string;
  noAnomalyMarkersLatestWindows: string;
  waveSourceStream: string;
  streamTailSync: string;
  syncTailAria: string;
  waitingSynchronizedLines: string;
  anomalySourceLines: string;
  anomalySourceAria: string;
  noAnomalyProducingLine: string;
}

export interface LiveLogMonitorActivityPanelProps {
  waveform: ReactNode;
  recentCues: RoutedLiveCue[];
  waveAnomalyMarkers: LiveLogMarker[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  anomalySourceRows: AnomalySourceRow[];
  activeTailWindowId: string | null;
  syncTailListRef: RefObject<HTMLDivElement | null>;
  isTropicalTheme: boolean;
  maxRecentCues: number;
  maxSyncTailLines: number;
  maxAnomalySourceLines: number;
  labels: LiveLogMonitorActivityLabels;
}
