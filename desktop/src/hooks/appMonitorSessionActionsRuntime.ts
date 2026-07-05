import type { CreateSessionInput, PersistedSession } from "../api/sessions";
import {
  resolveMonitoredRepository,
  resolveReplayMonitorDraft,
  type SessionMonitorDraft,
  type resolveSessionPersistenceAction,
} from "../appMonitorActionsRuntime";
import { resolveReplaySourceRepository } from "../appRuntime";
import type { StartSessionInput } from "../types/monitor";
import type {
  AppMonitorLiveActionInput,
  AppMonitorOpenRepoActionInput,
  AppMonitorReplayActionInput,
} from "./appMonitorSessionActionsHookRuntime";
import {
  buildLiveMonitorExecutionPlan,
  buildMonitoredRepoNavigation,
  buildReplayMonitorExecutionPlan,
} from "./appMonitorSessionExecutionRuntime";

export function applyMonitorGuideDraft(
  input: Pick<AppMonitorReplayActionInput, "armSessionMusicalBase" | "primeMonitorGuideTrack">,
  draft: SessionMonitorDraft,
): void {
  input.armSessionMusicalBase(draft);
  input.primeMonitorGuideTrack(draft);
}

export function applyReplayMonitorRepositorySelection(
  input: Pick<AppMonitorReplayActionInput, "setAnalysisMode"> & {
    repositories: Pick<AppMonitorReplayActionInput["repositories"], "setSelectedRepositoryId">;
  },
  repoId: string,
): void {
  input.repositories.setSelectedRepositoryId(repoId);
  input.setAnalysisMode("repo");
}

export function applyReplayMonitorNavigation(
  input: Pick<AppMonitorReplayActionInput, "setAnalysisMode" | "setScreen">,
): void {
  input.setAnalysisMode("repo");
  input.setScreen("inspect");
}

export function applyMonitoredRepoNavigationState(
  input: Pick<AppMonitorOpenRepoActionInput, "setAnalysisMode" | "setScreen" | "setPillar"> & {
    repositories: Pick<AppMonitorOpenRepoActionInput["repositories"], "setSelectedRepositoryId">;
  },
  repoId: string,
  navigation = buildMonitoredRepoNavigation(),
): void {
  input.repositories.setSelectedRepositoryId(repoId);
  input.setAnalysisMode(navigation.analysisMode);
  input.setScreen(navigation.screen);
  input.setPillar(navigation.pillar);
}

export async function persistLiveMonitorSessionSelection(input: {
  persistenceAction: ReturnType<typeof resolveSessionPersistenceAction>;
  sessions: Pick<
    AppMonitorLiveActionInput["sessions"],
    "createSession" | "setSelectedSessionId"
  >;
  persistenceInput: CreateSessionInput;
  persistedSessionId: string;
}): Promise<void> {
  if (input.persistenceAction === "create") {
    await input.sessions.createSession(input.persistenceInput);
    return;
  }

  input.sessions.setSelectedSessionId(input.persistedSessionId);
}

export async function startReplayMonitorSession(
  input: AppMonitorReplayActionInput,
  session: PersistedSession,
  replayWindowIndex?: number,
): Promise<boolean> {
  input.sessions.setSelectedSessionId(session.id);
  const draft = resolveReplayMonitorDraft(session);
  applyMonitorGuideDraft(input, draft);

  const sourceRepository = resolveReplaySourceRepository(session, input.repositories.repositories);

  if (!sourceRepository) {
    input.notify(
      "error",
      input.t.appShell.replayUnavailableTitle,
      input.t.appShell.replayUnavailableBody,
    );
    return false;
  }

  const replayPlan = buildReplayMonitorExecutionPlan({
    session,
    sourceRepositoryId: sourceRepository.id,
    unnamedSessionLabel: input.t.session.unnamedSession,
    currentPersistedSessionId: input.monitor.session?.persistedSessionId,
    isPlayback: input.monitor.isPlayback,
    replayWindowIndex,
  });

  applyReplayMonitorRepositorySelection(input, sourceRepository.id);

  const ok = replayPlan.alreadyActiveReplay
    ? true
    : await input.monitor.playbackSession(replayPlan.playbackInput);

  if (!ok) {
    return false;
  }

  if (replayPlan.shouldSeekWindow && typeof replayPlan.replayWindowIndex === "number") {
    input.monitor.pausePlayback();
    input.monitor.seekPlaybackWindow(replayPlan.replayWindowIndex);
  }

  applyReplayMonitorNavigation(input);
  return true;
}

export async function startLiveMonitorSession(
  input: AppMonitorLiveActionInput,
  startInput: StartSessionInput,
  persistedSessionId: string,
  draft?: SessionMonitorDraft & { sourceId?: string | null },
): Promise<boolean> {
  input.sessions.clearError();
  const livePlan = buildLiveMonitorExecutionPlan({
    startInput,
    persistedSessionId,
    draft,
    repositories: input.repositories.repositories,
    unnamedSessionLabel: input.t.session.unnamedSession,
    existingSessions: input.sessions.sessions,
  });
  applyMonitorGuideDraft(input, livePlan.guideDraft);

  const success = await input.monitor.startSession(
    livePlan.repository,
    startInput,
    persistedSessionId,
  );

  if (!success) {
    return false;
  }

  await persistLiveMonitorSessionSelection({
    persistenceAction: livePlan.persistenceAction,
    sessions: input.sessions,
    persistenceInput: livePlan.persistenceInput,
    persistedSessionId,
  });

  return true;
}

export function openCurrentMonitoredRepo(input: AppMonitorOpenRepoActionInput): void {
  const repo = resolveMonitoredRepository(input.monitor.session, input.repositories.repositories);
  if (!repo) {
    return;
  }

  applyMonitoredRepoNavigationState(input, repo.id);
}
