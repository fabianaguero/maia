import { Radio } from "lucide-react";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import { resolveReplayBookmarkTagLabel } from "../../config/replayBookmarks";
import { resolveMutationProfile, resolveStyleProfile } from "../../config/liveProfiles";
import { useT } from "../../i18n/I18nContext";
import { formatShortDateTime } from "../../utils/date";
import { formatBpmLabel, formatDominantLevelLabel } from "../../utils/monitorLabels";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { SessionBookmarkContext } from "./SessionSavedSessionsPanel";

interface SessionReplayBookmarkPanelProps {
  selectedSession: PersistedSession;
  selectedSessionBookmarks: SessionBookmark[];
  selectedSessionReplayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  bookmarkContexts: Record<number, SessionBookmarkContext>;
  mutating: boolean;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => void | Promise<void>;
}

export function SessionReplayBookmarkPanel({
  selectedSession,
  selectedSessionBookmarks,
  selectedSessionReplayFeedbackRecommendation,
  bookmarkContexts,
  mutating,
  onReplayBookmark,
}: SessionReplayBookmarkPanelProps) {
  const t = useT();

  return (
    <div className="session-bookmark-panel">
      <div className="panel-header compact">
        <div>
          <h3>{t.session.replayNotes}</h3>
          <p className="support-copy">
            {t.session.replayNotesFor.replace(
              "{label}",
              selectedSession.label || t.session.unnamedSession,
            )}
          </p>
        </div>
      </div>
      {selectedSessionReplayFeedbackRecommendation ? (
        <ReplayFeedbackSummaryCard
          recommendation={selectedSessionReplayFeedbackRecommendation}
          title={t.session.recommendedMix}
          className="top-spaced"
        />
      ) : null}
      {selectedSessionBookmarks.length > 0 ? (
        <div className="session-bookmark-list">
          {selectedSessionBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="session-bookmark-card">
              <div className="session-bookmark-card-copy">
                <div className="session-bookmark-card-head">
                  <strong>{bookmark.label}</strong>
                  <span>
                    {t.session.windowShort.replace(
                      "{index}",
                      String(bookmark.replayWindowIndex),
                    )}
                  </span>
                </div>
                <p>{bookmark.note || t.session.bookmarkNoNote}</p>
                <div className="session-bookmark-card-meta">
                  {bookmark.bookmarkTag ? (
                    <span>{resolveReplayBookmarkTagLabel(bookmark.bookmarkTag)}</span>
                  ) : null}
                  {bookmark.suggestedStyleProfileId ? (
                    <span>{resolveStyleProfile(bookmark.suggestedStyleProfileId).label}</span>
                  ) : null}
                  {bookmark.suggestedMutationProfileId ? (
                    <span>{resolveMutationProfile(bookmark.suggestedMutationProfileId).label}</span>
                  ) : null}
                  <span>{formatShortDateTime(bookmark.updatedAt)}</span>
                  {bookmark.trackTitle ? <span>{bookmark.trackTitle}</span> : null}
                  {typeof bookmark.trackSecond === "number" ? (
                    <span>{bookmark.trackSecond.toFixed(2)}s</span>
                  ) : null}
                </div>
                {bookmarkContexts[bookmark.id] ? (
                  <div className="session-bookmark-card-context">
                    <span className="context-field">
                      {formatBpmLabel(bookmarkContexts[bookmark.id].bpm)}
                    </span>
                    <span className="context-field">
                      {formatDominantLevelLabel(bookmarkContexts[bookmark.id].dominantLevel)}
                    </span>
                    <span className="context-field">
                      {t.session.bookmarkAnomalies.replace(
                        "{count}",
                        String(bookmarkContexts[bookmark.id].anomalyCount ?? 0),
                      )}
                    </span>
                    <span className="context-field context-field--excerpt">
                      {bookmarkContexts[bookmark.id].logExcerpt ?? t.session.noLogExcerptAvailable}
                    </span>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="secondary-action"
                onClick={() => onReplayBookmark(selectedSession, bookmark.replayWindowIndex)}
                disabled={mutating || selectedSession.totalPolls === 0}
              >
                <Radio size={12} />
                {t.session.replayHere}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state session-bookmark-empty">
          <Radio size={24} style={{ opacity: 0.28 }} />
          <p>{t.session.noReplayNotesSavedYet}</p>
        </div>
      )}
    </div>
  );
}
