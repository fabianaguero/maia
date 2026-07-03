export interface MonitorProviderRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  trace: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export {
  buildEmitMonitorProviderUpdateStateInput,
  buildRunMonitorProviderPollStateInput,
} from "./monitorProviderUpdateStateRuntime";
export {
  buildDispatchReplayEventAtIndexStateInput,
  buildRunReplayTickStateInput,
  buildSyncGuideTrackCursorStateInput,
  buildSyncReplayTelemetryStateInput,
} from "./monitorProviderReplayStateRuntime";
export { buildResumeMonitorAudioContextStateInput } from "./monitorProviderAudioResumeRuntime";
