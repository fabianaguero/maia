import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
  MonitorLiveStreamControllerState,
} from "./monitorLiveStreamControllerTypes";
import { useMonitorLiveStreamIdleMotion } from "./useMonitorLiveStreamIdleMotion";
import { useMonitorLiveStreamLifecycle } from "./useMonitorLiveStreamLifecycle";
import { useMonitorLiveStreamSubscription } from "./useMonitorLiveStreamSubscription";

export function useMonitorLiveStreamRuntimeEffects(input: {
  state: MonitorLiveStreamControllerState;
  refs: MonitorLiveStreamControllerRefs;
  setters: MonitorLiveStreamControllerSetters;
}) {
  useMonitorLiveStreamLifecycle(
    {
      isListening: input.state.isListening,
      sessionSourcePath: input.state.sessionSourcePath,
      streamAdapterLabel: input.state.streamAdapterLabel,
      liveLinesRef: input.refs.liveLinesRef,
      logSignalBufferRef: input.refs.logSignalBufferRef,
      waveformAnomaliesRef: input.refs.waveformAnomaliesRef,
      selectedAnomalyIdRef: input.refs.selectedAnomalyIdRef,
      lastStreamEventAtRef: input.refs.lastStreamEventAtRef,
      audioProbePlayedRef: input.refs.audioProbePlayedRef,
      setLiveLines: input.setters.setLiveLines,
      setLogSignalBuffer: input.setters.setLogSignalBuffer,
      setLiveSuggestedBpm: input.setters.setLiveSuggestedBpm,
      setWaveformAnomalies: input.setters.setWaveformAnomalies,
      setSelectedAnomalyId: input.setters.setSelectedAnomalyId,
    },
  );

  useMonitorLiveStreamSubscription(
    {
      isListening: input.state.isListening,
      subscribe: input.state.subscribe,
      audioContextRef: input.state.audioContextRef,
      backgroundAudioRef: input.state.backgroundAudioRef,
      backgroundGraphRef: input.state.backgroundGraphRef,
      activeTrackRef: input.state.activeTrackRef,
      deckDurationSecondsRef: input.state.deckDurationSecondsRef,
      trackWaveProgressRef: input.state.trackWaveProgressRef,
      deckControlsRef: input.state.deckControlsRef,
      maxLiveLines: input.state.maxLiveLines,
      liveSuggestedBpmRef: input.refs.liveSuggestedBpmRef,
      liveLinesRef: input.refs.liveLinesRef,
      logSignalBufferRef: input.refs.logSignalBufferRef,
      waveformAnomaliesRef: input.refs.waveformAnomaliesRef,
      selectedAnomalyIdRef: input.refs.selectedAnomalyIdRef,
      audioProbePlayedRef: input.refs.audioProbePlayedRef,
      lastCueAccentAtRef: input.refs.lastCueAccentAtRef,
      lastStreamEventAtRef: input.refs.lastStreamEventAtRef,
      ensureBackgroundGraph: input.state.ensureBackgroundGraph,
      applyTrackMutation: input.state.applyTrackMutation,
      playTestTone: input.state.playTestTone,
      playCueBatch: input.state.playCueBatch,
      setLiveSuggestedBpm: input.setters.setLiveSuggestedBpm,
      setLiveLines: input.setters.setLiveLines,
      setWaveformAnomalies: input.setters.setWaveformAnomalies,
      setSelectedAnomalyId: input.setters.setSelectedAnomalyId,
      setLogSignalBuffer: input.setters.setLogSignalBuffer,
    },
  );

  useMonitorLiveStreamIdleMotion(
    {
      isListening: input.state.isListening,
      idleHoldMs: input.state.idleHoldMs,
      trackBpm: input.state.trackBpm,
      deckControlsRef: input.state.deckControlsRef,
      liveSuggestedBpmRef: input.refs.liveSuggestedBpmRef,
      logSignalBufferRef: input.refs.logSignalBufferRef,
      lastStreamEventAtRef: input.refs.lastStreamEventAtRef,
      setLogSignalBuffer: input.setters.setLogSignalBuffer,
    },
  );
}
