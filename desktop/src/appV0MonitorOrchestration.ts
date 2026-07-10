import type { MonitorLaunchSource } from "./types/monitorLaunch";
import type { AppV0MonitorLaunchExecutionResult } from "./appV0MonitorRuntime";
import {
  replayAppV0MonitorSession,
  startAppV0LibraryMonitoring,
  startAppV0SourceMonitoring,
  type AppV0MonitorOrchestrationRuntimeDeps,
} from "./appV0MonitorOrchestrationRuntime";

export type AppV0MonitorOrchestrationDeps = AppV0MonitorOrchestrationRuntimeDeps;

export interface AppV0MonitorOrchestrator {
  startLibraryMonitoring: (repoId: string) => Promise<AppV0MonitorLaunchExecutionResult>;
  startSourceMonitoring: (
    source: MonitorLaunchSource,
    trackId?: string,
  ) => Promise<AppV0MonitorLaunchExecutionResult>;
  replaySession: (
    sessionId: string,
    sourcePath: string,
    repoTitle: string,
    trackId?: string | null,
  ) => Promise<void>;
}

export function createAppV0MonitorOrchestrator(
  deps: AppV0MonitorOrchestrationDeps,
): AppV0MonitorOrchestrator {
  return {
    startLibraryMonitoring: async (repoId) => startAppV0LibraryMonitoring(deps, repoId),
    startSourceMonitoring: async (source, trackId) =>
      startAppV0SourceMonitoring(deps, source, trackId),
    replaySession: async (sessionId, sourcePath, repoTitle, trackId) =>
      replayAppV0MonitorSession(deps, sessionId, sourcePath, repoTitle, trackId),
  };
}
