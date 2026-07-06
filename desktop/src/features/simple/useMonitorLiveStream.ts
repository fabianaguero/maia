import type { UseMonitorLiveStreamOptions } from "./monitorLiveStreamHookTypes";
import { buildMonitorLiveStreamHookState } from "./monitorLiveStreamRuntime";
import { useMonitorLiveStreamSlices } from "./useMonitorLiveStreamSlices";

export function useMonitorLiveStream({
  isListening,
  sessionSourcePath,
  streamAdapterLabel,
  subscribe,
  audioContextRef,
  backgroundAudioRef,
  backgroundGraphRef,
  activeTrackRef,
  deckDurationSecondsRef,
  trackWaveProgressRef,
  deckControlsRef,
  trackBpm,
  ensureBackgroundGraph,
  applyTrackMutation,
  playTestTone,
  playCueBatch,
  idleHoldMs,
  maxLiveLines,
}: UseMonitorLiveStreamOptions) {
  const { stateController } = useMonitorLiveStreamSlices({
    isListening,
    sessionSourcePath,
    streamAdapterLabel,
    subscribe,
    audioContextRef,
    backgroundAudioRef,
    backgroundGraphRef,
    activeTrackRef,
    deckDurationSecondsRef,
    trackWaveProgressRef,
    deckControlsRef,
    trackBpm,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
    idleHoldMs,
    maxLiveLines,
  });

  return buildMonitorLiveStreamHookState({
    liveLines: stateController.liveLines,
    logSignalBuffer: stateController.logSignalBuffer,
    liveSuggestedBpm: stateController.liveSuggestedBpm,
    waveformAnomalies: stateController.waveformAnomalies,
    selectedAnomalyId: stateController.selectedAnomalyId,
    setSelectedAnomalyId: stateController.setSelectedAnomalyId,
    simulateLog: stateController.simulateLog,
  });
}
