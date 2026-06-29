import type { MonitorContextValue } from "./monitorContextTypes";

export function buildMonitorContextValue(input: MonitorContextValue): MonitorContextValue {
  return {
    session: input.session,
    metrics: input.metrics,
    isPlayback: input.isPlayback,
    guideTrackReady: input.guideTrackReady,
    guideTrackPath: input.guideTrackPath,
    playbackProgress: input.playbackProgress,
    isPlaybackPaused: input.isPlaybackPaused,
    playbackEventIndex: input.playbackEventIndex,
    playbackEventCount: input.playbackEventCount,
    guideTrackDurationSec: input.guideTrackDurationSec,
    setGuideTrack: input.setGuideTrack,
    setGuideTrackPlaylist: input.setGuideTrackPlaylist,
    seekGuideTrack: input.seekGuideTrack,
    startSession: input.startSession,
    attachSession: input.attachSession,
    stopSession: input.stopSession,
    playbackSession: input.playbackSession,
    seekPlaybackProgress: input.seekPlaybackProgress,
    seekPlaybackWindow: input.seekPlaybackWindow,
    pausePlayback: input.pausePlayback,
    resumePlayback: input.resumePlayback,
    stepPlaybackWindow: input.stepPlaybackWindow,
    subscribe: input.subscribe,
    audioContext: input.audioContext,
    resumeAudio: input.resumeAudio,
    activeTemplate: input.activeTemplate,
    setActiveTemplate: input.setActiveTemplate,
  };
}
