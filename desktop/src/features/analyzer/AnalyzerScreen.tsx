import type { LibraryTrack } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { BpmPanel } from "./components/BpmPanel";
import { RepoStatusPanel } from "./components/RepoStatusPanel";
import { WaveformPlaceholder } from "./components/WaveformPlaceholder";

interface AnalyzerScreenProps {
  track: LibraryTrack | null;
  analyzerLabel: string;
  onGoLibrary: () => void;
}

export function AnalyzerScreen({
  track,
  analyzerLabel,
  onGoLibrary,
}: AnalyzerScreenProps) {
  if (!track) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">Analyzer screen</p>
            <h2>No track selected</h2>
            <p className="support-copy">
              Pick a track from the library to inspect its placeholder waveform
              and BPM state.
            </p>
          </div>
        </header>

        <section className="panel empty-state large">
          <p>The analyzer screen needs a selected library item.</p>
          <button type="button" className="action" onClick={onGoLibrary}>
            Go to library
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Analyzer screen</p>
          <h2>{track.title}</h2>
          <p className="support-copy">
            Focused track view with placeholder waveform bars, BPM metrics, and
            a reserved status lane for repo-driven BPM suggestions.
          </p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>Analyzer status</span>
            <strong>{track.analyzerStatus}</strong>
          </div>
          <div className="summary-pill">
            <span>Imported</span>
            <strong>{formatShortDate(track.importedAt)}</strong>
          </div>
        </div>
      </header>

      <div className="analyzer-layout">
        <WaveformPlaceholder
          bins={track.waveformBins}
          durationSeconds={track.durationSeconds}
        />

        <div className="analyzer-sidebar">
          <BpmPanel track={track} />
          <RepoStatusPanel track={track} analyzerLabel={analyzerLabel} />
          <section className="panel metric-panel">
            <div className="panel-header compact">
              <div>
                <h2>Track notes</h2>
                <p className="support-copy">
                  Persisted alongside the mocked analysis payload.
                </p>
              </div>
            </div>
            <ul className="stack-list note-list">
              {track.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <dl className="meta-list compact-meta">
              <div>
                <dt>Source path</dt>
                <dd>{track.sourcePath}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
