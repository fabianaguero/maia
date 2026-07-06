import { FolderOpen, ScrollText } from "lucide-react";

import type { RepositorySourceKind } from "../../../types/library";

interface ImportRepositorySourcePathFieldProps {
  sourceKind: RepositorySourceKind;
  sourcePath: string;
  sourcePathFieldCopy: {
    label: string;
    placeholder: string;
  };
  busy: boolean;
  pickerBusy: boolean;
  pickerBusyLabel: string;
  onSourcePathChange: (value: string) => void;
  onBrowseDirectory: () => void;
  onBrowseFile: () => void;
}

export function ImportRepositorySourcePathField({
  sourceKind,
  sourcePath,
  sourcePathFieldCopy,
  busy,
  pickerBusy,
  pickerBusyLabel,
  onSourcePathChange,
  onBrowseDirectory,
  onBrowseFile,
}: ImportRepositorySourcePathFieldProps) {
  return (
    <label className="field maia-field">
      <span className="field-label">{sourcePathFieldCopy.label}</span>
      <div className="field-input-wrapper">
        <input
          value={sourcePath}
          className="maia-input"
          onChange={(event) => onSourcePathChange(event.target.value)}
          placeholder={sourcePathFieldCopy.placeholder}
        />
        {sourceKind === "directory" && (
          <button
            type="button"
            className="input-inline-action"
            disabled={busy || pickerBusy}
            onClick={onBrowseDirectory}
          >
            {pickerBusy ? pickerBusyLabel : <FolderOpen size={16} />}
          </button>
        )}
        {sourceKind === "file" && (
          <button
            type="button"
            className="input-inline-action"
            disabled={busy || pickerBusy}
            onClick={onBrowseFile}
          >
            {pickerBusy ? pickerBusyLabel : <ScrollText size={16} />}
          </button>
        )}
      </div>
    </label>
  );
}
