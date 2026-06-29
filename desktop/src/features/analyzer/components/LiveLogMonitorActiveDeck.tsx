import type { ComponentProps } from "react";

import { LiveLogMonitorActivityPanel } from "./LiveLogMonitorActivityPanel";
import { LiveLogMonitorPerformanceSummary } from "./LiveLogMonitorPerformanceSummary";
import { LiveLogMonitorWindowInsights } from "./LiveLogMonitorWindowInsights";

interface LiveLogMonitorActiveDeckProps {
  hasUpdate: boolean;
  emptyStateLabel: string;
  activityPanelProps: ComponentProps<typeof LiveLogMonitorActivityPanel>;
  windowInsightsProps: ComponentProps<typeof LiveLogMonitorWindowInsights>;
  performanceSummaryProps: ComponentProps<typeof LiveLogMonitorPerformanceSummary>;
}

export function LiveLogMonitorActiveDeck({
  hasUpdate,
  emptyStateLabel,
  activityPanelProps,
  windowInsightsProps,
  performanceSummaryProps,
}: LiveLogMonitorActiveDeckProps) {
  if (!hasUpdate) {
    return (
      <div className="empty-state top-spaced">
        <p>{emptyStateLabel}</p>
      </div>
    );
  }

  return (
    <>
      <LiveLogMonitorActivityPanel {...activityPanelProps} />
      <LiveLogMonitorWindowInsights {...windowInsightsProps} />
      <LiveLogMonitorPerformanceSummary {...performanceSummaryProps} />
    </>
  );
}
