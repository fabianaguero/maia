import type { CreateSessionInput, PersistedSession } from "../api/sessions";
import {
  resolveSessionPersistenceAction,
  type SessionMonitorDraft,
} from "../appMonitorActionsRuntime";
import { resolveSessionRepository } from "../appContentRuntime";
import { shouldReuseActiveReplaySession } from "../appRuntime";
import type { AppPillar, AppScreen } from "../types/library";
import type { StartSessionInput } from "../types/monitor";
import type { AppMonitorLiveActionInput } from "./appMonitorSessionActionsHookRuntime";

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

export function buildReplayMonitorExecutionPlan(input: {
  session: PersistedSession;
  sourceRepositoryId: string;
  unnamedSessionLabel: string;
  currentPersistedSessionId?: string | null;
  isPlayback: boolean;
  replayWindowIndex?: number;
}) {
  return {
    playbackInput: buildReplayPlaybackInput({
      session: input.session,
      repoId: buildReplaySourceRepositoryId({
        sourceRepositoryId: input.sourceRepositoryId,
        sessionSourceId: input.session.sourceId,
      }),
      unnamedSessionLabel: input.unnamedSessionLabel,
    }),
    alreadyActiveReplay: shouldReuseActiveReplaySession({
      currentPersistedSessionId: input.currentPersistedSessionId,
      isPlayback: input.isPlayback,
      replaySessionId: input.session.id,
    }),
    shouldSeekWindow: shouldSeekReplayWindow(input.replayWindowIndex),
    replayWindowIndex: input.replayWindowIndex,
  };
}

export function buildLiveMonitorExecutionPlan(input: {
  startInput: StartSessionInput;
  persistedSessionId: string;
  draft?: SessionMonitorDraft & { sourceId?: string | null };
  repositories: AppMonitorLiveActionInput["repositories"]["repositories"];
  unnamedSessionLabel: string;
  existingSessions: AppMonitorLiveActionInput["sessions"]["sessions"];
}) {
  return {
    guideDraft: buildLiveSessionGuideDraft(input.draft),
    repository: resolveSessionRepository({
      adapterKind: input.startInput.adapterKind,
      label: input.startInput.label ?? input.unnamedSessionLabel,
      nowIso: new Date().toISOString(),
      repositories: input.repositories,
      sessionId: input.startInput.sessionId,
      source: input.startInput.source,
    }),
    persistenceAction: resolveSessionPersistenceAction({
      sessions: input.existingSessions,
      persistedSessionId: input.persistedSessionId,
    }),
    persistenceInput: buildLiveSessionPersistenceInput({
      sessionId: input.persistedSessionId,
      startInput: input.startInput,
      draft: input.draft,
    }),
  };
}
