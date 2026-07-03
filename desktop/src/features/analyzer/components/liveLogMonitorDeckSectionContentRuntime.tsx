import type { ComponentProps, ReactNode } from "react";

import type { MetricGridItem, LiveMonitorDisplayState } from "./liveLogMonitorDisplayRuntime";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { LiveLogMarker, LibraryTrack, VisualizationCuePoint } from "../../../types/library";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import type { AppTranslations } from "../../../i18n/types";
import type { RoutedLiveCue, ArrangementVoice } from "./liveSonificationScene";
import { LiveLogMonitorDeckSection } from "./LiveLogMonitorDeckSection";
import { LiveWaveformCanvas } from "./LiveWaveformCanvas";
import {
  buildLiveLogMonitorDeckActivityPanelProps,
  buildLiveLogMonitorPerformanceSummaryProps,
  buildLiveLogMonitorSequencerPanelProps,
  buildLiveLogMonitorTracePanelProps,
} from "./liveLogMonitorDeckSectionRuntime";

export interface BuildLiveLogMonitorDeckSectionContentInput {
  t: AppTranslations;
  liveEnabled: boolean;
  replayActive: boolean;
  playbackEventIndex: number | null;
  beatClockBpm: number | null;
  repositorySuggestedBpm: number | null;
  sceneGenreId: string;
  isAnomalyFlash: boolean;
  traceWaveformTrack: LibraryTrack | null;
  traceWaveformExplanations: LiveMutationExplanation[];
  traceWaveformCues: VisualizationCuePoint[];
  traceWaveformCurrentTime: number;
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  recentCues: RoutedLiveCue[];
  recentVoices: ArrangementVoice[];
  recentMarkers: LiveLogMarker[];
  recentWarnings: string[];
  error: string | null;
  lastUpdateSummary: string;
  lastUpdateTopComponents: Array<{ component: string; count: number }>;
  windowMetricGridItems: MetricGridItem[];
  waveAnomalyMarkers: LiveLogMarker[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  anomalySourceRows: LiveMonitorDisplayState["anomalySourceRows"];
  activeTailWindowId: string | null;
  syncTailListRef: ComponentProps<
    typeof LiveLogMonitorDeckSection
  >["activityPanelProps"]["syncTailListRef"];
  analyserRef: ComponentProps<typeof LiveWaveformCanvas>["analyserRef"];
  onSelectExplanation: (explanation: LiveMutationExplanation) => void;
  onSequencerStepFire: ComponentProps<
    typeof LiveLogMonitorDeckSection
  >["sequencerPanelProps"]["onStepFire"];
}

export function buildLiveLogMonitorDeckSectionContent(
  input: BuildLiveLogMonitorDeckSectionContentInput,
): ReactNode {
  const accentColor = input.sceneGenreId === "tropical-house" ? "#ef7f45" : "#21b4b8";

  return (
    <LiveLogMonitorDeckSection
      hasUpdate={Boolean(input.lastUpdateSummary)}
      emptyStateLabel={input.t.inspect.startLiveTailHint}
      activityPanelProps={buildLiveLogMonitorDeckActivityPanelProps({
        t: input.t,
        sceneGenreId: input.sceneGenreId,
        recentCues: input.recentCues,
        waveAnomalyMarkers: input.waveAnomalyMarkers,
        liveSourceLabel: input.liveSourceLabel,
        recentSyncTailRows: input.recentSyncTailRows,
        anomalySourceRows: input.anomalySourceRows,
        activeTailWindowId: input.activeTailWindowId,
        syncTailListRef: input.syncTailListRef,
        waveform: (
          <LiveWaveformCanvas
            analyserRef={input.analyserRef}
            active={input.liveEnabled}
            accentColor={accentColor}
            isAnomaly={input.isAnomalyFlash}
          />
        ),
      })}
      windowSummaryLabel={input.t.inspect.currentWindowSummary}
      windowSummary={input.lastUpdateSummary}
      windowMetrics={input.windowMetricGridItems}
      activeComponentsTitle={input.t.inspect.activeComponentsTitle}
      activeComponentsCopy={input.t.inspect.activeComponentsCopy}
      activeComponents={input.lastUpdateTopComponents}
      tracePanelProps={buildLiveLogMonitorTracePanelProps({
        replayActive: input.replayActive,
        playbackEventIndex: input.playbackEventIndex,
        traceWaveformTrack: input.traceWaveformTrack,
        traceWaveformExplanations: input.traceWaveformExplanations,
        traceWaveformCues: input.traceWaveformCues,
        traceWaveformCurrentTime: input.traceWaveformCurrentTime,
        recentExplanations: input.recentExplanations,
        selectedExplanationId: input.selectedExplanationId,
        onSelectExplanation: input.onSelectExplanation,
      })}
      performanceSummaryProps={buildLiveLogMonitorPerformanceSummaryProps({
        t: input.t,
        recentVoices: input.recentVoices,
        recentCues: input.recentCues,
        recentMarkers: input.recentMarkers,
        recentWarnings: input.recentWarnings,
        error: input.error,
      })}
      sequencerPanelProps={buildLiveLogMonitorSequencerPanelProps({
        beatClockBpm: input.beatClockBpm,
        repositorySuggestedBpm: input.repositorySuggestedBpm,
        recentVoices: input.recentVoices,
        onStepFire: input.onSequencerStepFire,
      })}
    />
  );
}
