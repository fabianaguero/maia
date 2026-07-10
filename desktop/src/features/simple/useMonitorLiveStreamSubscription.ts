import { useEffect, useRef } from "react";

import type { LiveLogStreamUpdate } from "../../types/monitor";
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
  const listenerRef = useRef<(update: LiveLogStreamUpdate) => void>(() => undefined);

  listenerRef.current = buildMonitorLiveStreamSubscriptionListener({
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

  useEffect(() => {
    if (!isListening) {
      return;
    }

    const unsub = subscribe((update) => {
      listenerRef.current(update);
    });

    return unsub;
  }, [isListening, subscribe]);
}
