import type { CreateSessionInput, PersistedSession } from "../api/sessions";
import {
  resolveMonitoredRepository,
  resolveReplayMonitorDraft,
  resolveSessionPersistenceAction,
  type SessionMonitorDraft,
} from "../appMonitorActionsRuntime";
import { resolveSessionRepository } from "../appContentRuntime";
import { resolveReplaySourceRepository, shouldReuseActiveReplaySession } from "../appRuntime";
import type { AppPillar, AppScreen } from "../types/library";
import type { StartSessionInput } from "../types/monitor";
import type {
  AppMonitorLiveActionInput,
  AppMonitorOpenRepoActionInput,
  AppMonitorReplayActionInput,
} from "./appMonitorSessionActionsHookRuntime";

export function buildReplayPlaybackInput(input: {
  session: PersistedSession;
  repoId?: string | null;
  unnamedSessionLabel: string;
}) {
  return {
    sessionId: input.session.id,
    label: input.session.label || input.unnamedSessionLabel,
    sourcePath: input.session.sourcePath || "",
    repoId: input.repoId,
  };
}

export function buildLiveSessionGuideDraft(
  draft?: SessionMonitorDraft & { sourceId?: string | null },
) {
  return {
    trackId: draft?.trackId,
    playlistId: draft?.playlistId,
  };
}

export function buildLiveSessionPersistenceInput(input: {
  sessionId: string;
  startInput: StartSessionInput;
  draft?: SessionMonitorDraft & { sourceId?: string | null };
}): CreateSessionInput {
  return {
    id: input.sessionId,
    label: input.startInput.label ?? undefined,
    sourceId: input.draft?.sourceId ?? undefined,
    trackId: input.draft?.trackId ?? undefined,
    playlistId: input.draft?.playlistId ?? undefined,
    adapterKind: input.startInput.adapterKind,
    mode: "live",
  };
}

export function buildMonitoredRepoNavigation() {
  return {
    analysisMode: "repo" as const,
    screen: "inspect" as AppScreen,
    pillar: "curate" as AppPillar,
  };
}

export function shouldSeekReplayWindow(replayWindowIndex?: number): replayWindowIndex is number {
  return typeof replayWindowIndex === "number";
}

export function buildReplaySourceRepositoryId(input: {
  sourceRepositoryId?: string | null;
  sessionSourceId?: string | null;
}): string | null {
  return input.sourceRepositoryId ?? input.sessionSourceId ?? null;
}

export async function startReplayMonitorSession(
  input: AppMonitorReplayActionInput,
  session: PersistedSession,
  replayWindowIndex?: number,
): Promise<boolean> {
  input.sessions.setSelectedSessionId(session.id);
  const draft = resolveReplayMonitorDraft(session);
  input.armSessionMusicalBase(draft);
  input.primeMonitorGuideTrack(draft);

  const sourceRepository = resolveReplaySourceRepository(session, input.repositories.repositories);

  if (!sourceRepository) {
    input.notify("error", input.t.appShell.replayUnavailableTitle, input.t.appShell.replayUnavailableBody);
    return false;
  }

  input.repositories.setSelectedRepositoryId(sourceRepository.id);
  input.setAnalysisMode("repo");

  const alreadyActiveReplay = shouldReuseActiveReplaySession({
    currentPersistedSessionId: input.monitor.session?.persistedSessionId,
    isPlayback: input.monitor.isPlayback,
    replaySessionId: session.id,
  });

  const ok = alreadyActiveReplay
    ? true
    : await input.monitor.playbackSession(
        buildReplayPlaybackInput({
          session,
          repoId: buildReplaySourceRepositoryId({
            sourceRepositoryId: sourceRepository.id,
            sessionSourceId: session.sourceId,
          }),
          unnamedSessionLabel: input.t.session.unnamedSession,
        }),
      );

  if (!ok) {
    return false;
  }

  if (shouldSeekReplayWindow(replayWindowIndex)) {
    input.monitor.pausePlayback();
    input.monitor.seekPlaybackWindow(replayWindowIndex);
  }

  input.setAnalysisMode("repo");
  input.setScreen("inspect");
  return true;
}

export async function startLiveMonitorSession(
  input: AppMonitorLiveActionInput,
  startInput: StartSessionInput,
  persistedSessionId: string,
  draft?: SessionMonitorDraft & { sourceId?: string | null },
): Promise<boolean> {
  input.sessions.clearError();
  const guideDraft = buildLiveSessionGuideDraft(draft);
  input.armSessionMusicalBase(guideDraft);
  input.primeMonitorGuideTrack(guideDraft);

  const success = await input.monitor.startSession(
    resolveSessionRepository({
      adapterKind: startInput.adapterKind,
      label: startInput.label ?? input.t.session.unnamedSession,
      nowIso: new Date().toISOString(),
      repositories: input.repositories.repositories,
      sessionId: startInput.sessionId,
      source: startInput.source,
    }),
    startInput,
    persistedSessionId,
  );

  if (!success) {
    return false;
  }

  const persistenceAction = resolveSessionPersistenceAction({
    sessions: input.sessions.sessions,
    persistedSessionId,
  });

  if (persistenceAction === "create") {
    await input.sessions.createSession(
      buildLiveSessionPersistenceInput({
        sessionId: persistedSessionId,
        startInput,
        draft,
      }),
    );
  } else {
    input.sessions.setSelectedSessionId(persistedSessionId);
  }

  return true;
}

export function openCurrentMonitoredRepo(input: AppMonitorOpenRepoActionInput): void {
  const repo = resolveMonitoredRepository(input.monitor.session, input.repositories.repositories);
  if (!repo) {
    return;
  }

  const navigation = buildMonitoredRepoNavigation();
  input.repositories.setSelectedRepositoryId(repo.id);
  input.setAnalysisMode(navigation.analysisMode);
  input.setScreen(navigation.screen);
  input.setPillar(navigation.pillar);
}
