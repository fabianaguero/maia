interface LaunchOption {
  id: string;
  label: string;
}

interface LiveLogMonitorLaunchPanelLabels {
  signalFeedTitle: string;
  weekOnePipeline: string;
  targetLabel: string;
  sceneLaunchTitle: string;
  styleProfileTitle: string;
  mutationProfileTitle: string;
  auditionOverrideTitle: string;
  auditionAuto: string;
  auditionNormal: string;
  auditionWarning: string;
  auditionCritical: string;
  baseBedLabel: string;
  sourceFeedLabel: string;
  cueEngineLabel: string;
  ready: string;
  needsConfig: string;
  recommended: string;
  synthOnlyHint: string;
  auditionOverridePrefix: string;
  liveLogDriven: string;
  forcedStateNormal: string;
  forcedStateWarning: string;
  forcedStateCritical: string;
  startMonitor: string;
  starting: string;
  feedTarget: string;
  configureFeedBeforeStart: string;
  errorPrefix?: string;
}

interface LiveLogMonitorLaunchPanelProps {
  adapterKind: string;
  adapterLabel: string;
  adapterDescription: string;
  adapterTarget: string;
  fileTailLabel: string;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  selectedStyleLabel: string;
  selectedMutationLabel: string;
  selectedStyleDescription: string;
  selectedMutationDescription: string;
  styleOptions: LaunchOption[];
  mutationOptions: LaunchOption[];
  forcedLiveMutationState: "auto" | "normal" | "warning" | "critical";
  hasBaseListeningBed: boolean;
  baseBedStatusLabel: string;
  adapterConfigured: boolean;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  forcedStateDetail: string;
  isStarting: boolean;
  error: string | null;
  labels: LiveLogMonitorLaunchPanelLabels;
  onChangeAdapterKind: (value: string) => void;
  onChangeStyleProfileId: (value: string) => void;
  onChangeMutationProfileId: (value: string) => void;
  onChangeForcedState: (value: "auto" | "normal" | "warning" | "critical") => void;
  onStart: () => void | Promise<void>;
}

export function LiveLogMonitorLaunchPanel({
  adapterKind,
  adapterLabel,
  adapterDescription,
  adapterTarget,
  fileTailLabel,
  selectedStyleProfileId,
  selectedMutationProfileId,
  selectedStyleLabel,
  selectedMutationLabel,
  selectedStyleDescription,
  selectedMutationDescription,
  styleOptions,
  mutationOptions,
  forcedLiveMutationState,
  hasBaseListeningBed,
  baseBedStatusLabel,
  adapterConfigured,
  cueEnginePreviewLabel,
  liveMutationStateLabel,
  forcedStateDetail,
  isStarting,
  error,
  labels,
  onChangeAdapterKind,
  onChangeStyleProfileId,
  onChangeMutationProfileId,
  onChangeForcedState,
  onStart,
}: LiveLogMonitorLaunchPanelProps) {
  return (
    <>
      <div className="audio-path-card monitor-setup-card">
        <span>{labels.signalFeedTitle}</span>
        <strong>{adapterLabel}</strong>
        <p className="support-copy">{adapterDescription}</p>
        <div className="monitor-setup-stack">
          <select
            className="compact-select"
            value={adapterKind}
            onChange={(event) => onChangeAdapterKind(event.target.value)}
            disabled
          >
            <option value="file">{fileTailLabel}</option>
          </select>
          <p className="support-copy">{labels.weekOnePipeline}</p>
          <div className="monitor-source-summary">
            <small>{labels.targetLabel}</small>
            <strong>{adapterTarget}</strong>
          </div>
        </div>
      </div>

      <div className="audio-path-card monitor-setup-card">
        <span>{labels.sceneLaunchTitle}</span>
        <strong>
          {selectedStyleLabel} · {selectedMutationLabel}
        </strong>
        <p className="support-copy">
          {selectedStyleDescription} {selectedMutationDescription}
        </p>
        <div className="monitor-setup-stack">
          <select
            className="compact-select"
            value={selectedStyleProfileId}
            onChange={(event) => onChangeStyleProfileId(event.target.value)}
            title={labels.styleProfileTitle}
          >
            {styleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="compact-select"
            value={selectedMutationProfileId}
            onChange={(event) => onChangeMutationProfileId(event.target.value)}
            title={labels.mutationProfileTitle}
          >
            {mutationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="compact-select"
            value={forcedLiveMutationState}
            onChange={(event) =>
              onChangeForcedState(
                event.target.value as "auto" | "normal" | "warning" | "critical",
              )
            }
            title={labels.auditionOverrideTitle}
          >
            <option value="auto">{labels.auditionAuto}</option>
            <option value="normal">{labels.auditionNormal}</option>
            <option value="warning">{labels.auditionWarning}</option>
            <option value="critical">{labels.auditionCritical}</option>
          </select>
          <ul className="monitor-readiness-list">
            <li className="monitor-readiness-item">
              <span>{labels.baseBedLabel}</span>
              <strong className={`monitor-readiness-state${hasBaseListeningBed ? " ready" : ""}`}>
                {baseBedStatusLabel}
              </strong>
            </li>
            <li className="monitor-readiness-item">
              <span>{labels.sourceFeedLabel}</span>
              <strong className={`monitor-readiness-state${adapterConfigured ? " ready" : ""}`}>
                {adapterConfigured ? labels.ready : labels.needsConfig}
              </strong>
            </li>
            <li className="monitor-readiness-item">
              <span>{labels.cueEngineLabel}</span>
              <strong className="monitor-readiness-state ready">{cueEnginePreviewLabel}</strong>
            </li>
          </ul>
          {!hasBaseListeningBed ? <p className="monitor-empty-hint">{labels.synthOnlyHint}</p> : null}
          <p className="support-copy">
            {labels.auditionOverridePrefix}{" "}
            {forcedLiveMutationState === "auto" ? labels.liveLogDriven : liveMutationStateLabel}
          </p>
          <p className="support-copy">{forcedStateDetail}</p>
          <div className="monitor-launch-row">
            <button
              type="button"
              className="action"
              disabled={isStarting || !adapterConfigured}
              onClick={() => void onStart()}
            >
              {isStarting ? (
                <>
                  <span className="spin-ring" aria-hidden="true" /> {labels.starting}
                </>
              ) : (
                labels.startMonitor
              )}
            </button>
            <small>
              {adapterConfigured
                ? labels.feedTarget.replace("{target}", adapterTarget)
                : labels.configureFeedBeforeStart}
            </small>
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(255,0,0,0.1)",
            border: "1px solid #f44",
            borderRadius: "4px",
            margin: "10px",
            color: "#f44",
            fontSize: "0.85rem",
          }}
        >
          {labels.errorPrefix ? `${labels.errorPrefix}: ${error}` : error}
        </div>
      ) : null}
    </>
  );
}
