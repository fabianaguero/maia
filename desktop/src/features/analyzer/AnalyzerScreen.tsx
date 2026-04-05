import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { BaseAssetMetricsPanel } from "./components/BaseAssetMetricsPanel";
import { BaseAssetOverviewPanel } from "./components/BaseAssetOverviewPanel";
import { BpmCurvePanel } from "./components/BpmCurvePanel";
import { BpmPanel } from "./components/BpmPanel";
import { CompositionMetricsPanel } from "./components/CompositionMetricsPanel";
import { CompositionOverviewPanel } from "./components/CompositionOverviewPanel";
import { CompositionRenderPreviewPanel } from "./components/CompositionRenderPreviewPanel";
import { CompositionTimelinePanel } from "./components/CompositionTimelinePanel";
import { LiveLogMonitorPanel } from "./components/LiveLogMonitorPanel";
import { RepositoryMetricsPanel } from "./components/RepositoryMetricsPanel";
import { RepositoryOverviewPanel } from "./components/RepositoryOverviewPanel";
import { RepoStatusPanel } from "./components/RepoStatusPanel";
import { TrackPlaybackPanel } from "./components/TrackPlaybackPanel";
import { LogSignalPanel } from "./components/LogSignalPanel";
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
  composition: CompositionResultRecord | null;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  availableTracks: LibraryTrack[];
  mode: AnalyzerViewMode;
  analyzerLabel: string;
  onGoLibrary: () => void;
}

export function AnalyzerScreen({
  track,
  repository,
  baseAsset,
  composition,
  availableBaseAssets,
  availableCompositions,
  availableTracks,
  mode,
  analyzerLabel,
  onGoLibrary,
}: AnalyzerScreenProps) {
  if (mode === "composition") {
    if (!composition) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div>
              <p className="eyebrow">Analyzer screen</p>
              <h2>No composition selected</h2>
              <p className="support-copy">
                Create a composition plan from the library to inspect its preview artifacts.
              </p>
            </div>
          </header>

          <section className="panel empty-state large">
            <p>The composition analyzer view needs a selected result.</p>
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
            <h2>{composition.title}</h2>
            <p className="support-copy">
              Composition planner view for reusable bases plus track, repo, or manual tempo references.
            </p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Target BPM</span>
              <strong>{composition.targetBpm.toFixed(0)}</strong>
            </div>
            <div className="summary-pill">
              <span>Reference</span>
              <strong>{composition.referenceTitle}</strong>
            </div>
            <div className="summary-pill">
              <span>Created</span>
              <strong>{formatShortDate(composition.importedAt)}</strong>
            </div>
          </div>
        </header>

        <div className="analyzer-layout">
          <div className="analyzer-main-stack">
            <WaveformPlaceholder
              bins={composition.waveformBins}
              beatGrid={composition.beatGrid}
              durationSeconds={
                typeof composition.metrics.previewDurationSeconds === "number"
                  ? composition.metrics.previewDurationSeconds
                  : null
              }
            />
            <BpmCurvePanel
              bpmCurve={composition.bpmCurve}
              fallbackBpm={composition.targetBpm}
              durationSeconds={
                typeof composition.metrics.previewDurationSeconds === "number"
                  ? composition.metrics.previewDurationSeconds
                  : null
              }
            />
            <CompositionTimelinePanel composition={composition} />
            <CompositionRenderPreviewPanel composition={composition} />
            <CompositionOverviewPanel composition={composition} />
          </div>

          <div className="analyzer-sidebar">
            <CompositionMetricsPanel
              composition={composition}
              analyzerLabel={analyzerLabel}
            />
            <section className="panel metric-panel">
              <div className="panel-header compact">
                <div>
                  <h2>Composition notes</h2>
                  <p className="support-copy">
                    Persisted planner notes and reference context.
                  </p>
                </div>
              </div>
              <ul className="stack-list note-list">
                {composition.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <dl className="meta-list compact-meta">
                <div>
                  <dt>Base asset</dt>
                  <dd>{composition.baseAssetTitle}</dd>
                </div>
                <div>
                  <dt>Reference source</dt>
                  <dd>{composition.referenceSourcePath ?? "Manual BPM"}</dd>
                </div>
                <div>
                  <dt>Plan path</dt>
                  <dd>{composition.exportPath ?? "Pending materialization"}</dd>
                </div>
                <div>
                  <dt>Strategy</dt>
                  <dd>{composition.strategy}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </section>
    );
  }

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
                Import a local project directory, a local log file, or a GitHub URL from the library first.
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
              {repository.sourceKind === "file"
                ? "Log-focused analyzer view for managed local log snapshots plus internal live-tail monitoring, severity bursts, and anomaly markers."
                : "Repository-focused analyzer view for filesystem imports, managed local snapshots, and GitHub URL intake."}
            </p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Source type</span>
              <strong>
                {repository.sourceKind === "directory"
                  ? "Filesystem"
                  : repository.sourceKind === "file"
                    ? "Log file"
                    : "GitHub URL"}
              </strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(repository.importedAt)}</strong>
            </div>
          </div>
        </header>

        <div className="analyzer-layout">
          <div className="analyzer-main-stack">
            <RepositoryOverviewPanel repository={repository} />
            {repository.sourceKind === "file" ? (
              <>
                <LogSignalPanel repository={repository} />
                <LiveLogMonitorPanel
                  repository={repository}
                  availableBaseAssets={availableBaseAssets}
                  availableCompositions={availableCompositions}
                  preferredBaseAssetId={baseAsset?.id}
                  preferredCompositionId={composition?.id}
                  availableTracks={availableTracks}
                />
              </>
            ) : null}
          </div>

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
                    Code/log intake warnings and next-step guidance.
                  </p>
                </div>
              </div>
              <ul className="stack-list note-list">
                {repository.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <dl className="meta-list compact-meta">
                <div>
                  <dt>Source path</dt>
                  <dd>{repository.sourcePath}</dd>
                </div>
                <div>
                  <dt>Storage path</dt>
                  <dd>{repository.storagePath ?? "No managed snapshot created"}</dd>
                </div>
              </dl>
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
              Pick a track, repository, base asset, or composition from the library to inspect its analysis state.
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
            Focused track view with persisted waveform bins, BPM heuristics, managed
            local track snapshots when available, and a reserved status lane for repo-driven BPM suggestions.
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
          <TrackPlaybackPanel track={track} />
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
              <div>
                <dt>Storage path</dt>
                <dd>{track.storagePath ?? "No managed snapshot created"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
