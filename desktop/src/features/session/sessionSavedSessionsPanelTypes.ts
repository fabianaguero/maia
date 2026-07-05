import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";

export interface SessionSavedSessionsPanelProps {
  sessions: PersistedSession[];
  loading: boolean;
  mutating: boolean;
  selectedSessionId: string | null;
  selectedSession: PersistedSession | null;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  activeSessionId: string | null;
  activeSessionMode: "live" | "playback" | null;
  liveWindowCount: number;
  liveProcessedLines: number;
  liveTotalAnomalies: number;
  onSelectSession: (sessionId: string) => void;
  onResumeSession: (sessionId: string) => void | Promise<void>;
  onPlaybackSession: (session: PersistedSession) => void | Promise<void>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
  onDeleteSession: (sessionId: string) => void | Promise<void>;
}
