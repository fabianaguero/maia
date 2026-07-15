import { useCallback, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { useT } from "../../../i18n/I18nContext";
import { CodeProjectStatusIndicator } from "./CodeProjectStatusIndicator";
import type { CodeProject } from "../../../types/codeProject";
import "./LibraryCodeProjectsList.css";

interface LibraryCodeProjectsListProps {
  projects: CodeProject[];
  loading: boolean;
  onNew: () => void;
  onEdit: (project: CodeProject) => void;
  onDelete: (project: CodeProject) => Promise<void>;
}

export function LibraryCodeProjectsList({
  projects,
  loading,
  onNew,
  onEdit,
  onDelete,
}: LibraryCodeProjectsListProps) {
  const t = useT();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = useCallback(
    async (project: CodeProject) => {
      setDeleting(true);
      try {
        await onDelete(project);
        setDeleteConfirm(null);
      } finally {
        setDeleting(false);
      }
    },
    [onDelete],
  );

  if (loading) {
    return (
      <div className="projects-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="project-row skeleton" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <h4>{t.simpleMode.codeProjects.noProjectsYet}</h4>
        <p>{t.simpleMode.codeProjects.noProjectsBody}</p>
        <button className="btn btn-primary" onClick={onNew}>
          {t.simpleMode.codeProjects.newProject}
        </button>
      </div>
    );
  }

  return (
    <div className="projects-list">
      {projects.map((project) => (
        <div key={project.id} className="project-row">
          <div className="project-info">
            <div className="project-name">{project.label}</div>
            <div className="project-url">{project.repositoryUrl}</div>
          </div>

          <CodeProjectStatusIndicator
            status={project.status}
            errorMessage={project.errorMessage}
            lastCheckedAt={project.lastCheckedAt}
          />

          <div className="project-actions">
            <button
              className="action-button"
              title={t.simpleMode.codeProjects.edit}
              onClick={() => onEdit(project)}
            >
              <Edit2 size={16} />
            </button>
            <button
              className="action-button delete"
              title={t.simpleMode.codeProjects.delete}
              onClick={() => setDeleteConfirm(project.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {deleteConfirm === project.id && (
            <div className="delete-confirm">
              <p>Delete &quot;{project.label}&quot;?</p>
              <div className="confirm-actions">
                <button
                  className="btn btn-critical"
                  onClick={() => handleDeleteConfirm(project)}
                  disabled={deleting}
                >
                  {t.simpleMode.common.delete}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  {t.simpleMode.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
