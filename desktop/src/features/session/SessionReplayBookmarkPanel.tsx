import { Radio } from "lucide-react";
import { ReplayFeedbackSummaryCard } from "../../components/ReplayFeedbackSummaryCard";
import { useT } from "../../i18n/I18nContext";
import { SessionReplayBookmarkCard } from "./SessionReplayBookmarkCard";
import { buildSessionReplayBookmarkPanelSections } from "./sessionReplayBookmarkPanelRuntime";
import type { SessionReplayBookmarkPanelProps } from "./sessionReplayBookmarkPanelTypes";

export function SessionReplayBookmarkPanel({ ...props }: SessionReplayBookmarkPanelProps) {
  const t = useT();
  const sections = buildSessionReplayBookmarkPanelSections({
    ...props,
    t,
  });

  return (
    <div className="session-bookmark-panel">
      <div className="panel-header compact">
        <div>
          <h3>{sections.header.title}</h3>
          <p className="support-copy">{sections.header.summary}</p>
        </div>
      </div>
      {sections.recommendationProps ? (
        <ReplayFeedbackSummaryCard {...sections.recommendationProps} />
      ) : null}
      {sections.bookmarkCardPropsList.length > 0 ? (
        <div className="session-bookmark-list">
          {sections.bookmarkCardPropsList.map((bookmarkCardProps) => (
            <SessionReplayBookmarkCard
              key={`${bookmarkCardProps.label}-${bookmarkCardProps.windowLabel}`}
              {...bookmarkCardProps}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state session-bookmark-empty">
          <Radio size={24} style={{ opacity: 0.28 }} />
          <p>{sections.emptyLabel}</p>
        </div>
      )}
    </div>
  );
}
