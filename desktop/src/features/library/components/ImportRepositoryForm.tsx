import type { FormEvent } from "react";
import { useState } from "react";

import { pickRepositoryDirectory } from "../../../api/repositories";
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
    label: "Filesystem",
    help: "Import a local project directory for direct heuristics.",
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
      setError("A local directory or GitHub URL is required.");
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

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>Import code project</h2>
          <p className="support-copy">
            Accept either a local project directory or a GitHub URL to start repo BPM intake.
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
        <span>{sourceKind === "directory" ? "Project path" : "GitHub URL"}</span>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder={
            sourceKind === "directory"
              ? "/home/faguero/dev/maia"
              : "https://github.com/fabianaguero/maia"
          }
        />
      </label>

      {sourceKind === "directory" ? (
        <p className="field-hint">
          Browse uses the native Linux folder picker when the desktop shell is
          available.
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
            {pickerBusy ? "Browsing..." : "Browse folder"}
          </button>
        ) : null}
        <button type="submit" className="action" disabled={busy}>
          {busy ? "Analyzing..." : "Import repository"}
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
