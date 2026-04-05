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
  const labels: Record<string, string> = {
    "librosa-dsp": "Librosa DSP",
    "embedded-heuristic": "Embedded Heuristic",
    "hash-stub": "Hash Stub",
  };
  return labels[analysisMode] ?? analysisMode
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function describeStorage(track: LibraryTrack): string {
  if (!track.storagePath) {
    return "Original/demo path";
  }

  if (track.storagePath.startsWith("browser-fallback://")) {
    return "Simulated snapshot";
  }

  if (track.storagePath === track.sourcePath) {
    return "Legacy/original path";
  }

  return "Managed snapshot";
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
        <div>
          <span>Storage</span>
          <strong>{describeStorage(track)}</strong>
        </div>
      </div>
    </section>
  );
}
