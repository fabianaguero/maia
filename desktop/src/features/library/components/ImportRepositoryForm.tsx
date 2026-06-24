import { FolderOpen, GitBranch, ScrollText, Globe } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { pickRepositoryDirectory, pickRepositoryFile, upsertLogSourceConnection } from "../../../api/repositories";
import type { ImportRepositoryInput, RepositorySourceKind } from "../../../types/library";
import { Web3Spinner } from "../../../components/Web3Spinner";

interface ImportRepositoryFormProps {
  busy: boolean;
  defaultDirectoryPath?: string;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
}

const importModes: Array<{
  id: RepositorySourceKind;
  label: string;
  help: string;
  icon: typeof FolderOpen;
}> = [
  {
    id: "directory",
    label: "Project Folder",
    help: "Import a local directory into a managed Maia snapshot.",
    icon: FolderOpen,
  },
  {
    id: "file",
    label: "Log File",
    help: "Import a local log file for operational signal analysis.",
    icon: ScrollText,
  },
  {
    id: "url",
    label: "GitHub Repo",
    help: "Register a remote repository for metadata-only intake.",
    icon: GitBranch,
  },
];

export function ImportRepositoryForm({
  busy,
  defaultDirectoryPath,
  onImportRepository,
}: ImportRepositoryFormProps) {
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
        setError("GCP Cloud Run requires a project ID and service name.");
        return;
      }
      setError(null);
      await upsertLogSourceConnection({
        kind: "gcp_cloud_run",
        label: normalizedLabel || `${serviceName} · Cloud Run`,
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
      setError("A local code/log path, GitHub URL, or GCP Cloud Run source is required.");
      return;
    }

    setError(null);
    const imported = await onImportRepository({
      sourceKind,
      sourcePath: normalizedPath,
      label: normalizedLabel || undefined,
    });

    if (imported) {
      setLabel("");
      setSourcePath("");
    }
  }

  async function handleBrowseDirectory(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickRepositoryDirectory(
        sourcePath || defaultDirectoryPath,
      );
      if (!pickedPath) {
        return;
      }

      setSourceKind("directory");
      setSourcePath(pickedPath);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Native directory picker failed. Enter the path manually.",
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
          : "Native file picker failed. Enter the path manually.",
      );
    } finally {
      setPickerBusy(false);
    }
  }

  return (
    <form className="import-form maia-pro-form" onSubmit={(event) => void handleSubmit(event)}>
      <Web3Spinner visible={busy} label="Ingesting Telemetry Source..." />
      <div className="form-intro">
          <h2>Import code or logs</h2>
          <p className="support-copy">
            Select a source type to begin operational telemetry intake.
          </p>
      </div>

      <div className="source-card-grid" role="tablist" aria-label="Repository import type">
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
            <strong>GCP Cloud Run</strong>
            <p>Persist a gcloud logging tail connector for Cloud Run services.</p>
          </div>
        </button>
      </div>

      <div className="form-fields-section">
        {sourceKind === "url" && sourcePath === "gcp-cloud-run" ? (
          <>
            <label className="field maia-field">
              <span className="field-label">GCP Project ID</span>
              <input value={gcpProjectId} className="maia-input" onChange={(event) => setGcpProjectId(event.target.value)} placeholder="my-gcp-project" />
            </label>
            <label className="field maia-field">
              <span className="field-label">Cloud Run service</span>
              <input value={gcpServiceName} className="maia-input" onChange={(event) => setGcpServiceName(event.target.value)} placeholder="checkout-api" />
            </label>
            <label className="field maia-field">
              <span className="field-label">Region (optional)</span>
              <input value={gcpRegion} className="maia-input" onChange={(event) => setGcpRegion(event.target.value)} placeholder="us-central1" />
            </label>
          </>
        ) : (
          <label className="field maia-field">
            <span className="field-label">
              {sourceKind === "directory" ? "Local Project Path" : sourceKind === "file" ? "Source Log Path" : "GitHub Repository URL"}
            </span>
            <div className="field-input-wrapper">
              <input
                value={sourcePath}
                className="maia-input"
                onChange={(event) => setSourcePath(event.target.value)}
                placeholder={sourceKind === "directory" ? "/home/dev/project" : sourceKind === "file" ? "/var/log/app.log" : "https://github.com/..."}
              />
              {sourceKind === "directory" && (
                <button type="button" className="input-inline-action" disabled={busy || pickerBusy} onClick={() => void handleBrowseDirectory()}>
                  {pickerBusy ? "..." : <FolderOpen size={16} />}
                </button>
              )}
              {sourceKind === "file" && (
                <button type="button" className="input-inline-action" disabled={busy || pickerBusy} onClick={() => void handleBrowseFile()}>
                  {pickerBusy ? "..." : <ScrollText size={16} />}
                </button>
              )}
            </div>
          </label>
        )}

        <label className="field maia-field">
          <span className="field-label">Target session label (Optional)</span>
          <input
            value={label}
            className="maia-input"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="maia-session-01"
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
          {busy ? <><span className="spin-ring" aria-hidden="true" /> Analyzing...</> : <><GitBranch size={16} /> Start Ingestion</>}
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
            Use current workspace
          </button>
        )}
      </div>
    </form>
  );
}
