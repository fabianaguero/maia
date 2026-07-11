import { useCallback, useState } from "react";
import { useT } from "../../../i18n/I18nContext";
import type { CodeProjectFormDraft } from "../../../types/codeProject";

interface LibraryCodeProjectFormProps {
  draft: CodeProjectFormDraft;
  onDraftChange: (patch: Partial<CodeProjectFormDraft>) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function LibraryCodeProjectForm({
  draft,
  onDraftChange,
  onSubmit,
  onCancel,
  saving,
}: LibraryCodeProjectFormProps) {
  const t = useT();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!draft.label.trim()) {
      newErrors.label = t.simpleMode.common.required || "Required";
    }
    if (!draft.repositoryUrl.trim()) {
      newErrors.repositoryUrl = t.simpleMode.common.required || "Required";
    } else if (!isValidUrl(draft.repositoryUrl)) {
      newErrors.repositoryUrl = "Invalid URL format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [draft, t]);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      await onSubmit();
    }
  }, [validateForm, onSubmit]);

  return (
    <form className="code-project-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-field">
        <label htmlFor="project-name" className="field-label">
          {t.simpleMode.codeProjects.projectName}
        </label>
        <input
          id="project-name"
          type="text"
          className="maia-input"
          value={draft.label}
          onChange={(e) => onDraftChange({ label: e.target.value })}
          placeholder={t.simpleMode.codeProjects.projectNamePlaceholder}
          maxLength={100}
          disabled={saving}
        />
        {errors.label && <span className="field-error">{errors.label}</span>}
        <span className="support-copy">
          {t.simpleMode.codeProjects.projectNameHelp}
        </span>
      </div>

      <div className="form-field">
        <label htmlFor="repo-url" className="field-label">
          {t.simpleMode.codeProjects.repositoryUrl}
        </label>
        <input
          id="repo-url"
          type="url"
          className="maia-input"
          value={draft.repositoryUrl}
          onChange={(e) => onDraftChange({ repositoryUrl: e.target.value })}
          placeholder="https://github.com/org/repo"
          disabled={saving}
        />
        {errors.repositoryUrl && (
          <span className="field-error">{errors.repositoryUrl}</span>
        )}
        <span className="support-copy">
          {t.simpleMode.codeProjects.repositoryUrlHelp}
        </span>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? t.simpleMode.common.saving : t.simpleMode.codeProjects.create}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          {t.simpleMode.common.cancel}
        </button>
      </div>

      <style>{`
        .code-project-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 16px);
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs, 4px);
        }

        .field-label {
          font-weight: 500;
          font-size: 13px;
          color: inherit;
        }

        .maia-input {
          padding: var(--space-sm, 8px) var(--space-md, 16px);
          border: 1px solid var(--color-calm);
          border-radius: 4px;
          font-family: IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          background-color: inherit;
          color: inherit;
        }

        .maia-input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.1);
        }

        .maia-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .field-error {
          color: var(--color-critical);
          font-size: 12px;
        }

        .support-copy {
          font-size: 12px;
          opacity: 0.7;
        }

        .form-actions {
          display: flex;
          gap: var(--space-sm, 8px);
          margin-top: var(--space-md, 16px);
        }

        .btn {
          padding: var(--space-sm, 8px) var(--space-md, 16px);
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          font-size: 13px;
          transition: background-color 0.2s;
          font-family: IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .btn-primary {
          background-color: var(--color-accent);
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-secondary {
          background-color: transparent;
          color: inherit;
          border: 1px solid var(--color-calm);
        }

        .btn-secondary:hover:not(:disabled) {
          border-color: var(--color-accent);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
