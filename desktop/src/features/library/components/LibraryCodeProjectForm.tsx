import { useCallback, useState } from "react";
import { FolderOpen } from "lucide-react";
import { pickRepositoryDirectory } from "../../../api/repositories";
import { useT } from "../../../i18n/I18nContext";
import type { CodeProjectFormDraft } from "../../../types/codeProject";
import "./LibraryCodeProjectForm.css";

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
  const [pickerBusy, setPickerBusy] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!draft.label.trim()) {
      newErrors.label = t.simpleMode.common.required || "Required";
    }
    if (!draft.repositoryUrl.trim()) {
      newErrors.repositoryUrl = t.simpleMode.common.required || "Required";
    } else if (!isValidRepositoryLocation(draft.repositoryUrl)) {
      newErrors.repositoryUrl = t.simpleMode.codeProjects.invalidRepositoryLocation;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [draft, t]);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      await onSubmit();
    }
  }, [validateForm, onSubmit]);

  const handleBrowseLocalRepository = useCallback(async () => {
    setPickerBusy(true);
    setErrors((current) => ({ ...current, repositoryUrl: "" }));
    try {
      const pickedPath = await pickRepositoryDirectory(draft.repositoryUrl);
      if (pickedPath) {
        onDraftChange({ repositoryUrl: pickedPath });
      }
    } catch (error) {
      setErrors((current) => ({
        ...current,
        repositoryUrl:
          error instanceof Error ? error.message : t.simpleMode.codeProjects.repositoryPickerFailed,
      }));
    } finally {
      setPickerBusy(false);
    }
  }, [draft.repositoryUrl, onDraftChange, t.simpleMode.codeProjects.repositoryPickerFailed]);

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
        <span className="support-copy">{t.simpleMode.codeProjects.projectNameHelp}</span>
      </div>

      <div className="form-field">
        <label htmlFor="repo-url" className="field-label">
          {t.simpleMode.codeProjects.repositoryUrl}
        </label>
        <div className="code-project-form__path-row">
          <input
            id="repo-url"
            type="text"
            className="maia-input"
            value={draft.repositoryUrl}
            onChange={(e) => onDraftChange({ repositoryUrl: e.target.value })}
            placeholder="/home/user/work/my-repo"
            disabled={saving || pickerBusy}
          />
          <button
            type="button"
            className="code-project-form__browse"
            onClick={handleBrowseLocalRepository}
            disabled={saving || pickerBusy}
            title={t.simpleMode.codeProjects.browseLocalRepository}
          >
            {pickerBusy ? t.simpleMode.connections.loading : <FolderOpen size={16} />}
          </button>
        </div>
        {errors.repositoryUrl && <span className="field-error">{errors.repositoryUrl}</span>}
        <span className="support-copy">{t.simpleMode.codeProjects.repositoryUrlHelp}</span>
        <span className="support-copy">{t.simpleMode.codeProjects.localRepositoryPickerHelp}</span>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? t.simpleMode.common.saving : t.simpleMode.codeProjects.create}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          {t.simpleMode.common.cancel}
        </button>
      </div>
    </form>
  );
}

function isValidRepositoryLocation(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return true;
  }
  if (/^[A-Za-z]:[\\/]/.test(trimmed)) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
