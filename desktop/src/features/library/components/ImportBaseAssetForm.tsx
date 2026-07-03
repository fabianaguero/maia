import { FolderOpen, PackagePlus } from "lucide-react";
import type { BaseAssetCategoryOption } from "../../../types/baseAsset";
import type { ImportBaseAssetInput } from "../../../types/library";
import { useImportBaseAssetFormController } from "./useImportBaseAssetFormController";

interface ImportBaseAssetFormProps {
  busy: boolean;
  baseAssetCategories: BaseAssetCategoryOption[];
  defaultCategoryId?: string;
  onImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
}

export function ImportBaseAssetForm({
  busy,
  baseAssetCategories,
  defaultCategoryId,
  onImportBaseAsset,
}: ImportBaseAssetFormProps) {
  const {
    t,
    sourceModes,
    sourceKind,
    setSourceKind,
    sourcePath,
    setSourcePath,
    label,
    setLabel,
    categoryId,
    setCategoryId,
    reusable,
    setReusable,
    error,
    pickerBusy,
    handleSubmit,
    handleBrowse,
    selectedCategory,
  } = useImportBaseAssetFormController({
    baseAssetCategories,
    defaultCategoryId,
    onImportBaseAsset,
  });

  return (
    <form className="import-form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-header compact">
        <div>
          <h2>{t.library.forms.baseAsset.title}</h2>
          <p className="support-copy">{t.library.forms.baseAsset.description}</p>
        </div>
      </div>

      <div
        className="mode-toggle"
        role="tablist"
        aria-label={t.library.forms.baseAsset.sourceTypeAria}
      >
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
        <span>{t.library.forms.baseAsset.category}</span>
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
        <span>
          {sourceKind === "directory"
            ? t.library.forms.baseAsset.folderPath
            : t.library.forms.baseAsset.filePath}
        </span>
        <input
          value={sourcePath}
          onChange={(event) => setSourcePath(event.target.value)}
          placeholder={
            sourceKind === "directory"
              ? t.library.forms.baseAsset.folderPathPlaceholder
              : t.library.forms.baseAsset.filePathPlaceholder
          }
        />
      </label>

      <label className="field">
        <span>{t.library.forms.baseAsset.displayLabel}</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={t.library.forms.baseAsset.displayLabelPlaceholder}
        />
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={reusable}
          onChange={(event) => setReusable(event.target.checked)}
        />
        <span>{t.library.forms.baseAsset.markReusable}</span>
      </label>

      <p className="field-hint">{t.library.forms.baseAsset.hint}</p>

      {error ? <p className="inline-error">{error}</p> : null}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-action"
          disabled={busy || pickerBusy}
          onClick={() => void handleBrowse()}
        >
          {pickerBusy ? (
            <>
              <span className="spin-ring" aria-hidden="true" /> {t.library.forms.baseAsset.browsing}
            </>
          ) : (
            <>
              <FolderOpen size={14} />{" "}
              {sourceKind === "directory"
                ? t.library.forms.baseAsset.browseFolder
                : t.library.forms.baseAsset.browseFile}
            </>
          )}
        </button>
        <button type="submit" className="action" disabled={busy}>
          {busy ? (
            <>
              <span className="spin-ring" aria-hidden="true" />{" "}
              {t.library.forms.baseAsset.registering}
            </>
          ) : (
            <>
              <PackagePlus size={14} /> {t.library.forms.baseAsset.registerBaseAsset}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
