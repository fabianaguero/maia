import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";

export interface SessionReplayBookmarkPanelProps {
  selectedSession: PersistedSession;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  mutating: boolean;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}
