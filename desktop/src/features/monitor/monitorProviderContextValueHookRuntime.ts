import type { MonitorContextValue } from "./monitorContextTypes";
import type { UseMonitorProviderContextValueInput } from "./useMonitorProviderContextValue";

export function buildMonitorProviderContextHookValue(
  input: UseMonitorProviderContextValueInput,
): Omit<MonitorContextValue, "subscribe"> {
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
    audioContext: input.audioContext,
    resumeAudio: input.resumeAudio,
    activeTemplate: input.activeTemplate,
    setActiveTemplate: input.setActiveTemplate,
  };
}

export function buildMonitorProviderContextHookDeps(
  input: UseMonitorProviderContextValueInput,
  subscribe: MonitorContextValue["subscribe"],
) {
  return [
    input.session,
    input.metrics,
    input.isPlayback,
    input.guideTrackReady,
    input.guideTrackPath,
    input.playbackProgress,
    input.isPlaybackPaused,
    input.playbackEventIndex,
    input.playbackEventCount,
    input.guideTrackDurationSec,
    input.setGuideTrack,
    input.setGuideTrackPlaylist,
    input.seekGuideTrack,
    input.startSession,
    input.attachSession,
    input.stopSession,
    input.playbackSession,
    input.seekPlaybackProgress,
    input.seekPlaybackWindow,
    input.pausePlayback,
    input.resumePlayback,
    input.stepPlaybackWindow,
    subscribe,
    input.audioContext,
    input.resumeAudio,
    input.activeTemplate,
    input.setActiveTemplate,
  ] as const;
}
