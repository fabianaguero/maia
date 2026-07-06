import { buildSessionSavedSessionListItems } from "./sessionSavedSessionsPanelRuntime";
import type { SessionSavedSessionsListProps } from "./sessionSavedSessionsListTypes";

export type SessionSavedSessionsListState = "loading" | "empty" | "ready";

export function resolveSessionSavedSessionsListState(input: {
  loading: boolean;
  sessionCount: number;
}): SessionSavedSessionsListState {
  if (input.loading) {
    return "loading";
  }

  if (input.sessionCount === 0) {
    return "empty";
  }

  return "ready";
}

export function buildSessionSavedSessionsListCardProps(
  input: Pick<
    SessionSavedSessionsListProps,
    | "sessions"
    | "mutating"
    | "selectedSessionId"
    | "activeSessionId"
    | "activeSessionMode"
    | "sessionBookmarksBySessionId"
    | "liveWindowCount"
    | "liveProcessedLines"
    | "liveTotalAnomalies"
    | "onSelectSession"
    | "onResumeSession"
    | "onPlaybackSession"
    | "onDeleteSession"
  >,
) {
  const items = buildSessionSavedSessionListItems({
    sessions: input.sessions,
    selectedSessionId: input.selectedSessionId,
    activeSessionId: input.activeSessionId,
    activeSessionMode: input.activeSessionMode,
    sessionBookmarksBySessionId: input.sessionBookmarksBySessionId,
  });

  return items.map((item) => ({
    key: item.session.id,
    session: item.session,
    selected: item.selected,
    active: item.active,
    playbackActive: item.playbackActive,
    mutating: input.mutating,
    bookmarks: item.bookmarks,
    liveWindowCount: input.liveWindowCount,
    liveProcessedLines: input.liveProcessedLines,
    liveTotalAnomalies: input.liveTotalAnomalies,
    onSelectSession: input.onSelectSession,
    onResumeSession: input.onResumeSession,
    onPlaybackSession: input.onPlaybackSession,
    onDeleteSession: input.onDeleteSession,
  }));
}
