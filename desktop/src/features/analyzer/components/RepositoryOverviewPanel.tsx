import type { RepositoryAnalysis } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

interface RepositoryOverviewPanelProps {
  repository: RepositoryAnalysis;
}

export function RepositoryOverviewPanel({ repository }: RepositoryOverviewPanelProps) {
  const t = useT();
  const intakeCopy =
    repository.sourceKind === "directory"
      ? t.inspect.repoIntakeDirectory
      : repository.sourceKind === "file"
        ? t.inspect.repoIntakeFile
        : t.inspect.repoIntakeRemote;

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>{t.inspect.codeLogIntake}</h2>
          <p className="support-copy">{intakeCopy}</p>
        </div>
      </div>

      <div className="repo-hero">
        <div className="repo-hero-card">
          <span>{t.inspect.summary}</span>
          <strong>{repository.summary}</strong>
        </div>
        <div className="repo-hero-card">
          <span>{t.inspect.source}</span>
          <strong>{repository.sourcePath}</strong>
        </div>
        <div className="repo-hero-card">
          <span>{t.inspect.storage}</span>
          <strong>{repository.storagePath ?? t.inspect.noManagedSnapshot}</strong>
        </div>
        <div className="repo-hero-card">
          <span>{t.inspect.tags}</span>
          <div className="pill-strip">
            {repository.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
