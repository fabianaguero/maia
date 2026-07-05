import type { PersistedSession, SessionBookmark } from "../../api/sessions";

export interface SessionSavedSessionsListProps {
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  emptyLabel: string;
  loadingLabel: string;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}
