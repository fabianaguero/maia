import type { LibraryTrack } from "../../../types/library";
import { describeTrackStorage } from "../../../utils/track";

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

function formatPercent(value: number | null): string {
  if (typeof value !== "number") {
    return "Pending";
  }

  return `${Math.round(value * 100)}%`;
}

function formatStructuralPatterns(track: LibraryTrack): string {
  if (track.analysis.structuralPatterns.length === 0) {
    return "Pending";
  }

  return track.analysis.structuralPatterns
    .slice(0, 3)
    .map((pattern) => pattern.label)
    .join(", ");
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
          <strong>{track.analysis.bpm ? Math.round(track.analysis.bpm) : "Pending"}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(track.analysis.bpmConfidence * 100)}%</strong>
        </div>
        <div>
          <span>Duration</span>
          <strong>{formatDuration(track.analysis.durationSeconds)}</strong>
        </div>
        <div>
          <span>Track format</span>
          <strong>{track.file.fileExtension}</strong>
        </div>
        <div>
          <span>Music style</span>
          <strong>{track.tags.musicStyleLabel}</strong>
        </div>
        <div>
          <span>Key</span>
          <strong>{track.analysis.keySignature ?? "Pending"}</strong>
        </div>
        <div>
          <span>Energy</span>
          <strong>{formatPercent(track.analysis.energyLevel)}</strong>
        </div>
        <div>
          <span>Danceability</span>
          <strong>{formatPercent(track.analysis.danceability)}</strong>
        </div>
        <div>
          <span>Analysis mode</span>
          <strong>{formatAnalysisMode(track.analysis.analysisMode)}</strong>
        </div>
        <div>
          <span>Storage</span>
          <strong>{describeTrackStorage(track)}</strong>
        </div>
        <div>
          <span>Structure cues</span>
          <strong>{formatStructuralPatterns(track)}</strong>
        </div>
      </div>
    </section>
  );
}
