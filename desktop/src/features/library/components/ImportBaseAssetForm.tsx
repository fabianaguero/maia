import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { pickBaseAssetPath } from "../../../api/baseAssets";
import type { BaseAssetCategoryOption } from "../../../types/baseAsset";
import type {
  BaseAssetSourceKind,
  ImportBaseAssetInput,
} from "../../../types/library";

interface ImportBaseAssetFormProps {
  busy: boolean;
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultCategoryId?: string;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
}

const sourceModes: Array<{
  id: BaseAssetSourceKind;
  label: string;
  help: string;
}> = [
  {
    id: "file",
    label: "Single file",
    help: "Register one reusable source file by reference.",
  },
  {
    id: "directory",
    label: "Folder pack",
    help: "Register a reusable folder or collection by reference.",
  },
];

function deriveLabel(sourcePath: string): string {
  return sourcePath.trim().split(/[\\/]/).pop() ?? "Base asset";
}

export function ImportBaseAssetForm({
  busy,
  baseAssetCategories,
  defaultCategoryId,
  onImportBaseAsset,
}: ImportBaseAssetFormProps) {
  const fallbackCategoryId = defaultCategoryId ?? baseAssetCategories[0]?.id ?? "";
  const [sourceKind, setSourceKind] = useState<BaseAssetSourceKind>("directory");
  const [sourcePath, setSourcePath] = useState("");
  const [label, setLabel] = useState("");
  const [categoryId, setCategoryId] = useState(fallbackCategoryId);
  const [reusable, setReusable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  useEffect(() => {
    if (!baseAssetCategories.some((category) => category.id === categoryId)) {
      setCategoryId(fallbackCategoryId);
    }
  }, [baseAssetCategories, categoryId, fallbackCategoryId]);

  const selectedCategory =
    baseAssetCategories.find((category) => category.id === categoryId) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPath = sourcePath.trim();
    if (!normalizedPath) {
      setError("A file or directory path is required.");
      return;
    }

    if (!categoryId.trim()) {
      setError("Select a base asset category before importing.");
      return;
    }

    setError(null);
    const imported = await onImportBaseAsset({
      sourceKind,
      sourcePath: normalizedPath,
      label: label.trim() || deriveLabel(normalizedPath),
      categoryId: categoryId.trim(),
      reusable,
    });

    if (imported) {
      setSourcePath("");
      setLabel("");
      setReusable(true);
      setCategoryId(fallbackCategoryId);
    }
  }

  async function handleBrowse(): Promise<void> {
    setPickerBusy(true);
    setError(null);

    try {
      const pickedPath = await pickBaseAssetPath(sourceKind, sourcePath);
      if (!pickedPath) {
        return;
      }

      setSourcePath(pickedPath);
      setLabel((current) => current.trim() || deriveLabel(pickedPath));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Native base asset picker failed. Enter the path manually.",
      );
    } finally {
      setPickerBusy(false);
    }
  }

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>Register base asset</h2>
          <p className="support-copy">
            Catalog reusable files or folders as local base assets for future
            composition workflows.
          </p>
        </div>
      </div>

      <div className="mode-toggle" role="tablist" aria-label="Base asset source type">
        {sourceModes.map((mode) => (
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
        <span>Category</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={busy || baseAssetCategories.length === 0}
        >
          {baseAssetCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      {selectedCategory ? (
        <div className="style-preview">
          <strong>{selectedCategory.label}</strong>
          <p>{selectedCategory.description}</p>
        </div>
      ) : null}

      <label className="field">
        <span>{sourceKind === "directory" ? "Folder path" : "File path"}</span>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder={
            sourceKind === "directory"
              ? "~/Music/base-packs/melodic-house"
              : "~/Music/base-packs/kicks/solid-kick.wav"
          }
        />
      </label>

      <label className="field">
        <span>Display label</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Peak-time FX pack"
        />
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={reusable}
          onChange={(event) => setReusable(event.target.checked)}
        />
        <span>Mark as reusable in future composition flows</span>
      </label>

      <p className="field-hint">
        MVP stores base assets by reference to the current local path instead of
        copying them into managed Maia storage.
      </p>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-action"
          disabled={busy || pickerBusy}
          onClick={() => void handleBrowse()}
        >
          {pickerBusy ? "Browsing..." : sourceKind === "directory" ? "Browse folder" : "Browse file"}
        </button>
        <button type="submit" className="action" disabled={busy}>
          {busy ? "Registering..." : "Register base asset"}
        </button>
      </div>
    </form>
  );
}
