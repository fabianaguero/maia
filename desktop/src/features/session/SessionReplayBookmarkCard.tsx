import { Radio } from "lucide-react";

interface SessionReplayBookmarkCardProps {
  label: string;
  windowLabel: string;
  note: string;
  tags: string[];
  replayLabel: string;
  disabled: boolean;
  context: {
    bpmLabel: string;
    dominantLevelLabel: string;
    anomalyLabel: string;
    excerpt: string;
  } | null;
  onReplay: () => void | Promise<void>;
}

export function SessionReplayBookmarkCard({
  label,
  windowLabel,
  note,
  tags,
  replayLabel,
  disabled,
  context,
  onReplay,
}: SessionReplayBookmarkCardProps) {
  return (
    <div className="session-bookmark-card">
      <div className="session-bookmark-card-copy">
        <div className="session-bookmark-card-head">
          <strong>{label}</strong>
          <span>{windowLabel}</span>
        </div>
        <p>{note}</p>
        <div className="session-bookmark-card-meta">
          {tags.map((tag) => (
            <span key={`${label}-${tag}`}>{tag}</span>
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
      <button type="button" className="secondary-action" onClick={onReplay} disabled={disabled}>
        <Radio size={12} />
        {replayLabel}
      </button>
    </div>
  );
}
