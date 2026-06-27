import type { ComponentProps } from "react";

import { LiveLogMonitorActiveDeck } from "./LiveLogMonitorActiveDeck";
import type { LiveLogMonitorPerformanceSummary } from "./LiveLogMonitorPerformanceSummary";
import { LiveMonitorMutationTracePanel } from "./LiveMonitorMutationTracePanel";
import { PadSequencerPanel } from "./PadSequencerPanel";

interface LiveLogMonitorDeckSectionProps {
  hasUpdate: boolean;
  emptyStateLabel: string;
  activityPanelProps: ComponentProps<typeof LiveLogMonitorActiveDeck>["activityPanelProps"];
  windowSummaryLabel: string;
  windowSummary: string;
  windowMetrics: ComponentProps<typeof LiveLogMonitorActiveDeck>["windowInsightsProps"]["metrics"];
  activeComponentsTitle: string;
  activeComponentsCopy: string;
  activeComponents: ComponentProps<typeof LiveLogMonitorActiveDeck>["windowInsightsProps"]["activeComponents"];
  tracePanelProps: ComponentProps<typeof LiveMonitorMutationTracePanel>;
  performanceSummaryProps: Omit<
    ComponentProps<typeof LiveLogMonitorPerformanceSummary>,
    "sequencerPanel"
  >;
  sequencerPanelProps: ComponentProps<typeof PadSequencerPanel>;
}

export function LiveLogMonitorDeckSection({
  hasUpdate,
  emptyStateLabel,
  activityPanelProps,
  windowSummaryLabel,
  windowSummary,
  windowMetrics,
  activeComponentsTitle,
  activeComponentsCopy,
  activeComponents,
  tracePanelProps,
  performanceSummaryProps,
  sequencerPanelProps,
}: LiveLogMonitorDeckSectionProps) {
  return (
    <LiveLogMonitorActiveDeck
      hasUpdate={hasUpdate}
      emptyStateLabel={emptyStateLabel}
      activityPanelProps={activityPanelProps}
      windowInsightsProps={{
        summaryLabel: windowSummaryLabel,
        summary: windowSummary,
        metrics: windowMetrics,
        activeComponentsTitle,
        activeComponentsCopy,
        activeComponents,
        tracePanel: <LiveMonitorMutationTracePanel {...tracePanelProps} />,
      }}
      performanceSummaryProps={{
        ...performanceSummaryProps,
        sequencerPanel: <PadSequencerPanel {...sequencerPanelProps} />,
      }}
    />
  );
}
