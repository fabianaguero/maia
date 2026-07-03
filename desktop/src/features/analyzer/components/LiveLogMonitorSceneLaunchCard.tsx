import type { LiveLogMonitorLaunchPanelProps } from "./liveLogMonitorLaunchPanelTypes";

type Props = Pick<
  LiveLogMonitorLaunchPanelProps,
  | "selectedStyleProfileId"
  | "selectedMutationProfileId"
  | "selectedStyleLabel"
  | "selectedMutationLabel"
  | "selectedStyleDescription"
  | "selectedMutationDescription"
  | "styleOptions"
  | "mutationOptions"
  | "forcedLiveMutationState"
  | "hasBaseListeningBed"
  | "baseBedStatusLabel"
  | "adapterConfigured"
  | "cueEnginePreviewLabel"
  | "liveMutationStateLabel"
  | "forcedStateDetail"
  | "isStarting"
  | "adapterTarget"
  | "labels"
  | "onChangeStyleProfileId"
  | "onChangeMutationProfileId"
  | "onChangeForcedState"
  | "onStart"
>;

export function LiveLogMonitorSceneLaunchCard({
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
  adapterTarget,
  labels,
  onChangeStyleProfileId,
  onChangeMutationProfileId,
  onChangeForcedState,
  onStart,
}: Props) {
  return (
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
            onChangeForcedState(event.target.value as "auto" | "normal" | "warning" | "critical")
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
  );
}
