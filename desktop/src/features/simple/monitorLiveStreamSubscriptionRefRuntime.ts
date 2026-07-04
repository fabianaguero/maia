import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { applyMonitorLiveStreamSubscriptionResult } from "./monitorLiveStreamSubscriptionApplyRuntime";
import type {
  ApplyMonitorLiveStreamSubscriptionUpdateResult,
  applyMonitorLiveStreamSubscriptionUpdate,
} from "./monitorLiveStreamSubscriptionRuntime";
import type { UseMonitorLiveStreamSubscriptionInput } from "./monitorLiveStreamSubscriptionTypes";

export function buildMonitorLiveStreamSubscriptionUpdateInput(input: {
  subscription: UseMonitorLiveStreamSubscriptionInput;
  update: LiveLogStreamUpdate;
  nowMs: number;
}): Parameters<typeof applyMonitorLiveStreamSubscriptionUpdate>[0] {
  return {
    update: input.update,
    currentTrack: input.subscription.activeTrackRef.current,
    activeAudio: input.subscription.backgroundAudioRef.current,
    currentAudioContext: input.subscription.audioContextRef.current,
    fallbackDurationSeconds: input.subscription.deckDurationSecondsRef.current,
    fallbackProgress: input.subscription.trackWaveProgressRef.current,
    controls: input.subscription.deckControlsRef.current,
    maxLiveLines: input.subscription.maxLiveLines,
    liveSuggestedBpm: input.subscription.liveSuggestedBpmRef.current,
    selectedAnomalyId: input.subscription.selectedAnomalyIdRef.current,
    previousLiveLines: input.subscription.liveLinesRef.current,
    previousWaveformAnomalies: input.subscription.waveformAnomaliesRef.current,
    previousLogSignalBuffer: input.subscription.logSignalBufferRef.current,
    hasBackgroundTrack: Boolean(
      input.subscription.backgroundGraphRef.current || input.subscription.backgroundAudioRef.current,
    ),
    audioProbePlayed: input.subscription.audioProbePlayedRef.current,
    lastCueAccentAtMs: input.subscription.lastCueAccentAtRef.current,
    nowMs: input.nowMs,
    ensureBackgroundGraph: input.subscription.ensureBackgroundGraph,
    applyTrackMutation: input.subscription.applyTrackMutation,
    playTestTone: input.subscription.playTestTone,
    playCueBatch: input.subscription.playCueBatch,
  };
}

export function buildMonitorLiveStreamSubscriptionApplyResultInput(input: {
  subscription: UseMonitorLiveStreamSubscriptionInput;
  result: ApplyMonitorLiveStreamSubscriptionUpdateResult;
  nowMs: number;
}): Parameters<typeof applyMonitorLiveStreamSubscriptionResult>[0] {
  return {
    result: input.result,
    nowMs: input.nowMs,
    refs: {
      lastStreamEventAtRef: input.subscription.lastStreamEventAtRef,
      audioProbePlayedRef: input.subscription.audioProbePlayedRef,
      lastCueAccentAtRef: input.subscription.lastCueAccentAtRef,
      liveLinesRef: input.subscription.liveLinesRef,
      waveformAnomaliesRef: input.subscription.waveformAnomaliesRef,
      selectedAnomalyIdRef: input.subscription.selectedAnomalyIdRef,
      logSignalBufferRef: input.subscription.logSignalBufferRef,
    },
    setters: {
      setLiveSuggestedBpm: input.subscription.setLiveSuggestedBpm,
      setLiveLines: input.subscription.setLiveLines,
      setWaveformAnomalies: input.subscription.setWaveformAnomalies,
      setSelectedAnomalyId: input.subscription.setSelectedAnomalyId,
      setLogSignalBuffer: input.subscription.setLogSignalBuffer,
    },
  };
}
