import type { MonitorLaunchSource } from "./types/monitorLaunch";
import {
  buildAppV0LibraryMonitorLaunchPlan,
  buildAppV0MonitorLaunchPlan,
} from "./appV0MonitorLaunchPlanRuntime";
import {
  executeAppV0MonitorLaunchPlan,
  type AppV0MonitorLaunchExecutionDeps,
  type AppV0MonitorLaunchExecutionResult,
} from "./appV0MonitorLaunchExecutionRuntime";
import type {
  LibraryTrack,
  RepositoryAnalysis,
  StartLogSourceConnectionInput,
  StartSessionInput,
  StreamSessionRecord,
} from "./types/library";

export interface AppV0MonitorOrchestrationRuntimeDeps {
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  selectedTrack: LibraryTrack | null;
  createSessionId: () => string;
  setGuideTrack: (path: string) => void;
  resumeAudio: () => Promise<void>;
  startConnection: (input: StartLogSourceConnectionInput) => Promise<StreamSessionRecord>;
  attachSession: AppV0MonitorLaunchExecutionDeps["attachSession"];
  startSession: (repo: RepositoryAnalysis, input: StartSessionInput) => Promise<boolean>;
  playbackSession: (input: {
    sessionId: string;
    sourcePath: string;
    label: string;
  }) => Promise<boolean> | Promise<void>;
  onLaunchSuccess?: () => void;
}

export function buildAppV0MonitorLaunchExecutionDeps(
  deps: AppV0MonitorOrchestrationRuntimeDeps,
): AppV0MonitorLaunchExecutionDeps {
  return {
    setGuideTrack: deps.setGuideTrack,
    resumeAudio: deps.resumeAudio,
    startConnection: deps.startConnection,
    attachSession: deps.attachSession,
    startSession: deps.startSession,
    onLaunchSuccess: deps.onLaunchSuccess,
  };
}

export function replayAppV0MonitorSession(
  deps: Pick<AppV0MonitorOrchestrationRuntimeDeps, "playbackSession">,
  sessionId: string,
  sourcePath: string,
  repoTitle: string,
): Promise<void> {
  return Promise.resolve(
    deps.playbackSession({
      sessionId,
      sourcePath,
      label: repoTitle,
    }),
  ).then(() => undefined);
}

export function startAppV0LibraryMonitoring(
  deps: AppV0MonitorOrchestrationRuntimeDeps,
  repoId: string,
): Promise<AppV0MonitorLaunchExecutionResult> {
  const plan = buildAppV0LibraryMonitorLaunchPlan({
    repoId,
    repositories: deps.repositories,
    tracks: deps.tracks,
    selectedTrack: deps.selectedTrack ?? deps.tracks[0] ?? null,
    sessionId: deps.createSessionId(),
  });

  return executeAppV0MonitorLaunchPlan(plan, buildAppV0MonitorLaunchExecutionDeps(deps));
}

export function startAppV0SourceMonitoring(
  deps: AppV0MonitorOrchestrationRuntimeDeps,
  source: MonitorLaunchSource,
  trackId?: string,
): Promise<AppV0MonitorLaunchExecutionResult> {
  const plan = buildAppV0MonitorLaunchPlan({
    source,
    tracks: deps.tracks,
    repositories: deps.repositories,
    trackId,
    sessionId: deps.createSessionId(),
  });

  return executeAppV0MonitorLaunchPlan(plan, buildAppV0MonitorLaunchExecutionDeps(deps));
}
