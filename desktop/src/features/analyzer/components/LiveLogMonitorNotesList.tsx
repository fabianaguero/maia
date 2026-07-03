import { hasMonitorNotes } from "./liveLogMonitorPerformanceSummaryRuntime";
import type { LiveLogMonitorPerformanceSummaryLabels } from "./liveLogMonitorPerformanceSummaryTypes";

interface LiveLogMonitorNotesListProps {
  recentWarnings: string[];
  error: string | null;
  labels: LiveLogMonitorPerformanceSummaryLabels;
}

export function LiveLogMonitorNotesList({
  recentWarnings,
  error,
  labels,
}: LiveLogMonitorNotesListProps) {
  if (!hasMonitorNotes(error, recentWarnings)) {
    return null;
  }

  return (
    <>
      <div className="panel-header compact top-spaced">
        <div>
          <h2>{labels.monitorNotesTitle}</h2>
          <p className="support-copy">{labels.monitorNotesCopy}</p>
        </div>
      </div>
      <ul className="stack-list live-log-warning-list">
        {error ? (
          <li key="live-log-error">
            <strong>{labels.runtimeError}</strong>
            <small>{error}</small>
          </li>
        ) : null}
        {recentWarnings.map((warning) => (
          <li key={warning}>
            <strong>{labels.monitorNoteLabel}</strong>
            <small>{warning}</small>
          </li>
        ))}
      </ul>
    </>
  );
}
