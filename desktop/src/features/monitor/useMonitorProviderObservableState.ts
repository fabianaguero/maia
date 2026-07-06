import { useState } from "react";

import type {
  MonitorProviderObservableState,
  UseMonitorProviderStateInput,
} from "./monitorProviderStateTypes";
import { createEmptyMonitorMetrics } from "./monitorReplayRuntime";

export function useMonitorProviderObservableState(
  input: UseMonitorProviderStateInput,
): MonitorProviderObservableState {
  const [session, setSession] = useState<MonitorProviderObservableState["session"]>(null);
  const [isPlayback, setIsPlayback] = useState(false);
  const [metrics, setMetrics] = useState(createEmptyMonitorMetrics);
  const [guideTrackReady, setGuideTrackReady] = useState(false);
  const [guideTrackPath, setGuideTrackPathState] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number | null>(null);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [playbackEventIndex, setPlaybackEventIndex] = useState<number | null>(null);
  const [playbackEventCount, setPlaybackEventCount] = useState<number | null>(null);
  const [guideTrackDurationSec, setGuideTrackDurationSec] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeTemplate, setActiveTemplateState] = useState(input.initialTemplate);

  return {
    session,
    setSession,
    isPlayback,
    setIsPlayback,
    metrics,
    setMetrics,
    guideTrackReady,
    setGuideTrackReady,
    guideTrackPath,
    setGuideTrackPathState,
    playbackProgress,
    setPlaybackProgress,
    isPlaybackPaused,
    setIsPlaybackPaused,
    playbackEventIndex,
    setPlaybackEventIndex,
    playbackEventCount,
    setPlaybackEventCount,
    guideTrackDurationSec,
    setGuideTrackDurationSec,
    audioContext,
    setAudioContext,
    activeTemplate,
    setActiveTemplateState,
  };
}
