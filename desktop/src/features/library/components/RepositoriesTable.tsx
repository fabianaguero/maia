import type { RepositoryAnalysis } from "../../../types/library";
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
  function sourceKindLabel(sourceKind: RepositoryAnalysis["sourceKind"]): string {
    if (sourceKind === "directory") {
      return "Filesystem";
    }
    if (sourceKind === "file") {
      return "Log file";
    }
    return "GitHub URL";
  }

  return (
    <div className="table-shell">
      <table className="tracks-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Source</th>
            <th>Signal BPM</th>
            <th>Mode</th>
            <th>Language</th>
            <th>Status</th>
            <th>Imported</th>
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
                  {repository.suggestedBpm ? Math.round(repository.suggestedBpm) : "Pending"}
                  <small>{Math.round(repository.confidence * 100)}% confidence</small>
                </td>
                <td>{repository.buildSystem}</td>
                <td>{repository.primaryLanguage}</td>
                <td>
                  {onReanalyze ? (
                    <button
                      type="button"
                      className="table-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onReanalyze(repository.id);
                      }}
                    >
                      Re-analyze
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
                    Open
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
