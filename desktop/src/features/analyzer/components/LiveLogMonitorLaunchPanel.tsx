import { LiveLogMonitorSceneLaunchCard } from "./LiveLogMonitorSceneLaunchCard";
import { LiveLogMonitorSignalFeedCard } from "./LiveLogMonitorSignalFeedCard";
import type { LiveLogMonitorLaunchPanelProps } from "./liveLogMonitorLaunchPanelTypes";

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
      <LiveLogMonitorSignalFeedCard
        adapterKind={adapterKind}
        adapterLabel={adapterLabel}
        adapterDescription={adapterDescription}
        adapterTarget={adapterTarget}
        fileTailLabel={fileTailLabel}
        labels={labels}
        onChangeAdapterKind={onChangeAdapterKind}
      />

      <LiveLogMonitorSceneLaunchCard
        selectedStyleProfileId={selectedStyleProfileId}
        selectedMutationProfileId={selectedMutationProfileId}
        selectedStyleLabel={selectedStyleLabel}
        selectedMutationLabel={selectedMutationLabel}
        selectedStyleDescription={selectedStyleDescription}
        selectedMutationDescription={selectedMutationDescription}
        styleOptions={styleOptions}
        mutationOptions={mutationOptions}
        forcedLiveMutationState={forcedLiveMutationState}
        hasBaseListeningBed={hasBaseListeningBed}
        baseBedStatusLabel={baseBedStatusLabel}
        adapterConfigured={adapterConfigured}
        cueEnginePreviewLabel={cueEnginePreviewLabel}
        liveMutationStateLabel={liveMutationStateLabel}
        forcedStateDetail={forcedStateDetail}
        isStarting={isStarting}
        adapterTarget={adapterTarget}
        labels={labels}
        onChangeStyleProfileId={onChangeStyleProfileId}
        onChangeMutationProfileId={onChangeMutationProfileId}
        onChangeForcedState={onChangeForcedState}
        onStart={onStart}
      />

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
