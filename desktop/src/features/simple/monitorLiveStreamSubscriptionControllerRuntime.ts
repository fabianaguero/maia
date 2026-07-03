import type { LiveLogStreamUpdate } from "../../types/monitor";
import { type applyMonitorLiveStreamSubscriptionResult } from "./monitorLiveStreamSubscriptionApplyRuntime";
import {
  type applyMonitorLiveStreamSubscriptionUpdate,
  type ApplyMonitorLiveStreamSubscriptionUpdateResult,
} from "./monitorLiveStreamSubscriptionRuntime";
import type { UseMonitorLiveStreamSubscriptionInput } from "./monitorLiveStreamSubscriptionTypes";

export interface MonitorLiveStreamSubscriptionListenerDependencies {
  input: UseMonitorLiveStreamSubscriptionInput;
  now: () => number;
  applyUpdate: typeof applyMonitorLiveStreamSubscriptionUpdate;
  applyResult: typeof applyMonitorLiveStreamSubscriptionResult;
}

export function buildMonitorLiveStreamSubscriptionListener(
  dependencies: MonitorLiveStreamSubscriptionListenerDependencies,
): (update: LiveLogStreamUpdate) => void {
  return (update) => {
    const nowMs = dependencies.now();
    const result: ApplyMonitorLiveStreamSubscriptionUpdateResult = dependencies.applyUpdate({
      update,
      currentTrack: dependencies.input.activeTrackRef.current,
      activeAudio: dependencies.input.backgroundAudioRef.current,
      currentAudioContext: dependencies.input.audioContextRef.current,
      fallbackDurationSeconds: dependencies.input.deckDurationSecondsRef.current,
      fallbackProgress: dependencies.input.trackWaveProgressRef.current,
      controls: dependencies.input.deckControlsRef.current,
      maxLiveLines: dependencies.input.maxLiveLines,
      liveSuggestedBpm: dependencies.input.liveSuggestedBpmRef.current,
      selectedAnomalyId: dependencies.input.selectedAnomalyIdRef.current,
      previousLiveLines: dependencies.input.liveLinesRef.current,
      previousWaveformAnomalies: dependencies.input.waveformAnomaliesRef.current,
      previousLogSignalBuffer: dependencies.input.logSignalBufferRef.current,
      hasBackgroundTrack: Boolean(
        dependencies.input.backgroundGraphRef.current ||
        dependencies.input.backgroundAudioRef.current,
      ),
      audioProbePlayed: dependencies.input.audioProbePlayedRef.current,
      lastCueAccentAtMs: dependencies.input.lastCueAccentAtRef.current,
      nowMs,
      ensureBackgroundGraph: dependencies.input.ensureBackgroundGraph,
      applyTrackMutation: dependencies.input.applyTrackMutation,
      playTestTone: dependencies.input.playTestTone,
      playCueBatch: dependencies.input.playCueBatch,
    });

    dependencies.applyResult({
      result,
      nowMs,
      refs: {
        lastStreamEventAtRef: dependencies.input.lastStreamEventAtRef,
        audioProbePlayedRef: dependencies.input.audioProbePlayedRef,
        lastCueAccentAtRef: dependencies.input.lastCueAccentAtRef,
        liveLinesRef: dependencies.input.liveLinesRef,
        waveformAnomaliesRef: dependencies.input.waveformAnomaliesRef,
        selectedAnomalyIdRef: dependencies.input.selectedAnomalyIdRef,
        logSignalBufferRef: dependencies.input.logSignalBufferRef,
      },
      setters: {
        setLiveSuggestedBpm: dependencies.input.setLiveSuggestedBpm,
        setLiveLines: dependencies.input.setLiveLines,
        setWaveformAnomalies: dependencies.input.setWaveformAnomalies,
        setSelectedAnomalyId: dependencies.input.setSelectedAnomalyId,
        setLogSignalBuffer: dependencies.input.setLogSignalBuffer,
      },
    });
  };
}
