import type { CreateSessionInput, PersistedSession } from "../api/sessions";
import type { AppPillar, AppScreen } from "../types/library";
import type { StartSessionInput } from "../types/monitor";
import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";

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
