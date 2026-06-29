import type { ReactNode } from "react";

import type { InspectTrackSummaryPillViewModel } from "./inspectTrackViewRuntime";

interface InspectTrackHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  summaryPills: InspectTrackSummaryPillViewModel[];
  contextBar: ReactNode;
}

export function InspectTrackHeader({
  eyebrow,
  title,
  description,
  summaryPills,
  contextBar,
}: InspectTrackHeaderProps) {
  return (
    <>
      <header className="screen-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="support-copy">{description}</p>
        </div>
        <div className="screen-summary">
          {summaryPills.map((pill) => (
            <div key={pill.key} className="summary-pill">
              <span>{pill.label}</span>
              <strong>{pill.value}</strong>
            </div>
          ))}
        </div>
      </header>
      {contextBar}
    </>
  );
}
