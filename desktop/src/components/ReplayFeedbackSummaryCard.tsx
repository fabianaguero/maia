import { resolveMutationProfile, resolveStyleProfile } from "../config/liveProfiles";
import type { ReplayFeedbackRecommendation } from "../utils/replayFeedback";

interface ReplayFeedbackSummaryCardProps {
  recommendation: ReplayFeedbackRecommendation;
  title?: string;
  className?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onApply?: () => void;
}

export function ReplayFeedbackSummaryCard({
  recommendation,
  title = "Feedback mix",
  className = "",
  actionLabel,
  actionDisabled = false,
  onApply,
}: ReplayFeedbackSummaryCardProps) {
  const rootClassName = ["audio-path-card", "replay-feedback-card", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <span>{title}</span>
      <strong>{recommendation.summary}</strong>
      <small>{recommendation.detail}</small>
      <div className="replay-feedback-meta">
        <span>{recommendation.bookmarkCount} saved windows</span>
        <span>{resolveStyleProfile(recommendation.suggestedStyleProfileId).label}</span>
        <span>{resolveMutationProfile(recommendation.suggestedMutationProfileId).label}</span>
        {recommendation.dominantTagLabel ? <span>{recommendation.dominantTagLabel}</span> : null}
      </div>
      {recommendation.tagSummaries.length > 0 ? (
        <div className="replay-feedback-tags">
          {recommendation.tagSummaries.map((summary) => (
            <span key={summary.tag}>
              {summary.label} · {summary.count}
            </span>
          ))}
        </div>
      ) : null}
      {onApply && actionLabel ? (
        <div className="replay-bookmark-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={onApply}
            disabled={actionDisabled}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
