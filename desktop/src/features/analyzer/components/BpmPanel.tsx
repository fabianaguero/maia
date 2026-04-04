import type { LibraryTrack } from "../../../types/library";

interface BpmPanelProps {
  track: LibraryTrack;
}

function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return "Pending";
  }

  const rounded = Math.round(durationSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatAnalysisMode(analysisMode: string): string {
  return analysisMode
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function BpmPanel({ track }: BpmPanelProps) {
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>BPM panel</h2>
          <p className="support-copy">
            Persisted local metrics from embedded analyzer heuristics.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Detected BPM</span>
          <strong>{track.bpm ? Math.round(track.bpm) : "Pending"}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(track.bpmConfidence * 100)}%</strong>
        </div>
        <div>
          <span>Duration</span>
          <strong>{formatDuration(track.durationSeconds)}</strong>
        </div>
        <div>
          <span>Track format</span>
          <strong>{track.fileExtension}</strong>
        </div>
        <div>
          <span>Music style</span>
          <strong>{track.musicStyleLabel}</strong>
        </div>
        <div>
          <span>Analysis mode</span>
          <strong>{formatAnalysisMode(track.analysisMode)}</strong>
        </div>
      </div>
    </section>
  );
}
