import { RefreshCw } from "lucide-react";

interface RuntimeStatusCardProps {
  title: string;
  detail?: string;
  badge?: string;
  tone?: "pending" | "live" | "neutral";
  activity?: "spinner" | "pulse";
  compact?: boolean;
  className?: string;
}

export function RuntimeStatusCard({
  title,
  detail,
  badge,
  tone = "neutral",
  activity = "pulse",
  compact = false,
  className,
}: RuntimeStatusCardProps) {
  const classes = [
    "runtime-status-card",
    `runtime-status-card--${tone}`,
    compact ? "runtime-status-card--compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="status" aria-live="polite">
      <div className="runtime-status-card__signal" aria-hidden="true">
        {activity === "spinner" ? (
          <RefreshCw size={compact ? 14 : 18} className="spin-ring runtime-status-card__spinner" />
        ) : (
          <span className={`runtime-status-card__pulse runtime-status-card__pulse--${tone}`} />
        )}
      </div>
      <div className="runtime-status-card__copy">
        <span className="runtime-status-card__title">
          {title}
          {activity === "spinner" ? (
            <span className="runtime-status-card__ellipsis" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          ) : null}
        </span>
        {detail ? <p className="runtime-status-card__detail">{detail}</p> : null}
        {activity === "spinner" ? (
          <span className="runtime-status-card__progress" aria-hidden="true">
            <span className="runtime-status-card__progress-bar" />
          </span>
        ) : null}
      </div>
      {badge ? <span className="runtime-status-card__badge">{badge}</span> : null}
    </div>
  );
}
