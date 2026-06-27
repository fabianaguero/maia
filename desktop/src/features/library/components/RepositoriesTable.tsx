import type { RepositoryAnalysis } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { formatShortDateTime } from "../../../utils/date";

interface RepositoriesTableProps {
  repositories: RepositoryAnalysis[];
  selectedRepositoryId: string | null;
  onSelectRepository: (repositoryId: string) => void;
  onInspectRepository: (repositoryId: string) => void;
  onReanalyze?: (repositoryId: string) => Promise<boolean>;
}

export function RepositoriesTable({
  repositories,
  selectedRepositoryId,
  onSelectRepository,
  onInspectRepository,
  onReanalyze,
}: RepositoriesTableProps) {
  const t = useT();
  function sourceKindLabel(sourceKind: RepositoryAnalysis["sourceKind"]): string {
    if (sourceKind === "directory") {
      return t.inspect.filesystem;
    }
    if (sourceKind === "file") {
      return t.library.logFile;
    }
    return t.library.githubUrl;
  }

  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>{t.library.tables.repositories.name}</th>
            <th>{t.library.tables.repositories.source}</th>
            <th>{t.library.tables.repositories.signalBpm}</th>
            <th>{t.library.tables.repositories.mode}</th>
            <th>{t.library.tables.repositories.language}</th>
            <th>{t.library.tables.repositories.status}</th>
            <th>{t.library.tables.repositories.imported}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {repositories.map((repository) => {
            const selected = repository.id === selectedRepositoryId;

            return (
              <tr
                key={repository.id}
                className={selected ? "selected" : undefined}
                onClick={() => onSelectRepository(repository.id)}
              >
                <td>
                  <strong>{repository.title}</strong>
                  <small>{sourceKindLabel(repository.sourceKind)}</small>
                </td>
                <td title={repository.sourcePath}>{repository.sourcePath}</td>
                <td>
                  {repository.suggestedBpm ? Math.round(repository.suggestedBpm) : t.library.tables.repositories.pending}
                  <small>{t.library.tables.repositories.confidence.replace("{value}", String(Math.round(repository.confidence * 100)))}</small>
                </td>
                <td>{repository.buildSystem}</td>
                <td>{repository.primaryLanguage}</td>
                <td>
                  {!repository.suggestedBpm && onReanalyze ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onReanalyze(repository.id);
                      }}
                    >
                      {t.library.tables.repositories.reanalyze}
                    </button>
                  ) : (
                    repository.analyzerStatus
                  )}
                </td>
                <td>{formatShortDateTime(repository.importedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="table-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      onInspectRepository(repository.id);
                    }}
                  >
                    {t.library.tables.repositories.open}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
