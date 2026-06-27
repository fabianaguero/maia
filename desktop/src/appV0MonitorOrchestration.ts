import type { StartLogSourceConnectionInput, StreamSessionRecord } from "./types/library";
import type { LibraryTrack, RepositoryAnalysis, StartSessionInput } from "./types/library";
import type { MonitorLaunchSource } from "./features/simple/monitorSourceOptions";
import {
  buildAppV0LibraryMonitorLaunchPlan,
  buildAppV0MonitorLaunchPlan,
  executeAppV0MonitorLaunchPlan,
  type AppV0MonitorLaunchExecutionResult,
} from "./appV0MonitorRuntime";

export interface AppV0MonitorOrchestrationDeps {
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  selectedTrack: LibraryTrack | null;
  createSessionId: () => string;
  setGuideTrack: (path: string) => void;
  resumeAudio: () => Promise<void>;
  startConnection: (input: StartLogSourceConnectionInput) => Promise<StreamSessionRecord>;
  attachSession: (input: {
    session: StreamSessionRecord;
    repoId: string;
    repoTitle: string;
    trackId?: string;
    trackTitle?: string;
  }) => Promise<boolean>;
  startSession: (repo: RepositoryAnalysis, input: StartSessionInput) => Promise<boolean>;
  playbackSession: (input: {
    sessionId: string;
    sourcePath: string;
    label: string;
  }) => Promise<boolean> | Promise<void>;
  onLaunchSuccess?: () => void;
}

export interface AppV0MonitorOrchestrator {
  startLibraryMonitoring: (repoId: string) => Promise<AppV0MonitorLaunchExecutionResult>;
  startSourceMonitoring: (
    source: MonitorLaunchSource,
    trackId?: string,
  ) => Promise<AppV0MonitorLaunchExecutionResult>;
  replaySession: (sessionId: string, sourcePath: string, repoTitle: string) => Promise<void>;
}

export function createAppV0MonitorOrchestrator(
  deps: AppV0MonitorOrchestrationDeps,
): AppV0MonitorOrchestrator {
  const executionDeps = {
    setGuideTrack: deps.setGuideTrack,
    resumeAudio: deps.resumeAudio,
    startConnection: deps.startConnection,
    attachSession: deps.attachSession,
    startSession: deps.startSession,
    onLaunchSuccess: deps.onLaunchSuccess,
  };

  return {
    startLibraryMonitoring: async (repoId) => {
      const plan = buildAppV0LibraryMonitorLaunchPlan({
        repoId,
        repositories: deps.repositories,
        tracks: deps.tracks,
        selectedTrack: deps.selectedTrack ?? deps.tracks[0] ?? null,
        sessionId: deps.createSessionId(),
      });
      return executeAppV0MonitorLaunchPlan(plan, executionDeps);
    },
    startSourceMonitoring: async (source, trackId) => {
      const plan = buildAppV0MonitorLaunchPlan({
        source,
        tracks: deps.tracks,
        repositories: deps.repositories,
        trackId,
        sessionId: deps.createSessionId(),
      });
      return executeAppV0MonitorLaunchPlan(plan, executionDeps);
    },
    replaySession: async (sessionId, sourcePath, repoTitle) => {
      await deps.playbackSession({
        sessionId,
        sourcePath,
        label: repoTitle,
      });
    },
  };
}
