import type { ComponentProps, ReactNode } from "react";

import type { AppTranslations } from "../../../i18n/types";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { LiveLogMarker, LibraryTrack, VisualizationCuePoint } from "../../../types/library";
import { type LiveLogMonitorActiveDeck } from "./LiveLogMonitorActiveDeck";
import { type LiveLogMonitorPerformanceSummary } from "./LiveLogMonitorPerformanceSummary";
import { type LiveMonitorMutationTracePanel } from "./LiveMonitorMutationTracePanel";
import { type PadSequencerPanel } from "./PadSequencerPanel";
import type { LiveMonitorDisplayState } from "./liveLogMonitorDisplayRuntime";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import type { ArrangementVoice, RoutedLiveCue } from "./liveSonificationScene";
import type { LiveLogMonitorDeckSection } from "./LiveLogMonitorDeckSection";

export interface BuildLiveLogMonitorDeckActivityPanelPropsInput {
  t: AppTranslations;
  sceneGenreId: string;
  recentCues: RoutedLiveCue[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  waveAnomalyMarkers: LiveLogMarker[];
  anomalySourceRows: LiveMonitorDisplayState["anomalySourceRows"];
  activeTailWindowId: string | null;
  syncTailListRef: ComponentProps<
    typeof LiveLogMonitorDeckSection
  >["activityPanelProps"]["syncTailListRef"];
  waveform: ReactNode;
}

export interface BuildLiveLogMonitorTracePanelPropsInput {
  replayActive: boolean;
  playbackEventIndex: number | null;
  traceWaveformTrack: LibraryTrack | null;
  traceWaveformExplanations: LiveMutationExplanation[];
  traceWaveformCues: VisualizationCuePoint[];
  traceWaveformCurrentTime: number;
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  onSelectExplanation: (explanation: LiveMutationExplanation) => void;
}

export interface BuildLiveLogMonitorPerformanceSummaryPropsInput {
  t: AppTranslations;
  recentVoices: ArrangementVoice[];
  recentCues: RoutedLiveCue[];
  recentMarkers: LiveLogMarker[];
  recentWarnings: string[];
  error: string | null;
}

export interface BuildLiveLogMonitorSequencerPanelPropsInput {
  beatClockBpm: number | null;
  repositorySuggestedBpm: number | null;
  recentVoices: ArrangementVoice[];
  onStepFire: ComponentProps<typeof PadSequencerPanel>["onStepFire"];
}

export function buildLiveLogMonitorDeckActivityPanelProps(
  input: BuildLiveLogMonitorDeckActivityPanelPropsInput,
): ComponentProps<typeof LiveLogMonitorActiveDeck>["activityPanelProps"] {
  return {
    waveform: input.waveform,
    recentCues: input.recentCues,
    waveAnomalyMarkers: input.waveAnomalyMarkers,
    liveSourceLabel: input.liveSourceLabel,
    recentSyncTailRows: input.recentSyncTailRows,
    anomalySourceRows: input.anomalySourceRows,
    activeTailWindowId: input.activeTailWindowId,
    syncTailListRef: input.syncTailListRef,
    isTropicalTheme: input.sceneGenreId === "tropical-house",
    maxRecentCues: 8,
    maxSyncTailLines: 60,
    maxAnomalySourceLines: 6,
    labels: {
      liveSystemRhythm: input.t.inspect.liveSystemRhythm,
      liveSystemRhythmCopy: input.t.inspect.liveSystemRhythmCopy,
      awaitingSystemPulse: input.t.inspect.awaitingSystemPulse,
      idleUpper: input.t.inspect.idleUpper,
      waveAnomalyMarkers: input.t.inspect.waveAnomalyMarkers,
      noAnomalyMarkersLatestWindows: input.t.inspect.noAnomalyMarkersLatestWindows,
      waveSourceStream: input.t.inspect.waveSourceStream,
      streamTailSync: input.t.inspect.streamTailSync,
      syncTailAria: input.t.inspect.syncTailAria,
      waitingSynchronizedLines: input.t.inspect.waitingSynchronizedLines,
      anomalySourceLines: input.t.inspect.anomalySourceLines,
      anomalySourceAria: input.t.inspect.anomalySourceAria,
      noAnomalyProducingLine: input.t.inspect.noAnomalyProducingLine,
    },
  };
}

export function buildLiveLogMonitorTracePanelProps(
  input: BuildLiveLogMonitorTracePanelPropsInput,
): ComponentProps<typeof LiveMonitorMutationTracePanel> {
  return {
    replayActive: input.replayActive,
    playbackEventIndex: input.playbackEventIndex,
    traceWaveformTrack: input.traceWaveformTrack,
    traceWaveformExplanations: input.traceWaveformExplanations,
    traceWaveformCues: input.traceWaveformCues,
    traceWaveformCurrentTime: input.traceWaveformCurrentTime,
    recentExplanations: input.recentExplanations,
    selectedExplanationId: input.selectedExplanationId,
    onSelectExplanation: input.onSelectExplanation,
  };
}

export function buildLiveLogMonitorPerformanceSummaryProps(
  input: BuildLiveLogMonitorPerformanceSummaryPropsInput,
): Omit<ComponentProps<typeof LiveLogMonitorPerformanceSummary>, "sequencerPanel"> {
  return {
    recentVoices: input.recentVoices,
    recentCues: input.recentCues,
    recentMarkers: input.recentMarkers,
    recentWarnings: input.recentWarnings,
    error: input.error,
    labels: {
      arrangementLayers: input.t.inspect.arrangementLayers,
      arrangementLayersCopy: input.t.inspect.arrangementLayersCopy,
      noArrangementVoices: input.t.inspect.noArrangementVoices,
      padSequencerTitle: input.t.inspect.padSequencerTitle,
      padSequencerCopy: input.t.inspect.padSequencerCopy,
      recentCuesTitle: input.t.inspect.recentCuesTitle,
      recentCuesCopy: input.t.inspect.recentCuesCopy,
      noLiveCues: input.t.inspect.noLiveCues,
      recentAnomalyMarkersTitle: input.t.inspect.recentAnomalyMarkersTitle,
      recentAnomalyMarkersCopy: input.t.inspect.recentAnomalyMarkersCopy,
      eventLabel: input.t.inspect.eventLabel,
      noAnomalyMarkersSession: input.t.inspect.noAnomalyMarkersSession,
      monitorNotesTitle: input.t.inspect.monitorNotesTitle,
      monitorNotesCopy: input.t.inspect.monitorNotesCopy,
      runtimeError: input.t.inspect.runtimeError,
      monitorNoteLabel: input.t.inspect.monitorNoteLabel,
    },
  };
}

export function buildLiveLogMonitorSequencerPanelProps(
  input: BuildLiveLogMonitorSequencerPanelPropsInput,
): ComponentProps<typeof PadSequencerPanel> {
  return {
    bpm: input.beatClockBpm ?? input.repositorySuggestedBpm ?? 120,
    recentVoices: input.recentVoices,
    onStepFire: input.onStepFire,
  };
}
