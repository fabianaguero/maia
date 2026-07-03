import type { ReactNode } from "react";

import type { LiveLogMarker } from "../../../types/library";
import type { ArrangementVoice, RoutedLiveCue } from "./liveSonificationScene";

export interface LiveLogMonitorPerformanceSummaryLabels {
  arrangementLayers: string;
  arrangementLayersCopy: string;
  noArrangementVoices: string;
  padSequencerTitle: string;
  padSequencerCopy: string;
  recentCuesTitle: string;
  recentCuesCopy: string;
  noLiveCues: string;
  recentAnomalyMarkersTitle: string;
  recentAnomalyMarkersCopy: string;
  eventLabel: string;
  noAnomalyMarkersSession: string;
  monitorNotesTitle: string;
  monitorNotesCopy: string;
  runtimeError: string;
  monitorNoteLabel: string;
}

export interface LiveLogMonitorPerformanceSummaryProps {
  recentVoices: ArrangementVoice[];
  recentCues: RoutedLiveCue[];
  recentMarkers: LiveLogMarker[];
  recentWarnings: string[];
  error: string | null;
  sequencerPanel: ReactNode;
  labels: LiveLogMonitorPerformanceSummaryLabels;
}
