import type { MonitorLiveStreamControllerState } from "./monitorLiveStreamControllerRuntime";
import type { UseMonitorLiveStreamOptions } from "./monitorLiveStreamHookTypes";

export function buildMonitorLiveStreamControllerState(
  input: UseMonitorLiveStreamOptions,
): MonitorLiveStreamControllerState {
  return {
    isListening: input.isListening,
    sessionSourcePath: input.sessionSourcePath,
    streamAdapterLabel: input.streamAdapterLabel,
    subscribe: input.subscribe,
    audioContextRef: input.audioContextRef,
    backgroundAudioRef: input.backgroundAudioRef,
    backgroundGraphRef: input.backgroundGraphRef,
    activeTrackRef: input.activeTrackRef,
    deckDurationSecondsRef: input.deckDurationSecondsRef,
    trackWaveProgressRef: input.trackWaveProgressRef,
    deckControlsRef: input.deckControlsRef,
    trackBpm: input.trackBpm,
    ensureBackgroundGraph: input.ensureBackgroundGraph,
    applyTrackMutation: input.applyTrackMutation,
    playTestTone: input.playTestTone,
    playCueBatch: input.playCueBatch,
    idleHoldMs: input.idleHoldMs,
    maxLiveLines: input.maxLiveLines,
  };
}
