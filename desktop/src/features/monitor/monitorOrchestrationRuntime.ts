export interface MonitorOrchestrationLogger {
  info: (message: string, ...args: unknown[]) => void;
}

export {
  activateLiveMonitorSessionState,
  bootstrapLiveMonitorSessionState,
  resetLivePollingState,
} from "./monitorLiveSessionOrchestrationRuntime";
export { activatePlaybackMonitorSessionState } from "./monitorPlaybackSessionActivationRuntime";
export {
  replaceExistingMonitorSession,
  resetMonitorSessionState,
} from "./monitorSessionResetRuntime";
