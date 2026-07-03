import { FolderOpen } from "lucide-react";

import type { AppTranslations } from "../../i18n/types";
import type { ConnectionDraft } from "./connectionsViewModel";

interface ConnectionsFileFieldsProps {
  draft: ConnectionDraft;
  saving: boolean;
  pickerBusy: boolean;
  t: AppTranslations;
  onDraftChange: (patch: Partial<ConnectionDraft>) => void;
  onBrowseFile: () => void | Promise<void>;
}

export function ConnectionsFileFields({
  draft,
  saving,
  pickerBusy,
  t,
  onDraftChange,
  onBrowseFile,
}: ConnectionsFileFieldsProps) {
  return (
    <label className="field maia-field">
      <span className="field-label">{t.simpleMode.connections.logFilePath}</span>
      <div className="field-input-wrapper">
        <input
          value={draft.sourcePath}
          className="maia-input"
          onChange={(event) => onDraftChange({ sourcePath: event.target.value })}
          placeholder={t.simpleMode.connections.filePathPlaceholder}
        />
        <button
          type="button"
          className="input-inline-action"
          disabled={saving || pickerBusy}
          onClick={() => void onBrowseFile()}
        >
          {pickerBusy ? t.simpleMode.connections.loading : <FolderOpen size={16} />}
        </button>
      </div>
    </label>
  );
}
