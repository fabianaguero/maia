import { buildMetricGridItems, type MetricGridItem } from "./liveLogMonitorDisplayRuntime";
import type { LiveLogMonitorPanelStatusStateInput } from "./liveLogMonitorPanelStatusStateTypes";

export function buildLiveLogMonitorPanelStatusMetricGridItems(
  input: Pick<
    LiveLogMonitorPanelStatusStateInput,
    | "t"
    | "replayActive"
    | "activeAdapterLabel"
    | "audioStateLabel"
    | "selectedStyleProfileLabel"
    | "selectedMutationProfileLabel"
    | "playbackWindowLabel"
    | "metrics"
    | "emittedCueCount"
    | "emittedVoiceCount"
    | "beatClockBpm"
    | "beatLooperActive"
  > & {
    cueEngineStateLabel: string;
  },
): MetricGridItem[] {
  return buildMetricGridItems({
    replayActive: input.replayActive,
    replaySessionTitle: input.t.inspect.replaySession,
    activeAdapterLabel: input.activeAdapterLabel,
    audioStateLabel: input.audioStateLabel,
    styleProfileLabel: input.selectedStyleProfileLabel,
    mutationProfileLabel: input.selectedMutationProfileLabel,
    cueEngineStateLabel: input.cueEngineStateLabel,
    playbackWindowLabel: input.playbackWindowLabel,
    windowsHeard: input.metrics.windowCount,
    cuesEmitted: input.emittedCueCount,
    processedLines: input.metrics.processedLines,
    anomaliesHeard: input.metrics.totalAnomalies,
    beatClockBpm: input.beatClockBpm,
    voicesEmitted: input.emittedVoiceCount,
    beatLooperActive: input.beatLooperActive,
    labels: {
      modeLabel: input.t.inspect.mode,
      audioEngineLabel: input.t.simpleMode.monitor.audioEngine,
      styleProfileTitle: input.t.inspect.styleProfileTitle,
      mutationProfileTitle: input.t.inspect.mutationProfileTitle,
      cueEngineLabel: input.t.inspect.cueEngineLabel,
      windowsHeardLabel: input.t.inspect.windowsHeard,
      cuesEmittedLabel: input.t.inspect.cuesEmitted,
      linesProcessedLabel: input.t.session.linesProcessed,
      anomaliesHeardLabel: input.t.inspect.anomaliesHeard,
      beatClockLabel: input.t.inspect.beatClock,
      freeLabel: input.t.inspect.free,
      voicesEmittedLabel: input.t.inspect.voicesEmitted,
      rhythmPulseLabel: input.t.inspect.rhythmPulse,
      activeLabel: input.t.session.active,
      offLabel: input.t.inspect.off,
    },
  });
}
