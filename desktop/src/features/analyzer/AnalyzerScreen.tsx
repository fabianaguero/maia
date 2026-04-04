import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { BaseAssetMetricsPanel } from "./components/BaseAssetMetricsPanel";
import { BaseAssetOverviewPanel } from "./components/BaseAssetOverviewPanel";
import { BpmCurvePanel } from "./components/BpmCurvePanel";
import { BpmPanel } from "./components/BpmPanel";
import { RepositoryMetricsPanel } from "./components/RepositoryMetricsPanel";
import { RepositoryOverviewPanel } from "./components/RepositoryOverviewPanel";
import { RepoStatusPanel } from "./components/RepoStatusPanel";
import { WaveformPlaceholder } from "./components/WaveformPlaceholder";

function formatAnalysisMode(analysisMode: string): string {
  return analysisMode
    .split("-")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

interface AnalyzerScreenProps {
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  mode: AnalyzerViewMode;
  analyzerLabel: string;
  onGoLibrary: () => void;
}

export function AnalyzerScreen({
  track,
  repository,
  baseAsset,
  mode,
  analyzerLabel,
  onGoLibrary,
}: AnalyzerScreenProps) {
  if (mode === "base") {
    if (!baseAsset) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div>
              <p className="eyebrow">Analyzer screen</p>
              <h2>No base asset selected</h2>
              <p className="support-copy">
                Register a file or folder pack from the library to inspect reusable asset metadata.
              </p>
            </div>
          </header>

          <section className="panel empty-state large">
            <p>The base asset analyzer view needs a selected reusable asset.</p>
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
            <h2>{baseAsset.title}</h2>
            <p className="support-copy">
              Reusable asset view for local files and folder packs registered in the base catalog.
            </p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Category</span>
              <strong>{baseAsset.categoryLabel}</strong>
            </div>
            <div className="summary-pill">
              <span>Reusable</span>
              <strong>{baseAsset.reusable ? "Yes" : "Reference only"}</strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(baseAsset.importedAt)}</strong>
            </div>
          </div>
        </header>

        <div className="analyzer-layout">
          <BaseAssetOverviewPanel baseAsset={baseAsset} />

          <div className="analyzer-sidebar">
            <BaseAssetMetricsPanel
              baseAsset={baseAsset}
              analyzerLabel={analyzerLabel}
            />
            <section className="panel metric-panel">
              <div className="panel-header compact">
                <div>
                  <h2>Base asset notes</h2>
                  <p className="support-copy">
                    Catalog notes and import decisions persisted alongside the asset.
                  </p>
                </div>
              </div>
              <ul className="stack-list note-list">
                {baseAsset.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <dl className="meta-list compact-meta">
                <div>
                  <dt>Source path</dt>
                  <dd>{baseAsset.sourcePath}</dd>
                </div>
                <div>
                  <dt>Storage path</dt>
                  <dd>{baseAsset.storagePath}</dd>
                </div>
                <div>
                  <dt>Checksum</dt>
                  <dd>{baseAsset.checksum ?? "Pending"}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </section>
    );
  }

  if (mode === "repo") {
    if (!repository) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div>
              <p className="eyebrow">Analyzer screen</p>
              <h2>No repository selected</h2>
              <p className="support-copy">
                Import a local project directory or a GitHub URL from the library first.
              </p>
            </div>
          </header>

          <section className="panel empty-state large">
            <p>The repository analyzer view needs a selected code project.</p>
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
            <h2>{repository.title}</h2>
            <p className="support-copy">
              Repository-focused analyzer view for filesystem imports and GitHub URL intake.
            </p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Source type</span>
              <strong>{repository.sourceKind === "directory" ? "Filesystem" : "GitHub URL"}</strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(repository.importedAt)}</strong>
            </div>
          </div>
        </header>

        <div className="analyzer-layout">
          <RepositoryOverviewPanel repository={repository} />

          <div className="analyzer-sidebar">
            <RepositoryMetricsPanel
              repository={repository}
              analyzerLabel={analyzerLabel}
            />
            <section className="panel metric-panel">
              <div className="panel-header compact">
                <div>
                  <h2>Analyzer notes</h2>
                  <p className="support-copy">
                    Repository intake warnings and next-step guidance.
                  </p>
                </div>
              </div>
              <ul className="stack-list note-list">
                {repository.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
    );
  }

  if (!track) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">Analyzer screen</p>
            <h2>No track selected</h2>
            <p className="support-copy">
              Pick a track, repository, or base asset from the library to inspect its analysis state.
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
            Focused track view with persisted waveform bins, BPM heuristics, and
            a reserved status lane for repo-driven BPM suggestions.
          </p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>Analyzer status</span>
            <strong>{track.analyzerStatus}</strong>
          </div>
          <div className="summary-pill">
            <span>Music style</span>
            <strong>{track.musicStyleLabel}</strong>
          </div>
          <div className="summary-pill">
            <span>Imported</span>
            <strong>{formatShortDate(track.importedAt)}</strong>
          </div>
        </div>
      </header>

      <div className="analyzer-layout">
        <div className="analyzer-main-stack">
          <WaveformPlaceholder
            bins={track.waveformBins}
            beatGrid={track.beatGrid}
            durationSeconds={track.durationSeconds}
          />
          <BpmCurvePanel
            bpmCurve={track.bpmCurve}
            fallbackBpm={track.bpm}
            durationSeconds={track.durationSeconds}
          />
        </div>

        <div className="analyzer-sidebar">
          <BpmPanel track={track} />
          <RepoStatusPanel track={track} analyzerLabel={analyzerLabel} />
          <section className="panel metric-panel">
            <div className="panel-header compact">
              <div>
                <h2>Track notes</h2>
                <p className="support-copy">
                  Persisted alongside the local analyzer payload.
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
                <dt>Music style</dt>
                <dd>{track.musicStyleLabel}</dd>
              </div>
              <div>
                <dt>Analysis mode</dt>
                <dd>{formatAnalysisMode(track.analysisMode)}</dd>
              </div>
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
