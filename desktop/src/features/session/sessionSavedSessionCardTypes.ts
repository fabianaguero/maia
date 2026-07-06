import type { PersistedSession, SessionBookmark } from "../../api/sessions";

export interface SessionSavedSessionCardProps {
  session: PersistedSession;
  selected: boolean;
  active: boolean;
  playbackActive: boolean;
  mutating: boolean;
  bookmarks: SessionBookmark[];
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}
