import type { AppTranslations } from "../../i18n/types";

import type { ConnectionDraft } from "./connectionsViewModel";

interface ConnectionsCloudFieldsProps {
  draft: ConnectionDraft;
  t: AppTranslations;
  onDraftChange: (patch: Partial<ConnectionDraft>) => void;
}

export function ConnectionsCloudFields({ draft, t, onDraftChange }: ConnectionsCloudFieldsProps) {
  return (
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
  );
}
