import { buildLiveMonitorDisplayState } from "./liveLogMonitorDisplayRuntime";
import {
  buildLiveLogMonitorPanelPlaylistState,
  buildLiveLogMonitorPanelStatusState,
  type LiveLogMonitorPanelPlaylistState,
  type LiveLogMonitorPanelStatusState,
} from "./liveLogMonitorPanelViewModelRuntime";
import type {
  LiveLogMonitorPanelViewModel,
  LiveLogMonitorPanelViewModelInput,
} from "./liveLogMonitorPanelViewModelTypes";

export function buildLiveLogMonitorPanelViewModel(
  input: LiveLogMonitorPanelViewModelInput,
): LiveLogMonitorPanelViewModel {
  const displayState = buildLiveMonitorDisplayState({
    lastUpdate: input.lastUpdate,
    recentMarkers: input.recentMarkers,
    syncTailRows: input.syncTailRows,
    maxSyncTailLines: input.maxSyncTailLines,
    maxAnomalySourceLines: input.maxAnomalySourceLines,
    replayActive: input.replayActive,
    liveEnabled: input.liveEnabled,
    repositorySourcePath: input.repositorySourcePath,
    audioStatus: input.audioStatus,
    labels: {
      replayLabel: input.t.session.replay,
      liveLabel: input.t.appShell.live,
      stoppedLabel: input.t.session.stopped,
      audioUnavailable: input.t.inspect.audioStateUnavailable,
      audioError: input.t.inspect.audioStateError,
      audioActive: input.t.inspect.audioStateActive,
      audioArmed: input.t.inspect.audioStateArmed,
      audioIdle: input.t.inspect.audioStateIdle,
      audioOn: input.t.inspect.audioOn,
      audioBlocked: input.t.inspect.audioBlocked,
    },
  });

  const statusState: LiveLogMonitorPanelStatusState = buildLiveLogMonitorPanelStatusState({
    t: input.t,
    replayActive: input.replayActive,
    liveEnabled: input.liveEnabled,
    audioStatus: input.audioStatus,
    bounceWindowCount: input.bounceWindowCount,
    bounceWindowSeconds: input.bounceWindowSeconds,
    sampleStatus: input.sampleStatus,
    sampleSourceCount: input.sampleSourceCount,
    activeAdapterLabel: input.activeAdapterLabel,
    selectedStyleProfileLabel: input.selectedStyleProfileLabel,
    selectedMutationProfileLabel: input.selectedMutationProfileLabel,
    playbackWindowLabel: input.playbackWindowLabel,
    metrics: input.metrics,
    emittedCueCount: input.emittedCueCount,
    emittedVoiceCount: input.emittedVoiceCount,
    beatClockBpm: input.beatClockBpm,
    beatLooperActive: input.beatLooperActive,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    repositorySuggestedBpm: input.repositorySuggestedBpm,
    session: input.session,
    playbackPercent: input.playbackPercent,
    currentLevelCounts: displayState.currentLevelCounts,
    lastUpdate: input.lastUpdate,
    audioStateLabel: displayState.audioStateLabel,
  });
  const playlistState: LiveLogMonitorPanelPlaylistState = buildLiveLogMonitorPanelPlaylistState({
    availableTracks: input.availableTracks,
    availableBaseTrackOptions: input.availableBaseTrackOptions,
    availablePlaylists: input.availablePlaylists,
    basePlaylist: input.basePlaylist,
    backgroundNowPlayingTrack: input.backgroundNowPlayingTrack,
    backgroundTransitionNextTrack: input.backgroundTransitionNextTrack,
    backgroundTransitionPlan: input.backgroundTransitionPlan,
    liveEnabled: input.liveEnabled,
    nowPlayingLabel: input.t.appShell.nowPlaying,
    upNextLabel: input.t.appShell.upNext,
    lostLabel: input.t.library.lost.toUpperCase(),
  });

  return {
    ...displayState,
    ...statusState,
    ...playlistState,
  };
}
