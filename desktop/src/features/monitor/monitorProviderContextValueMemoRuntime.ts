import { buildMonitorContextValue } from "./monitorContextValue";
import type { MonitorContextValue } from "./monitorContextTypes";
import type { UseMonitorProviderContextValueInput } from "./useMonitorProviderContextValue";

export function buildMonitorProviderMemoContextValue(input: {
  value: Omit<UseMonitorProviderContextValueInput, "listenersRef" | "logger">;
  subscribe: MonitorContextValue["subscribe"];
}): MonitorContextValue {
  return buildMonitorContextValue({
    session: input.value.session,
    metrics: input.value.metrics,
    isPlayback: input.value.isPlayback,
    guideTrackReady: input.value.guideTrackReady,
    guideTrackPath: input.value.guideTrackPath,
    playbackProgress: input.value.playbackProgress,
    isPlaybackPaused: input.value.isPlaybackPaused,
    playbackEventIndex: input.value.playbackEventIndex,
    playbackEventCount: input.value.playbackEventCount,
    guideTrackDurationSec: input.value.guideTrackDurationSec,
    setGuideTrack: input.value.setGuideTrack,
    setGuideTrackPlaylist: input.value.setGuideTrackPlaylist,
    seekGuideTrack: input.value.seekGuideTrack,
    startSession: input.value.startSession,
    attachSession: input.value.attachSession,
    stopSession: input.value.stopSession,
    playbackSession: input.value.playbackSession,
    seekPlaybackProgress: input.value.seekPlaybackProgress,
    seekPlaybackWindow: input.value.seekPlaybackWindow,
    pausePlayback: input.value.pausePlayback,
    resumePlayback: input.value.resumePlayback,
    stepPlaybackWindow: input.value.stepPlaybackWindow,
    subscribe: input.subscribe,
    audioContext: input.value.audioContext,
    resumeAudio: input.value.resumeAudio,
    activeTemplate: input.value.activeTemplate,
    setActiveTemplate: input.value.setActiveTemplate,
  });
}
