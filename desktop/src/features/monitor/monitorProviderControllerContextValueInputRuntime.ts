import type { MonitorContextValue } from "./monitorContextTypes";
import type { MonitorProviderStateViewModel } from "./monitorProviderControllerStateTypes";
import type { UseMonitorProviderContextValueInput } from "./useMonitorProviderContextValue";

export function buildMonitorProviderContextStateValue(input: {
  state: MonitorProviderStateViewModel;
  logger: UseMonitorProviderContextValueInput["logger"];
}) {
  return {
    session: input.state.session,
    metrics: input.state.metrics,
    isPlayback: input.state.isPlayback,
    guideTrackReady: input.state.guideTrackReady,
    guideTrackPath: input.state.guideTrackPath,
    playbackProgress: input.state.playbackProgress,
    isPlaybackPaused: input.state.isPlaybackPaused,
    playbackEventIndex: input.state.playbackEventIndex,
    playbackEventCount: input.state.playbackEventCount,
    guideTrackDurationSec: input.state.guideTrackDurationSec,
    audioContext: input.state.audioContext,
    activeTemplate: input.state.activeTemplate,
    listenersRef: input.state.listenersRef,
    logger: input.logger,
  };
}

export function buildMonitorProviderContextActionValue(input: {
  guideTrack: {
    setActiveTemplate: MonitorContextValue["setActiveTemplate"];
    seekGuideTrack: MonitorContextValue["seekGuideTrack"];
    setGuideTrack: MonitorContextValue["setGuideTrack"];
    setGuideTrackPlaylist: MonitorContextValue["setGuideTrackPlaylist"];
  };
  sessionActions: Pick<
    MonitorContextValue,
    "startSession" | "attachSession" | "stopSession" | "playbackSession"
  >;
  playbackControls: Pick<
    MonitorContextValue,
    | "seekPlaybackProgress"
    | "seekPlaybackWindow"
    | "pausePlayback"
    | "resumePlayback"
    | "stepPlaybackWindow"
  >;
  orchestration: Pick<MonitorContextValue, "resumeAudio">;
}) {
  return {
    setGuideTrack: input.guideTrack.setGuideTrack,
    setGuideTrackPlaylist: input.guideTrack.setGuideTrackPlaylist,
    seekGuideTrack: input.guideTrack.seekGuideTrack,
    startSession: input.sessionActions.startSession,
    attachSession: input.sessionActions.attachSession,
    stopSession: input.sessionActions.stopSession,
    playbackSession: input.sessionActions.playbackSession,
    seekPlaybackProgress: input.playbackControls.seekPlaybackProgress,
    seekPlaybackWindow: input.playbackControls.seekPlaybackWindow,
    pausePlayback: input.playbackControls.pausePlayback,
    resumePlayback: input.playbackControls.resumePlayback,
    stepPlaybackWindow: input.playbackControls.stepPlaybackWindow,
    resumeAudio: input.orchestration.resumeAudio,
    setActiveTemplate: input.guideTrack.setActiveTemplate,
  };
}
