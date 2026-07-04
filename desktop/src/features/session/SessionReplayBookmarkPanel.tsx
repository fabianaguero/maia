import { Radio } from "lucide-react";
import type { PersistedSession, SessionBookmark } from "../../api/sessions";
import { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import { useT } from "../../i18n/I18nContext";
import type { ReplayFeedbackRecommendation } from "../../utils/replayFeedback";
import type { SessionBookmarkContext } from "./sessionScreenRuntime";
import {
  buildSessionReplayBookmarkContext,
  buildSessionReplayBookmarkMeta,
  buildSessionReplayBookmarkPanelHeader,
  resolveSessionReplayBookmarkDisabled,
} from "./sessionReplayBookmarkPanelRuntime";

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
  const header = buildSessionReplayBookmarkPanelHeader({
    selectedSession,
    t,
  });
  const replayDisabled = resolveSessionReplayBookmarkDisabled({
    mutating,
    selectedSession,
  });

  return (
    <div className="session-bookmark-panel">
      <div className="panel-header compact">
        <div>
          <h3>{header.title}</h3>
          <p className="support-copy">{header.summary}</p>
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
          {selectedSessionBookmarks.map((bookmark) => {
            const meta = buildSessionReplayBookmarkMeta({ bookmark, t });
            const context = buildSessionReplayBookmarkContext({
              context: bookmarkContexts[bookmark.id] ?? null,
              t,
            });

            return (
              <div key={bookmark.id} className="session-bookmark-card">
                <div className="session-bookmark-card-copy">
                  <div className="session-bookmark-card-head">
                    <strong>{bookmark.label}</strong>
                    <span>{meta.windowLabel}</span>
                  </div>
                  <p>{meta.note}</p>
                  <div className="session-bookmark-card-meta">
                    {meta.tags.map((tag) => (
                      <span key={`${bookmark.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                  {context ? (
                    <div className="session-bookmark-card-context">
                      <span className="context-field">{context.bpmLabel}</span>
                      <span className="context-field">{context.dominantLevelLabel}</span>
                      <span className="context-field">{context.anomalyLabel}</span>
                      <span className="context-field context-field--excerpt">{context.excerpt}</span>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => onReplayBookmark(selectedSession, bookmark.replayWindowIndex)}
                  disabled={replayDisabled}
                >
                  <Radio size={12} />
                  {t.session.replayHere}
                </button>
              </div>
            );
          })}
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
