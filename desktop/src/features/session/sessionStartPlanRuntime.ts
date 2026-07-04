import type { PersistedSession } from "../../api/sessions";
import type { RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import {
  createDirectSessionStartPlan as createDirectSessionStartPlanRuntime,
  createResumeSessionPlan as createResumeSessionPlanRuntime,
  createSessionStartPlan as createSessionStartPlanRuntime,
  type SessionStartPlanResult,
} from "./sessionStartPlanCreationRuntime";
import type { SessionScreenCopy } from "./sessionStartPlanTypes";

export function createSessionStartPlan(
  input: {
    baseMode: SessionBaseMode;
    mode: QuickSessionMode;
    repositories: RepositoryAnalysis[];
    selectedPlaylistId: string | null;
    selectedSourceId: string | null;
    selectedTrackId: string | null;
    sessionLabel: string;
  },
  copy: SessionScreenCopy,
  createSessionId: () => string,
): SessionStartPlanResult {
  return createSessionStartPlanRuntime({
    ...input,
    copy,
    createSessionId,
  });
}

export function createDirectSessionStartPlan(
  input: {
    directPath: string;
    selectedPlaylistId: string | null;
    selectedTrackId: string | null;
  },
  copy: SessionScreenCopy,
  createSessionId: () => string,
): SessionStartPlanResult {
  return createDirectSessionStartPlanRuntime({
    ...input,
    copy,
    createSessionId,
  });
}

export function createResumeSessionPlan(
  sessionId: string,
  sessions: PersistedSession[],
  repositories: RepositoryAnalysis[],
  copy: SessionScreenCopy,
): SessionStartPlanResult {
  return createResumeSessionPlanRuntime({
    sessionId,
    sessions,
    repositories,
    copy,
  });
}

export {
  buildSessionLabelPlaceholder,
  createSessionTimestampId,
  resolvePlaybackPercent,
  resolveReadyToRun,
} from "./sessionStartPlanDisplayRuntime";
export {
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
} from "./sessionReplayRuntime";
export type { SessionScreenCopy, SessionStartDraft } from "./sessionStartPlanTypes";
