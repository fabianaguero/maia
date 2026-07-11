import type { AppTranslations } from "../../i18n/types";

import type { ConnectionDraft } from "./connectionsViewModel";

interface ConnectionsSonarQubeFieldsProps {
  draft: ConnectionDraft;
  t: AppTranslations;
  onDraftChange: (patch: Partial<ConnectionDraft>) => void;
}

export function ConnectionsSonarQubeFields({
  draft,
  t,
  onDraftChange,
}: ConnectionsSonarQubeFieldsProps) {
  return (
    <>
      <label className="field maia-field">
        <span className="field-label">{t.simpleMode.streamInput.sonarqubeServerUrl}</span>
        <input
          value={draft.sonarqubeApiUrl}
          className="maia-input"
          onChange={(event) => onDraftChange({ sonarqubeApiUrl: event.target.value })}
          placeholder="https://sonarqube.example.com"
        />
        <span className="support-copy">
          {t.simpleMode.streamInput.sonarqubeServerUrlHelp}
        </span>
      </label>

      <label className="field maia-field">
        <span className="field-label">{t.simpleMode.streamInput.sonarqubeProjectKey}</span>
        <input
          value={draft.sonarqubeProjectKey}
          className="maia-input"
          onChange={(event) => onDraftChange({ sonarqubeProjectKey: event.target.value })}
          placeholder="org.example:my-service"
        />
        <span className="support-copy">
          {t.simpleMode.streamInput.sonarqubeProjectKeyHelp}
        </span>
      </label>

      <label className="field maia-field">
        <span className="field-label">{t.simpleMode.streamInput.sonarqubeAuthToken}</span>
        <input
          type="password"
          value={draft.sonarqubeAuthToken}
          className="maia-input"
          onChange={(event) => onDraftChange({ sonarqubeAuthToken: event.target.value })}
          placeholder="squ_xxxxxxxxxxxx"
        />
        <span className="support-copy">
          {t.simpleMode.streamInput.sonarqubeAuthTokenHelp}
        </span>
      </label>

      <label className="field maia-field">
        <span className="field-label">{t.simpleMode.streamInput.sonarqubePollingInterval}</span>
        <select
          value={draft.sonarqubePollingInterval}
          className="maia-input"
          onChange={(event) => onDraftChange({ sonarqubePollingInterval: event.target.value })}
        >
          <option value="30">30 seconds</option>
          <option value="60">1 minute</option>
          <option value="300">5 minutes</option>
          <option value="900">15 minutes</option>
        </select>
      </label>
    </>
  );
}
