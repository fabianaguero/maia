import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
  MonitorLiveStreamControllerState,
} from "./monitorLiveStreamControllerTypes";

export function buildMonitorLiveStreamSubscriptionControllerInput(input: {
  state: MonitorLiveStreamControllerState;
  refs: MonitorLiveStreamControllerRefs;
  setters: Pick<
    MonitorLiveStreamControllerSetters,
    | "setLiveSuggestedBpm"
    | "setLiveLines"
    | "setWaveformAnomalies"
    | "setSelectedAnomalyId"
    | "setLogSignalBuffer"
  >;
}) {
  return {
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
  };
}
