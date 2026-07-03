import type { PersistedSession } from "../../api/sessions";
import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { SessionBaseMode } from "./sessionDisplay";
import type { SessionScreenCopy, SessionStartDraft } from "./sessionStartPlanTypes";

export function buildSessionStartDraft(input: {
  baseMode: SessionBaseMode;
  sourceId?: string;
  selectedTrackId: string | null;
  selectedPlaylistId: string | null;
}): SessionStartDraft {
  return {
    sourceId: input.sourceId,
    trackId: input.baseMode === "track" ? (input.selectedTrackId ?? undefined) : undefined,
    playlistId: input.baseMode === "playlist" ? (input.selectedPlaylistId ?? undefined) : undefined,
  };
}

export function buildLiveSessionStartInput(input: {
  sessionId: string;
  source: RepositoryAnalysis;
  sessionLabel: string;
}): StartSessionInput {
  return {
    sessionId: input.sessionId,
    adapterKind: "file",
    source: input.source.sourcePath,
    label: input.sessionLabel || input.source.title,
    startFromBeginning: true,
  };
}

export function buildDirectSessionStartInput(input: {
  sessionId: string;
  source: string;
  copy: SessionScreenCopy;
}): StartSessionInput {
  return {
    sessionId: input.sessionId,
    adapterKind: "file",
    source: input.source,
    label: input.source.split("/").pop() || input.copy.session.directFeed,
    startFromBeginning: true,
  };
}

export function buildResumeSessionStartInput(input: {
  session: PersistedSession;
  source: RepositoryAnalysis | null;
  sourcePath: string;
  copy: SessionScreenCopy;
}): StartSessionInput {
  return {
    sessionId: input.session.id,
    adapterKind: "file",
    source: input.sourcePath,
    label:
      input.session.label ||
      input.source?.title ||
      input.session.sourceTitle ||
      input.copy.session.resumedSession,
  };
}
