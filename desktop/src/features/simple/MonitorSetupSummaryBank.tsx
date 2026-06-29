import type { ReactNode } from "react";

import type { MonitorSetupCardViewModel } from "./monitorSetupViewModel";

interface MonitorSetupSummaryBankProps {
  summaryCards: MonitorSetupCardViewModel[];
  icons: Record<MonitorSetupCardViewModel["key"], ReactNode>;
}

export function MonitorSetupSummaryBank({ summaryCards, icons }: MonitorSetupSummaryBankProps) {
  return (
    <div className="monitor-setup-screen__summary">
      {summaryCards.map((card) => (
        <div key={card.label} className="monitor-setup-screen__summary-card">
          <div className="monitor-setup-screen__summary-head">
            <span className="monitor-setup-screen__summary-icon">{icons[card.key]}</span>
            <span className="monitor-setup-screen__summary-label">{card.label}</span>
          </div>
          <strong className="monitor-setup-screen__summary-value">{card.value}</strong>
          <span className="monitor-setup-screen__summary-meta" title={card.detail}>
            {card.detail}
          </span>
        </div>
      ))}
    </div>
  );
}
