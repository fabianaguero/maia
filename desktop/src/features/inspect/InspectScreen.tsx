import { Activity } from "lucide-react";
import { useState } from "react";
import type {
  AnalyzerViewMode,
  BaseAssetRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { BaseAssetMetricsPanel } from "../analyzer/components/BaseAssetMetricsPanel";
import { BaseAssetOverviewPanel } from "../analyzer/components/BaseAssetOverviewPanel";
import { BpmCurvePanel } from "../analyzer/components/BpmCurvePanel";
import { BpmPanel } from "../analyzer/components/BpmPanel";
import { LiveLogMonitorPanel } from "../analyzer/components/LiveLogMonitorPanel";
import { LogSignalPanel } from "../analyzer/components/LogSignalPanel";
import { RepositoryMetricsPanel } from "../analyzer/components/RepositoryMetricsPanel";
import { RepositoryOverviewPanel } from "../analyzer/components/RepositoryOverviewPanel";
import { RepoStatusPanel } from "../analyzer/components/RepoStatusPanel";
import { TrackPlaybackPanel } from "../analyzer/components/TrackPlaybackPanel";
import { WaveformPlaceholder } from "../analyzer/components/WaveformPlaceholder";
import { useT } from "../../i18n/I18nContext";
import { useMonitor } from "../monitor/MonitorContext";

function formatAnalysisMode(analysisMode: string): string {
  return analysisMode
    .split("-")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
}

interface InspectScreenProps {
  track: LibraryTrack | null;
  repository: RepositoryAnalysis | null;
  baseAsset: BaseAssetRecord | null;
  availableTracks: LibraryTrack[];
  availableRepositories: RepositoryAnalysis[];
  availableBaseAssets: BaseAssetRecord[];
  mode: AnalyzerViewMode;
  analyzerLabel: string;
  onChangeMode: (mode: AnalyzerViewMode) => void;
  onSelectTrack: (id: string) => void;
  onSelectRepository: (id: string) => void;
  onSelectBaseAsset: (id: string) => void;
  onGoLibrary: () => void;
  onGoCompose: () => void;
}

export function InspectScreen({
  track,
  repository,
  baseAsset,
  availableTracks,
  availableRepositories,
  availableBaseAssets,
  mode,
  analyzerLabel,
  onChangeMode,
  onSelectTrack,
  onSelectRepository,
  onSelectBaseAsset,
  onGoLibrary,
  onGoCompose,
}: InspectScreenProps) {
  const t = useT();
  const monitor = useMonitor();
  const [currentTime, setCurrentTime] = useState(0);

  const hasAnyAsset =
    availableTracks.length > 0 ||
    availableRepositories.length > 0 ||
    availableBaseAssets.length > 0;

  const contextBar = (
    <div className="analyzer-context-bar">
      <div className="analyzer-mode-tabs">
        {availableTracks.length > 0 && (
          <button
            type="button"
            className={mode === "track" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("track")}
          >
            Tracks
            <span className="mode-tab-count">{availableTracks.length}</span>
          </button>
        )}
        {availableRepositories.length > 0 && (
          <button
            type="button"
            className={mode === "repo" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("repo")}
          >
            Logs / Repos
            <span className="mode-tab-count">{availableRepositories.length}</span>
          </button>
        )}
        {availableBaseAssets.length > 0 && (
          <button
            type="button"
            className={mode === "base" ? "mode-tab active" : "mode-tab"}
            onClick={() => onChangeMode("base")}
          >
            Base assets
            <span className="mode-tab-count">{availableBaseAssets.length}</span>
          </button>
        )}
      </div>

      <div className="analyzer-asset-picker">
        {mode === "track" && availableTracks.length > 0 && (
          <select
            value={track?.id ?? ""}
            onChange={(e) => onSelectTrack(e.target.value)}
            className="context-select"
          >
            {availableTracks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
        {mode === "repo" && availableRepositories.length > 0 && (
          <select
            value={repository?.id ?? ""}
            onChange={(e) => onSelectRepository(e.target.value)}
            className="context-select"
          >
            {availableRepositories.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        )}
        {mode === "base" && availableBaseAssets.length > 0 && (
          <select
            value={baseAsset?.id ?? ""}
            onChange={(e) => onSelectBaseAsset(e.target.value)}
            className="context-select"
          >
            {availableBaseAssets.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  if (!hasAnyAsset) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>Nothing to inspect yet</h2>
            <p className="support-copy">{t.inspect.copy}</p>
          </div>
        </header>
        <section className="panel empty-state large">
          <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Import a track, log, or base asset first.</p>
          <button type="button" className="action" onClick={onGoLibrary}>
            Go to Library →
          </button>
        </section>
      </section>
    );
  }

  // ── TRACK ──────────────────────────────────────────────────────────────────
  if (mode === "track") {
    if (!track) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div><p className="eyebrow">{t.inspect.title}</p><h2>No track selected</h2></div>
          </header>
          {contextBar}
        </section>
      );
    }

    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{track.title}</h2>
            <p className="support-copy">{t.inspect.copy}</p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Status</span>
              <strong>{track.analyzerStatus}</strong>
            </div>
            <div className="summary-pill">
              <span>Style</span>
              <strong>{track.musicStyleLabel}</strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(track.importedAt)}</strong>
            </div>
          </div>
        </header>
        {contextBar}

        <div className="analyzer-deck">
          <WaveformPlaceholder
            bins={track.waveformBins}
            beatGrid={track.beatGrid}
            durationSeconds={track.durationSeconds}
            hotCues={track.visualization?.hotCues}
            currentTime={currentTime}
            hero
            onSeek={monitor.seekGuideTrack}
            analysisProgress={monitor.playbackProgress}
          />
          <TrackPlaybackPanel track={track} onTimeUpdate={setCurrentTime} />
        </div>

        <div className="analyzer-layout">
          <div className="analyzer-main-stack">
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
              <details className="panel-collapsible">
                <summary className="panel-collapsible-summary">Notes &amp; metadata</summary>
                <div className="panel-collapsible-body">
                  {track.notes.length > 0 && (
                    <ul className="stack-list note-list">
                      {track.notes.map((note) => <li key={note}>{note}</li>)}
                    </ul>
                  )}
                  <dl className="meta-list compact-meta">
                    <div><dt>Analysis mode</dt><dd>{formatAnalysisMode(track.analysisMode)}</dd></div>
                    <div><dt>Source path</dt><dd>{track.sourcePath}</dd></div>
                    <div><dt>Storage path</dt><dd>{track.storagePath ?? "No snapshot"}</dd></div>
                  </dl>
                </div>
              </details>
            </section>
            <div className="inspect-compose-cta">
              <p className="support-copy">Ready to build a composition using this track?</p>
              <button type="button" className="action" onClick={onGoCompose}>
                Compose →
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── REPOSITORY / LOG ───────────────────────────────────────────────────────
  if (mode === "repo") {
    if (!repository) {
      return (
        <section className="screen">
          <header className="screen-header">
            <div><p className="eyebrow">{t.inspect.title}</p><h2>No log / repo selected</h2></div>
          </header>
          {contextBar}
        </section>
      );
    }

    return (
      <section className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">{t.inspect.title}</p>
            <h2>{repository.title}</h2>
            <p className="support-copy">
              {repository.sourceKind === "file"
                ? "Log signal analysis — severity bursts, anomaly markers, and live-tail monitoring."
                : "Repository signal analysis — code structure heuristics mapped to BPM."}
            </p>
          </div>
          <div className="screen-summary">
            <div className="summary-pill">
              <span>Source</span>
              <strong>
                {repository.sourceKind === "directory" ? "Filesystem" : repository.sourceKind === "file" ? "Log file" : "GitHub URL"}
              </strong>
            </div>
            <div className="summary-pill">
              <span>Imported</span>
              <strong>{formatShortDate(repository.importedAt)}</strong>
            </div>
          </div>
        </header>
        {contextBar}

        <div className="analyzer-layout">
          <div className="analyzer-main-stack">
            <RepositoryOverviewPanel repository={repository} />
            {repository.sourceKind === "file" ? (
              <>
                <LogSignalPanel repository={repository} />
                <LiveLogMonitorPanel
                  repository={repository}
                  availableBaseAssets={availableBaseAssets}
                  availableCompositions={[]}
                  preferredBaseAssetId={baseAsset?.id}
                  preferredCompositionId={undefined}
                  availableTracks={availableTracks}
                />
              </>
            ) : null}
          </div>
          <div className="analyzer-sidebar">
            <RepositoryMetricsPanel repository={repository} analyzerLabel={analyzerLabel} />
            <section className="panel metric-panel">
              <details className="panel-collapsible">
                <summary className="panel-collapsible-summary">Notes &amp; metadata</summary>
                <div className="panel-collapsible-body">
                  {repository.notes.length > 0 && (
                    <ul className="stack-list note-list">
                      {repository.notes.map((note) => <li key={note}>{note}</li>)}
                    </ul>
                  )}
                  <dl className="meta-list compact-meta">
                    <div><dt>Source path</dt><dd>{repository.sourcePath}</dd></div>
                    <div><dt>Storage path</dt><dd>{repository.storagePath ?? "No snapshot"}</dd></div>
                  </dl>
                </div>
              </details>
            </section>
            <div className="inspect-compose-cta">
              <p className="support-copy">Use this log's BPM signal in a composition?</p>
              <button type="button" className="action" onClick={onGoCompose}>
                Compose →
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── BASE ASSET ─────────────────────────────────────────────────────────────
  if (!baseAsset) {
    return (
      <section className="screen">
        <header className="screen-header">
          <div><p className="eyebrow">{t.inspect.title}</p><h2>No base asset selected</h2></div>
        </header>
        {contextBar}
      </section>
    );
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{t.inspect.title}</p>
          <h2>{baseAsset.title}</h2>
          <p className="support-copy">Reusable asset registered in the base catalog.</p>
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
      {contextBar}

      <div className="analyzer-layout">
        <BaseAssetOverviewPanel baseAsset={baseAsset} />
        <div className="analyzer-sidebar">
          <BaseAssetMetricsPanel baseAsset={baseAsset} analyzerLabel={analyzerLabel} />
          <section className="panel metric-panel">
            <details className="panel-collapsible">
              <summary className="panel-collapsible-summary">Notes &amp; metadata</summary>
              <div className="panel-collapsible-body">
                {baseAsset.notes.length > 0 && (
                  <ul className="stack-list note-list">
                    {baseAsset.notes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                )}
                <dl className="meta-list compact-meta">
                  <div><dt>Source path</dt><dd>{baseAsset.sourcePath}</dd></div>
                  <div><dt>Storage path</dt><dd>{baseAsset.storagePath}</dd></div>
                  <div><dt>Checksum</dt><dd>{baseAsset.checksum ?? "Pending"}</dd></div>
                </dl>
              </div>
            </details>
          </section>
          <div className="inspect-compose-cta">
            <p className="support-copy">Use this base asset in a composition?</p>
            <button type="button" className="action" onClick={onGoCompose}>
              Compose →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
