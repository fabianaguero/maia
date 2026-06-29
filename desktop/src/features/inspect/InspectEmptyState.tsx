import { Activity } from "lucide-react";

interface InspectEmptyStateProps {
  eyebrow: string;
  title: string;
  description?: string | null;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
}

export function InspectEmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: InspectEmptyStateProps) {
  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description ? <p className="support-copy">{description}</p> : null}
        </div>
      </header>
      <section className="panel empty-state large">
        <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
        {actionLabel && onAction ? (
          <button type="button" className="action" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </section>
    </section>
  );
}
