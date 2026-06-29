import type { ReactNode } from "react";

import { LiveLogMonitorMetricGrid } from "./LiveLogMonitorMetricGrid";
import type { MetricGridItem } from "./liveLogMonitorDisplayRuntime";

interface ActiveComponentItem {
  component: string;
  count: number;
}

interface LiveLogMonitorWindowInsightsProps {
  summaryLabel: string;
  summary: string;
  metrics: MetricGridItem[];
  activeComponentsTitle: string;
  activeComponentsCopy: string;
  activeComponents: ActiveComponentItem[];
  tracePanel: ReactNode;
}

export function LiveLogMonitorWindowInsights({
  summaryLabel,
  summary,
  metrics,
  activeComponentsTitle,
  activeComponentsCopy,
  activeComponents,
  tracePanel,
}: LiveLogMonitorWindowInsightsProps) {
  return (
    <>
      <div className="render-master-card top-spaced">
        <span>{summaryLabel}</span>
        <strong>{summary}</strong>
      </div>

      <div className="top-spaced">
        <LiveLogMonitorMetricGrid items={metrics} />
      </div>

      {activeComponents.length > 0 ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>{activeComponentsTitle}</h2>
              <p className="support-copy">{activeComponentsCopy}</p>
            </div>
          </div>
          <div className="pill-strip">
            {activeComponents.map((component) => (
              <span key={`${component.component}-${component.count}`}>
                {component.component} · {component.count}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {tracePanel}
    </>
  );
}
