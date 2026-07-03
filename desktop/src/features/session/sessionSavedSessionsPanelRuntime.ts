import type { PersistedSession, SessionBookmark } from "../../api/sessions";

export interface SessionSavedSessionListItem {
  session: PersistedSession;
  selected: boolean;
  active: boolean;
  playbackActive: boolean;
  bookmarks: SessionBookmark[];
}

export function buildSessionSavedSessionListItems(input: {
  sessions: PersistedSession[];
  selectedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
}): SessionSavedSessionListItem[] {
  return input.sessions.map((session) => {
    const active = session.id === input.activeSessionId;

    return {
      session,
      selected: input.selectedSessionId === session.id,
      active,
      playbackActive: active && input.activeSessionMode === "playback",
      bookmarks: input.sessionBookmarksBySessionId[session.id] ?? [],
    };
  });
}
