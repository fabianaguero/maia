import type { LibraryTrack } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { describeTrackStorage } from "../../../utils/track";

interface BpmPanelProps {
  track: LibraryTrack;
}

function formatDuration(durationSeconds: number | null, pendingLabel: string): string {
  if (!durationSeconds) {
    return pendingLabel;
  }

  const rounded = Math.round(durationSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatAnalysisMode(
  analysisMode: string,
  embeddedHeuristicLabel: string,
  hashStubLabel: string,
): string {
  const labels: Record<string, string> = {
    "librosa-dsp": "Librosa DSP",
    "embedded-heuristic": embeddedHeuristicLabel,
    "hash-stub": hashStubLabel,
  };
  return (
    labels[analysisMode] ??
    analysisMode
      .split("-")
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
      .join(" ")
  );
}

function formatPercent(value: number | null, pendingLabel: string): string {
  if (typeof value !== "number") {
    return pendingLabel;
  }

  return `${Math.round(value * 100)}%`;
}

function formatStructuralPatterns(track: LibraryTrack, pendingLabel: string): string {
  if (track.analysis.structuralPatterns.length === 0) {
    return pendingLabel;
  }

  return track.analysis.structuralPatterns
    .slice(0, 3)
    .map((pattern) => pattern.label)
    .join(", ");
}

export function BpmPanel({ track }: BpmPanelProps) {
  const t = useT();
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.bpmPanelTitle}</h2>
          <p className="support-copy">{t.inspect.bpmPanelCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.inspect.detectedBpm}</span>
          <strong>{track.analysis.bpm ? Math.round(track.analysis.bpm) : t.inspect.pending}</strong>
        </div>
        <div>
          <span>{t.session.confidence}</span>
          <strong>{Math.round(track.analysis.bpmConfidence * 100)}%</strong>
        </div>
        <div>
          <span>{t.inspect.duration}</span>
          <strong>{formatDuration(track.analysis.durationSeconds, t.inspect.pending)}</strong>
        </div>
        <div>
          <span>{t.inspect.trackFormat}</span>
          <strong>{track.file.fileExtension}</strong>
        </div>
        <div>
          <span>{t.inspect.musicStyle}</span>
          <strong>{track.tags.musicStyleLabel}</strong>
        </div>
        <div>
          <span>{t.inspect.key}</span>
          <strong>{track.analysis.keySignature ?? t.inspect.pending}</strong>
        </div>
        <div>
          <span>{t.inspect.energy}</span>
          <strong>{formatPercent(track.analysis.energyLevel, t.inspect.pending)}</strong>
        </div>
        <div>
          <span>{t.inspect.danceability}</span>
          <strong>{formatPercent(track.analysis.danceability, t.inspect.pending)}</strong>
        </div>
        <div>
          <span>{t.inspect.analysisMode}</span>
          <strong>
            {formatAnalysisMode(
              track.analysis.analysisMode,
              t.inspect.embeddedHeuristic,
              t.inspect.hashStub,
            )}
          </strong>
        </div>
        <div>
          <span>{t.inspect.storage}</span>
          <strong>{describeTrackStorage(track)}</strong>
        </div>
        <div>
          <span>{t.inspect.structureCues}</span>
          <strong>{formatStructuralPatterns(track, t.inspect.pending)}</strong>
        </div>
      </div>
    </section>
  );
}
