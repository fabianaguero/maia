import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
  MonitorLiveStreamControllerState,
} from "./monitorLiveStreamControllerTypes";

export function buildMonitorLiveStreamLifecycleControllerInput(input: {
  state: MonitorLiveStreamControllerState;
  refs: Pick<
    MonitorLiveStreamControllerRefs,
    | "liveLinesRef"
    | "logSignalBufferRef"
    | "waveformAnomaliesRef"
    | "selectedAnomalyIdRef"
    | "lastStreamEventAtRef"
    | "audioProbePlayedRef"
  >;
  setters: Pick<
    MonitorLiveStreamControllerSetters,
    | "setLiveLines"
    | "setLogSignalBuffer"
    | "setLiveSuggestedBpm"
    | "setWaveformAnomalies"
    | "setSelectedAnomalyId"
  >;
}) {
  return {
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
  };
}
