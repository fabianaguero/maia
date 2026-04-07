import { FolderOpen, GitBranch, ScrollText } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  pickRepositoryDirectory,
  pickRepositoryFile,
} from "../../../api/repositories";
import type {
  ImportRepositoryInput,
  RepositorySourceKind,
} from "../../../types/library";

interface ImportRepositoryFormProps {
  busy: boolean;
  defaultDirectoryPath?: string;
  onImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
}

const importModes: Array<{
  id: RepositorySourceKind;
  label: string;
  help: string;
}> = [
  {
    id: "directory",
    label: "Code project",
    help: "Import a local project directory into a managed Maia snapshot.",
  },
  {
    id: "file",
    label: "Log file",
    help: "Import a local log file and derive a musical/operational signal profile.",
  },
  {
    id: "url",
    label: "GitHub URL",
    help: "Register a remote repo reference for metadata-only intake.",
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
  const [error, setError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPath = sourcePath.trim();
    if (!normalizedPath) {
      setError("A local code/log path or GitHub URL is required.");
      return;
    }

    setError(null);
    const imported = await onImportRepository({
      sourceKind,
      sourcePath: normalizedPath,
      label: label.trim() || undefined,
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
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>Import code or logs</h2>
          <p className="support-copy">
            Accept a local project directory, a local log file, or a GitHub URL to start code/log
            signal intake.
          </p>
        </div>
      </div>

      <div className="mode-toggle" role="tablist" aria-label="Repository import type">
        {importModes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`toggle-chip${mode.id === sourceKind ? " active" : ""}`}
            onClick={() => setSourceKind(mode.id)}
          >
            <span>{mode.label}</span>
            <small>{mode.help}</small>
          </button>
        ))}
      </div>

      <label className="field">
        <span>
          {sourceKind === "directory"
            ? "Project path"
            : sourceKind === "file"
              ? "Log file path"
              : "GitHub URL"}
        </span>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder={
            sourceKind === "directory"
              ? "/home/faguero/dev/maia"
              : sourceKind === "file"
                ? "~/logs/app.log"
              : "https://github.com/fabianaguero/maia"
          }
        />
      </label>

      {sourceKind === "directory" ? (
        <p className="field-hint">
          Browse uses the native Linux folder picker when the desktop shell is
          available. In Tauri, Maia snapshots the selected directory before analysis.
        </p>
      ) : null}

      {sourceKind === "file" ? (
        <p className="field-hint">
          Browse uses the native file picker when the desktop shell is available. In Tauri, Maia
          snapshots the selected log file for baseline analysis, then the analyzer screen can also
          run a live internal tail against the original file as it grows.
        </p>
      ) : null}

      <label className="field">
        <span>Optional label</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="maia workspace"
        />
      </label>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        {sourceKind === "directory" ? (
          <button
            type="button"
            className="secondary-action"
            disabled={busy || pickerBusy}
            onClick={() => void handleBrowseDirectory()}
          >
            {pickerBusy ? <><span className="spin-ring" aria-hidden="true" /> Browsing...</> : <><FolderOpen size={14} /> Browse folder</>}
          </button>
        ) : null}
        {sourceKind === "file" ? (
          <button
            type="button"
            className="secondary-action"
            disabled={busy || pickerBusy}
            onClick={() => void handleBrowseFile()}
          >
            {pickerBusy ? <><span className="spin-ring" aria-hidden="true" /> Browsing...</> : <><ScrollText size={14} /> Browse log file</>}
          </button>
        ) : null}
        <button type="submit" className="action" disabled={busy}>
          {busy ? <><span className="spin-ring" aria-hidden="true" /> Analyzing...</> : <><GitBranch size={14} /> Import source</>}
        </button>
        {defaultDirectoryPath ? (
          <button
            type="button"
            className="secondary-action"
            disabled={busy}
            onClick={() => {
              setSourceKind("directory");
              setSourcePath(defaultDirectoryPath);
            }}
          >
            Use current workspace
          </button>
        ) : null}
      </div>
    </form>
  );
}
