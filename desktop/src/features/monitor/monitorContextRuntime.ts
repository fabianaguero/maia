import {
  DEFAULT_MONITOR_WAV_VOLUME,
  type CrossfadeHandle,
  type MonitorAudioRuntimeLogger,
} from "./monitorAudioRuntimeTypes";
import {
  quantizeMonitorFrequency,
  renderSynthFallback,
  sliceGuideTrackBar,
} from "./monitorAudioSynthesisRuntime";

export {
  DEFAULT_MONITOR_WAV_VOLUME,
  quantizeMonitorFrequency,
  renderSynthFallback,
  sliceGuideTrackBar,
};
export type { CrossfadeHandle, MonitorAudioRuntimeLogger };
export {
  emitMonitorAudioProbe,
  ensureMonitorAudioContext,
  stopCrossfadeEngine,
} from "./monitorContextAudioEngineRuntime";
export {
  registerActiveAudioElement,
  stopAllMonitorAudio,
  unregisterActiveAudioElement,
} from "./monitorContextAudioRegistryRuntime";
export { createSyntheticReplayEvent } from "./monitorContextReplayEventRuntime";
