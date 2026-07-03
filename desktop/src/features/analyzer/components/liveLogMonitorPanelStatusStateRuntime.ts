import {
  type LiveLogMonitorPanelStatusState,
  type LiveLogMonitorPanelStatusStateInput,
} from "./liveLogMonitorPanelStatusStateTypes";
import { buildLiveLogMonitorWindowMetricGridItems } from "./liveLogMonitorPanelWindowMetricsRuntime";
import { buildLiveLogMonitorCtaMetaLabel } from "./liveLogMonitorPanelCtaRuntime";
import { buildLiveLogMonitorPanelStatusDisplayState } from "./liveLogMonitorPanelStatusDisplayRuntime";
import { buildLiveLogMonitorPanelStatusMetricGridItems } from "./liveLogMonitorPanelStatusMetricGridRuntime";

export type { LiveLogMonitorPanelStatusState, LiveLogMonitorPanelStatusStateInput };

export function buildLiveLogMonitorPanelStatusState(
  input: LiveLogMonitorPanelStatusStateInput,
): LiveLogMonitorPanelStatusState {
  const { bounceAction, cueEngineStateLabel, sessionCardDisplay } =
    buildLiveLogMonitorPanelStatusDisplayState({
      t: input.t,
      bounceWindowCount: input.bounceWindowCount,
      bounceWindowSeconds: input.bounceWindowSeconds,
      sampleStatus: input.sampleStatus,
      sampleSourceCount: input.sampleSourceCount,
      liveEnabled: input.liveEnabled,
      session: input.session,
      replayActive: input.replayActive,
      playbackPercent: input.playbackPercent,
      metrics: input.metrics,
    });
  const metricGridItems = buildLiveLogMonitorPanelStatusMetricGridItems({
    t: input.t,
    replayActive: input.replayActive,
    activeAdapterLabel: input.activeAdapterLabel,
    audioStateLabel: input.audioStateLabel,
    selectedStyleProfileLabel: input.selectedStyleProfileLabel,
    selectedMutationProfileLabel: input.selectedMutationProfileLabel,
    cueEngineStateLabel,
    playbackWindowLabel: input.playbackWindowLabel,
    metrics: input.metrics,
    emittedCueCount: input.emittedCueCount,
    emittedVoiceCount: input.emittedVoiceCount,
    beatClockBpm: input.beatClockBpm,
    beatLooperActive: input.beatLooperActive,
  });
  const windowMetricGridItems = buildLiveLogMonitorWindowMetricGridItems({
    t: input.t,
    lastUpdate: input.lastUpdate,
    repositorySuggestedBpm: input.repositorySuggestedBpm,
    currentLevelCounts: input.currentLevelCounts,
  });
  const ctaMetaLabel = buildLiveLogMonitorCtaMetaLabel({
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    soundsLabel: input.t.library.sounds,
    armedLabel: input.t.session.armed,
    notArmedLabel: input.t.session.notArmed,
    basePlaylistLabel: input.t.inspect.basePlaylist,
    styleLabel: input.selectedStyleProfileLabel,
    mutationLabel: input.selectedMutationProfileLabel,
  });

  return {
    bounceAction,
    cueEngineStateLabel,
    sessionCardDisplay,
    metricGridItems,
    windowMetricGridItems,
    ctaMetaLabel,
  };
}
