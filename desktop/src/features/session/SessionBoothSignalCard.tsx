import type { LiveLogStreamUpdate } from "../../types/monitor";
import { formatMonitorLevel } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";

interface SessionBoothSignalCardProps {
  booth: SessionBoothViewModel;
  latestUpdate: LiveLogStreamUpdate | null;
  labels: {
    signalSnapshot: string;
    latestWindowLines: string;
    waitingStreamData: string;
    awaitingInput: string;
    noLevelBreakdown: string;
    topComponentsSoon: string;
  };
}

export function SessionBoothSignalCard({
  booth,
  latestUpdate,
  labels,
}: SessionBoothSignalCardProps) {
  return (
    <section className="session-booth-card">
      <div className="session-booth-card-header">
        <strong>{labels.signalSnapshot}</strong>
        <span>
          {latestUpdate?.hasData
            ? labels.latestWindowLines.replace("{count}", String(latestUpdate.lineCount))
            : labels.waitingStreamData}
        </span>
      </div>
      <div className="session-signal-chip-row">
        {booth.levelCountEntries.length > 0 ? (
          booth.levelCountEntries.map(([level, count]) => (
            <span key={level} className="session-signal-chip">
              {formatMonitorLevel(level, labels.awaitingInput)} · {count}
            </span>
          ))
        ) : (
          <span className="session-signal-chip muted">{labels.noLevelBreakdown}</span>
        )}
      </div>
      <div className="session-signal-chip-row">
        {booth.topComponents.length > 0 ? (
          booth.topComponents.map((component) => (
            <span key={component.component} className="session-signal-chip">
              {component.component} · {component.count}
            </span>
          ))
        ) : (
          <span className="session-signal-chip muted">{labels.topComponentsSoon}</span>
        )}
      </div>
    </section>
  );
}
