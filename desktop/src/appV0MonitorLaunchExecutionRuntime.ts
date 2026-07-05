import type { StartLogSourceConnectionInput, StartSessionInput, StreamSessionRecord } from "./types/monitor";
import type { RepositoryAnalysis } from "./types/library";
import {
  buildAppV0ConnectionAttachInput,
  type AppV0MonitorLaunchPlan,
} from "./appV0MonitorLaunchPlanRuntime";

export interface AppV0MonitorLaunchExecutionDeps {
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
  onLaunchSuccess?: () => void;
}

export type AppV0MonitorLaunchExecutionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "missing-track" | "missing-repository" | "attach-failed" | "start-failed";
    };

export async function executeAppV0ConnectionLaunchPlan(
  plan: Extract<AppV0MonitorLaunchPlan, { kind: "connection" }>,
  deps: AppV0MonitorLaunchExecutionDeps,
): Promise<AppV0MonitorLaunchExecutionResult> {
  const streamSession = await deps.startConnection({
    connectionId: plan.connectionId,
    sessionId: plan.sessionId,
    startFromBeginning: false,
  });
  const success = await deps.attachSession(
    buildAppV0ConnectionAttachInput({
      session: streamSession,
      repoId: plan.repoId,
      repoTitle: plan.repoTitle,
      track: plan.track,
      trackTitle: plan.trackTitle,
    }),
  );
  if (!success) {
    return {
      ok: false,
      reason: "attach-failed",
    };
  }
  deps.onLaunchSuccess?.();
  return { ok: true };
}

export async function executeAppV0RepositoryLaunchPlan(
  plan: Extract<AppV0MonitorLaunchPlan, { kind: "repository" }>,
  deps: AppV0MonitorLaunchExecutionDeps,
): Promise<AppV0MonitorLaunchExecutionResult> {
  const success = await deps.startSession(plan.repo, plan.startInput);
  if (!success) {
    return {
      ok: false,
      reason: "start-failed",
    };
  }

  deps.onLaunchSuccess?.();
  return { ok: true };
}

export async function executeAppV0MonitorLaunchPlan(
  plan: AppV0MonitorLaunchPlan,
  deps: AppV0MonitorLaunchExecutionDeps,
): Promise<AppV0MonitorLaunchExecutionResult> {
  if (plan.kind === "invalid") {
    return {
      ok: false,
      reason: plan.reason,
    };
  }

  if (plan.guideTrackPath) {
    deps.setGuideTrack(plan.guideTrackPath);
  }

  await deps.resumeAudio();

  if (plan.kind === "connection") {
    return executeAppV0ConnectionLaunchPlan(plan, deps);
  }

  return executeAppV0RepositoryLaunchPlan(plan, deps);
}
