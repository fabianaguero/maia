import { useT } from "../../i18n/I18nContext";
import { ConnectionsCloudFields } from "./ConnectionsCloudFields";
import { ConnectionsFileFields } from "./ConnectionsFileFields";
import { ConnectionsFormActions } from "./ConnectionsFormActions";
import { ConnectionsKindSelector } from "./ConnectionsKindSelector";
import { ConnectionsSonarQubeFields } from "./ConnectionsSonarQubeFields";
import {
  buildConnectionsFormViewModel,
  type ConnectionDraft,
  type ConnectionKind,
} from "./connectionsViewModel";

interface ConnectionsFormPanelProps {
  editingConnectionId: string | null;
  draft: ConnectionDraft;
  saving: boolean;
  loading: boolean;
  pickerBusy: boolean;
  error: string | null;
  onKindChange: (kind: ConnectionKind) => void;
  onDraftChange: (patch: Partial<ConnectionDraft>) => void;
  onBrowseFile: () => void | Promise<void>;
  onSaveConnection: () => void | Promise<void>;
  onCancelEdit: () => void;
}

export function ConnectionsFormPanel({
  editingConnectionId,
  draft,
  saving,
  loading,
  pickerBusy,
  error,
  onKindChange,
  onDraftChange,
  onBrowseFile,
  onSaveConnection,
  onCancelEdit,
}: ConnectionsFormPanelProps) {
  const t = useT();
  const viewModel = buildConnectionsFormViewModel({
    draft,
    editingConnectionId,
    saving,
    t,
  });

  const renderFieldsByKind = () => {
    if (viewModel.isFileLog) {
      return (
        <ConnectionsFileFields
          draft={draft}
          saving={saving}
          pickerBusy={pickerBusy}
          t={t}
          onDraftChange={onDraftChange}
          onBrowseFile={onBrowseFile}
        />
      );
    }
    if (draft.kind === "sonarqube") {
      return <ConnectionsSonarQubeFields draft={draft} t={t} onDraftChange={onDraftChange} />;
    }
    return <ConnectionsCloudFields draft={draft} t={t} onDraftChange={onDraftChange} />;
  };

  return (
    <section className="panel connections-panel">
      <div className="form-intro">
        <h3>{viewModel.title}</h3>
        <p className="support-copy">{viewModel.help}</p>
      </div>

      <ConnectionsKindSelector
        ariaLabel={t.simpleMode.connections.connectionKindAria}
        options={viewModel.kindOptions}
        onKindChange={onKindChange}
      />

      <div className="form-fields-section">
        {renderFieldsByKind()}

        <label className="field maia-field">
          <span className="field-label">{t.simpleMode.connections.connectionLabel}</span>
          <input
            value={draft.label}
            className="maia-input"
            onChange={(event) => onDraftChange({ label: event.target.value })}
            placeholder={viewModel.labelPlaceholder}
          />
        </label>
      </div>

      {error ? (
        <div className="form-notice error">
          <span>{error}</span>
        </div>
      ) : null}

      <ConnectionsFormActions
        primaryActionLabel={viewModel.primaryActionLabel}
        cancelLabel={t.simpleMode.connections.cancel}
        canCancel={editingConnectionId !== null}
        saving={saving}
        loading={loading}
        onSaveConnection={onSaveConnection}
        onCancelEdit={onCancelEdit}
      />
    </section>
  );
}
