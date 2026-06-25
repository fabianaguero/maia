import { Cable, FolderOpen, Globe, ScrollText, X } from "lucide-react";

import { useT } from "../../i18n/I18nContext";
import type { ConnectionDraft, ConnectionKind } from "./connectionsViewModel";

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

  return (
    <section className="panel connections-panel">
      <div className="form-intro">
        <h3>
          {editingConnectionId
            ? t.simpleMode.connections.editConnection
            : t.simpleMode.connections.newConnection}
        </h3>
        <p className="support-copy">
          {editingConnectionId
            ? t.simpleMode.connections.editConnectionHelp
            : t.simpleMode.connections.newConnectionHelp}
        </p>
      </div>

      <div
        className="source-card-grid"
        role="tablist"
        aria-label={t.simpleMode.connections.connectionKindAria}
      >
        <button
          type="button"
          className={`source-card ${draft.kind === "file_log" ? "active" : ""}`}
          onClick={() => onKindChange("file_log")}
        >
          <div className="source-card-icon">
            <ScrollText size={24} />
          </div>
          <div className="source-card-content">
            <strong>{t.simpleMode.connections.fileLog}</strong>
            <p>{t.simpleMode.connections.fileLogDescription}</p>
          </div>
        </button>
        <button
          type="button"
          className={`source-card ${draft.kind === "gcp_cloud_run" ? "active" : ""}`}
          onClick={() => onKindChange("gcp_cloud_run")}
        >
          <div className="source-card-icon">
            <Globe size={24} />
          </div>
          <div className="source-card-content">
            <strong>{t.simpleMode.connections.gcpCloudRun}</strong>
            <p>{t.simpleMode.connections.gcpCloudRunDescription}</p>
          </div>
        </button>
      </div>

      <div className="form-fields-section">
        {draft.kind === "file_log" ? (
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
        ) : (
          <>
            <label className="field maia-field">
              <span className="field-label">{t.simpleMode.connections.gcpProjectId}</span>
              <input
                value={draft.gcpProjectId}
                className="maia-input"
                onChange={(event) => onDraftChange({ gcpProjectId: event.target.value })}
                placeholder={t.simpleMode.connections.projectPlaceholder}
              />
            </label>
            <label className="field maia-field">
              <span className="field-label">{t.simpleMode.connections.cloudRunService}</span>
              <input
                value={draft.gcpServiceName}
                className="maia-input"
                onChange={(event) => onDraftChange({ gcpServiceName: event.target.value })}
                placeholder={t.simpleMode.connections.servicePlaceholder}
              />
            </label>
            <label className="field maia-field">
              <span className="field-label">{t.simpleMode.connections.regionOptional}</span>
              <input
                value={draft.gcpRegion}
                className="maia-input"
                onChange={(event) => onDraftChange({ gcpRegion: event.target.value })}
                placeholder={t.simpleMode.connections.regionPlaceholder}
              />
            </label>
            <label className="field maia-field">
              <span className="field-label">{t.simpleMode.connections.streamLookback}</span>
              <input
                value={draft.gcpBackfillFreshness}
                className="maia-input"
                onChange={(event) => onDraftChange({ gcpBackfillFreshness: event.target.value })}
                placeholder={t.simpleMode.connections.lookbackPlaceholder}
              />
              <span className="support-copy">{t.simpleMode.connections.streamLookbackHelp}</span>
            </label>
          </>
        )}

        <label className="field maia-field">
          <span className="field-label">{t.simpleMode.connections.connectionLabel}</span>
          <input
            value={draft.label}
            className="maia-input"
            onChange={(event) => onDraftChange({ label: event.target.value })}
            placeholder={
              draft.kind === "file_log"
                ? t.simpleMode.connections.fileLabelPlaceholder
                : t.simpleMode.connections.cloudLabelPlaceholder
            }
          />
        </label>
      </div>

      {error ? (
        <div className="form-notice error">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="form-actions-footer">
        <button
          type="button"
          className="action primary-launch-btn"
          disabled={saving || loading}
          onClick={() => void onSaveConnection()}
        >
          <Cable size={16} />
          {saving
            ? ` ${t.simpleMode.status.loading}`
            : editingConnectionId
              ? ` ${t.simpleMode.connections.updateConnection}`
              : ` ${t.simpleMode.connections.saveConnection}`}
        </button>
        {editingConnectionId ? (
          <button
            type="button"
            className="card-action-btn"
            disabled={saving}
            onClick={onCancelEdit}
          >
            <X size={14} />
            {t.simpleMode.connections.cancel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
