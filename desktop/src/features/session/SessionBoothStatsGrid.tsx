import type { SessionBoothViewModel } from "./sessionBoothViewModel";

interface SessionBoothStatsGridProps {
  stats: SessionBoothViewModel["stats"];
}

export function SessionBoothStatsGrid({ stats }: SessionBoothStatsGridProps) {
  return (
    <div className="session-booth-stat-grid">
      {stats.map((item) => (
        <article key={item.label} className="session-booth-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.helper}</small>
        </article>
      ))}
    </div>
  );
}
