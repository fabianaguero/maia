import { useEffect } from "react";

import { applyMonitorLiveStreamSubscriptionResult } from "./monitorLiveStreamSubscriptionApplyRuntime";
import { buildMonitorLiveStreamSubscriptionListener } from "./monitorLiveStreamSubscriptionControllerRuntime";
import { applyMonitorLiveStreamSubscriptionUpdate } from "./monitorLiveStreamSubscriptionRuntime";
import type { UseMonitorLiveStreamSubscriptionInput } from "./monitorLiveStreamSubscriptionTypes";

export function useMonitorLiveStreamSubscription({
  isListening,
  subscribe,
  audioContextRef,
  backgroundAudioRef,
  backgroundGraphRef,
  activeTrackRef,
  deckDurationSecondsRef,
  trackWaveProgressRef,
  deckControlsRef,
  maxLiveLines,
  liveSuggestedBpmRef,
  liveLinesRef,
  logSignalBufferRef,
  waveformAnomaliesRef,
  selectedAnomalyIdRef,
  audioProbePlayedRef,
  lastCueAccentAtRef,
  lastStreamEventAtRef,
  ensureBackgroundGraph,
  applyTrackMutation,
  playTestTone,
  playCueBatch,
  setLiveSuggestedBpm,
  setLiveLines,
  setWaveformAnomalies,
  setSelectedAnomalyId,
  setLogSignalBuffer,
}: UseMonitorLiveStreamSubscriptionInput): void {
  useEffect(() => {
    if (!isListening) {
      return;
    }

    const listener = buildMonitorLiveStreamSubscriptionListener({
      input: {
        isListening,
        subscribe,
        audioContextRef,
        backgroundAudioRef,
        backgroundGraphRef,
        activeTrackRef,
        deckDurationSecondsRef,
        trackWaveProgressRef,
        deckControlsRef,
        maxLiveLines,
        liveSuggestedBpmRef,
        liveLinesRef,
        logSignalBufferRef,
        waveformAnomaliesRef,
        selectedAnomalyIdRef,
        audioProbePlayedRef,
        lastCueAccentAtRef,
        lastStreamEventAtRef,
        ensureBackgroundGraph,
        applyTrackMutation,
        playTestTone,
        playCueBatch,
        setLiveSuggestedBpm,
        setLiveLines,
        setWaveformAnomalies,
        setSelectedAnomalyId,
        setLogSignalBuffer,
      },
      now: () => Date.now(),
      applyUpdate: applyMonitorLiveStreamSubscriptionUpdate,
      applyResult: applyMonitorLiveStreamSubscriptionResult,
    });

    const unsub = subscribe(listener);

    return unsub;
  }, [
    activeTrackRef,
    applyTrackMutation,
    audioContextRef,
    audioProbePlayedRef,
    backgroundAudioRef,
    backgroundGraphRef,
    deckControlsRef,
    deckDurationSecondsRef,
    ensureBackgroundGraph,
    isListening,
    lastCueAccentAtRef,
    lastStreamEventAtRef,
    liveLinesRef,
    liveSuggestedBpmRef,
    logSignalBufferRef,
    maxLiveLines,
    playCueBatch,
    playTestTone,
    selectedAnomalyIdRef,
    setLiveLines,
    setLiveSuggestedBpm,
    setLogSignalBuffer,
    setSelectedAnomalyId,
    setWaveformAnomalies,
    subscribe,
    trackWaveProgressRef,
    waveformAnomaliesRef,
  ]);
}
