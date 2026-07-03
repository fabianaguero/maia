import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
  MonitorLiveStreamControllerState,
} from "./monitorLiveStreamControllerTypes";

export function buildMonitorLiveStreamIdleMotionControllerInput(input: {
  state: MonitorLiveStreamControllerState;
  refs: Pick<
    MonitorLiveStreamControllerRefs,
    "liveSuggestedBpmRef" | "logSignalBufferRef" | "lastStreamEventAtRef"
  >;
  setters: Pick<MonitorLiveStreamControllerSetters, "setLogSignalBuffer">;
}) {
  return {
    isListening: input.state.isListening,
    idleHoldMs: input.state.idleHoldMs,
    trackBpm: input.state.trackBpm,
    deckControlsRef: input.state.deckControlsRef,
    liveSuggestedBpmRef: input.refs.liveSuggestedBpmRef,
    logSignalBufferRef: input.refs.logSignalBufferRef,
    lastStreamEventAtRef: input.refs.lastStreamEventAtRef,
    setLogSignalBuffer: input.setters.setLogSignalBuffer,
  };
}
