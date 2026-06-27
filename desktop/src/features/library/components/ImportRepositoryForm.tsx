import { FolderOpen, GitBranch, ScrollText, Globe } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  pickRepositoryDirectory,
  pickRepositoryFile,
  upsertLogSourceConnection,
} from "../../../api/repositories";
import { useT } from "../../../i18n/I18nContext";
import type { ImportRepositoryInput, RepositorySourceKind } from "../../../types/library";
import { Web3Spinner } from "../../../components/Web3Spinner";

interface ImportRepositoryFormProps {
  busy: boolean;
  defaultDirectoryPath?: string;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  onLogConnectionSaved?: () => void;
}

export function ImportRepositoryForm({
  busy,
  defaultDirectoryPath,
  onImportRepository,
  onLogConnectionSaved,
}: ImportRepositoryFormProps) {
  const t = useT();
  const importModes: Array<{
    id: RepositorySourceKind;
    label: string;
    help: string;
    icon: typeof FolderOpen;
  }> = [
    {
      id: "directory",
      label: t.library.forms.repository.projectFolder,
      help: t.library.forms.repository.projectFolderHelp,
      icon: FolderOpen,
    },
    {
      id: "file",
      label: t.library.forms.repository.logFile,
      help: t.library.forms.repository.logFileHelp,
      icon: ScrollText,
    },
    {
      id: "url",
      label: t.library.forms.repository.githubRepo,
      help: t.library.forms.repository.githubRepoHelp,
      icon: GitBranch,
    },
  ];
  const [sourceKind, setSourceKind] = useState<RepositorySourceKind>("directory");
  const [sourcePath, setSourcePath] = useState("");
  const [label, setLabel] = useState("");
  const [gcpProjectId, setGcpProjectId] = useState("");
  const [gcpServiceName, setGcpServiceName] = useState("");
  const [gcpRegion, setGcpRegion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPath = sourcePath.trim();
    const normalizedLabel = label.trim();

    if (sourceKind === "url" && normalizedPath === "gcp-cloud-run") {
      const projectId = gcpProjectId.trim();
      const serviceName = gcpServiceName.trim();
      if (!projectId || !serviceName) {
        setError(t.library.forms.repository.gcpRequiresProjectAndService);
        return;
      }
      setError(null);
      await upsertLogSourceConnection({
        kind: "gcp_cloud_run",
        label: normalizedLabel || `${serviceName} · ${t.simpleMode.connections.cloudRunLabelSuffix}`,
        config: {
          projectId,
          serviceName,
          region: gcpRegion.trim() || undefined,
          minimumSeverity: "DEFAULT",
        },
      });
      setLabel("");
      setSourcePath("");
      setGcpProjectId("");
      setGcpServiceName("");
      setGcpRegion("");
      return;
    }

    if (!normalizedPath) {
      setError(t.library.forms.repository.sourceRequiredError);
      return;
    }

    setError(null);
    const imported = await onImportRepository({
      sourceKind,
      sourcePath: normalizedPath,
      label: normalizedLabel || undefined,
    });

    if (imported) {
      if (sourceKind === "file") {
        onLogConnectionSaved?.();
      }
      setLabel("");
      setSourcePath("");
    }
  }

  async function handleBrowseDirectory(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickRepositoryDirectory(sourcePath || defaultDirectoryPath);
      if (!pickedPath) {
        return;
      }

      setSourceKind("directory");
      setSourcePath(pickedPath);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : t.library.forms.repository.directoryPickerFailed,
      );
    } finally {
      setPickerBusy(false);
    }
  }

  async function handleBrowseFile(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickRepositoryFile(sourcePath);
      if (!pickedPath) {
        return;
      }

      setSourceKind("file");
      setSourcePath(pickedPath);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : t.library.forms.repository.filePickerFailed,
      );
    } finally {
      setPickerBusy(false);
    }
  }

  return (
    <form className="import-form maia-pro-form" onSubmit={(event) => void handleSubmit(event)}>
      <Web3Spinner visible={busy} label={t.library.forms.repository.ingestingTelemetrySource} />
      <div className="form-intro">
        <h2>{t.library.forms.repository.title}</h2>
        <p className="support-copy">{t.library.forms.repository.description}</p>
      </div>

      <div className="source-card-grid" role="tablist" aria-label={t.library.forms.repository.importTypeAria}>
        {importModes.map((mode) => {
          const Icon = mode.icon;
          const active = mode.id === sourceKind;
          return (
            <button
              key={mode.id}
              type="button"
              className={`source-card ${active ? "active" : ""}`}
              onClick={() => setSourceKind(mode.id)}
            >
              <div className="source-card-icon">
                <Icon size={24} />
              </div>
              <div className="source-card-content">
                <strong>{mode.label}</strong>
                <p>{mode.help}</p>
              </div>
            </button>
          );
        })}
        <button
          type="button"
          className={`source-card ${sourceKind === "url" && sourcePath === "gcp-cloud-run" ? "active" : ""}`}
          onClick={() => {
            setSourceKind("url");
            setSourcePath("gcp-cloud-run");
          }}
        >
          <div className="source-card-icon">
            <Globe size={24} />
          </div>
          <div className="source-card-content">
            <strong>{t.library.forms.repository.gcpCloudRun}</strong>
            <p>{t.library.forms.repository.gcpCloudRunHelp}</p>
          </div>
        </button>
      </div>

      <div className="form-fields-section">
        {sourceKind === "url" && sourcePath === "gcp-cloud-run" ? (
          <>
            <label className="field maia-field">
              <span className="field-label">{t.library.forms.repository.gcpProjectId}</span>
              <input
                value={gcpProjectId}
                className="maia-input"
                onChange={(event) => setGcpProjectId(event.target.value)}
                placeholder={t.library.forms.repository.gcpProjectIdPlaceholder}
              />
            </label>
            <label className="field maia-field">
              <span className="field-label">{t.library.forms.repository.cloudRunService}</span>
              <input
                value={gcpServiceName}
                className="maia-input"
                onChange={(event) => setGcpServiceName(event.target.value)}
                placeholder={t.library.forms.repository.cloudRunServicePlaceholder}
              />
            </label>
            <label className="field maia-field">
              <span className="field-label">{t.library.forms.repository.regionOptional}</span>
              <input
                value={gcpRegion}
                className="maia-input"
                onChange={(event) => setGcpRegion(event.target.value)}
                placeholder={t.library.forms.repository.regionPlaceholder}
              />
            </label>
          </>
        ) : (
          <label className="field maia-field">
            <span className="field-label">
              {sourceKind === "directory"
                ? t.library.forms.repository.localProjectPath
                : sourceKind === "file"
                  ? t.library.forms.repository.sourceLogPath
                  : t.library.forms.repository.githubRepositoryUrl}
            </span>
            <div className="field-input-wrapper">
              <input
                value={sourcePath}
                className="maia-input"
                onChange={(event) => setSourcePath(event.target.value)}
                placeholder={
                  sourceKind === "directory"
                    ? t.library.forms.repository.localProjectPathPlaceholder
                    : sourceKind === "file"
                      ? t.library.forms.repository.sourceLogPathPlaceholder
                      : t.library.forms.repository.githubRepositoryUrlPlaceholder
                }
              />
              {sourceKind === "directory" && (
                <button
                  type="button"
                  className="input-inline-action"
                  disabled={busy || pickerBusy}
                  onClick={() => void handleBrowseDirectory()}
                >
                  {pickerBusy ? t.library.forms.repository.pickerBusy : <FolderOpen size={16} />}
                </button>
              )}
              {sourceKind === "file" && (
                <button
                  type="button"
                  className="input-inline-action"
                  disabled={busy || pickerBusy}
                  onClick={() => void handleBrowseFile()}
                >
                  {pickerBusy ? t.library.forms.repository.pickerBusy : <ScrollText size={16} />}
                </button>
              )}
            </div>
          </label>
        )}

        <label className="field maia-field">
          <span className="field-label">{t.library.forms.repository.targetSessionLabelOptional}</span>
          <input
            value={label}
            className="maia-input"
            onChange={(event) => setLabel(event.target.value)}
            placeholder={t.library.forms.repository.targetSessionLabelPlaceholder}
          />
        </label>
      </div>

      {error ? (
        <div className="form-notice error">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="form-actions-footer">
        <button type="submit" className="action primary-launch-btn" disabled={busy}>
          {busy ? (
            <>
              <span className="spin-ring" aria-hidden="true" /> {t.library.forms.repository.analyzing}
            </>
          ) : (
            <>
              <GitBranch size={16} /> {t.library.forms.repository.startIngestion}
            </>
          )}
        </button>

        {defaultDirectoryPath && (
          <button
            type="button"
            className="secondary-action glass-btn"
            disabled={busy}
            onClick={() => {
              setSourceKind("directory");
              setSourcePath(defaultDirectoryPath);
            }}
          >
            {t.library.forms.repository.useCurrentWorkspace}
          </button>
        )}
      </div>
    </form>
  );
}
