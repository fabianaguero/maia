import { useCallback, useMemo, type MutableRefObject } from "react";

import { subscribeToMonitorStreamState } from "./monitorUpdateRuntime";
import { buildMonitorContextValue } from "./monitorContextValue";
import type { MonitorContextValue, StreamListener } from "./monitorContextTypes";

interface MonitorProviderContextLogger {
  info: (message: string, ...args: unknown[]) => void;
}

interface UseMonitorProviderContextValueInput extends Omit<MonitorContextValue, "subscribe"> {
  listenersRef: MutableRefObject<Set<StreamListener>>;
  logger: MonitorProviderContextLogger;
}

export function useMonitorProviderContextValue(
  input: UseMonitorProviderContextValueInput,
): MonitorContextValue {
  const subscribe = useCallback(
    (listener: StreamListener): (() => void) => {
      return subscribeToMonitorStreamState({
        listeners: input.listenersRef.current,
        listener,
        logger: input.logger,
      });
    },
    [input.listenersRef, input.logger],
  );

  return useMemo(
    () =>
      buildMonitorContextValue({
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
        subscribe,
        audioContext: input.audioContext,
        resumeAudio: input.resumeAudio,
        activeTemplate: input.activeTemplate,
        setActiveTemplate: input.setActiveTemplate,
      }),
    [
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
    ],
  );
}
