import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { useT } from "../../i18n/I18nContext";
import { LiveLogMonitorPanel } from "../analyzer/components/LiveLogMonitorPanel";
import { LogSignalPanel } from "../analyzer/components/LogSignalPanel";
import { RepositoryMetricsPanel } from "../analyzer/components/RepositoryMetricsPanel";
import { RepositoryOverviewPanel } from "../analyzer/components/RepositoryOverviewPanel";

interface InspectRepositoryViewProps {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  preferredBaseAssetId?: string | null;
  analyzerLabel: string;
  contextBar: React.ReactNode;
  onGoCompose: () => void;
}

export function InspectRepositoryView({
  repository,
  availableBaseAssets,
  availableTracks,
  availablePlaylists,
  preferredBaseAssetId,
  analyzerLabel,
  contextBar,
  onGoCompose,
}: InspectRepositoryViewProps) {
  const t = useT();

  return (
    <section className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{t.inspect.title}</p>
          <h2>{repository.title}</h2>
          <p className="support-copy">
            {repository.sourceKind === "file"
              ? t.inspect.logSignalAnalysis
              : t.inspect.repoSignalAnalysis}
          </p>
        </div>
        <div className="screen-summary">
          <div className="summary-pill">
            <span>{t.inspect.source}</span>
            <strong>
              {repository.sourceKind === "directory"
                ? t.inspect.filesystem
                : repository.sourceKind === "file"
                  ? t.library.logFile
                  : t.library.githubUrl}
            </strong>
          </div>
          <div className="summary-pill">
            <span>{t.inspect.imported}</span>
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
                preferredBaseAssetId={preferredBaseAssetId ?? undefined}
                preferredCompositionId={undefined}
                availableTracks={availableTracks}
                availablePlaylists={availablePlaylists}
              />
            </>
          ) : null}
        </div>
        <div className="analyzer-sidebar">
          <RepositoryMetricsPanel repository={repository} analyzerLabel={analyzerLabel} />
          <section className="panel metric-panel">
            <details className="panel-collapsible">
              <summary className="panel-collapsible-summary">{t.inspect.notesMetadata}</summary>
              <div className="panel-collapsible-body">
                {repository.notes.length > 0 && (
                  <ul className="stack-list note-list">
                    {repository.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
                <dl className="meta-list compact-meta">
                  <div>
                    <dt>{t.inspect.sourcePath}</dt>
                    <dd>{repository.sourcePath}</dd>
                  </div>
                  <div>
                    <dt>{t.inspect.storagePath}</dt>
                    <dd>{repository.storagePath ?? t.inspect.noSnapshot}</dd>
                  </div>
                </dl>
              </div>
            </details>
          </section>
          <div className="inspect-compose-cta">
            <p className="support-copy">{t.inspect.useLogSignal}</p>
            <button type="button" className="action" onClick={onGoCompose}>
              {t.inspect.composeCta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
