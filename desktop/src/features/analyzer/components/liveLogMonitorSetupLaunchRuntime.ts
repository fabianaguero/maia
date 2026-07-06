import type { ComponentProps } from "react";

import { MUTATION_PROFILES, STYLE_PROFILES } from "../../../config/liveProfiles";
import { getStreamAdapterLabel } from "../../../utils/streamAdapter";
import { type LiveLogMonitorLaunchPanel } from "./LiveLogMonitorLaunchPanel";
import type { LiveLogMonitorSetupSectionInput } from "./liveLogMonitorSetupSectionTypes";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";

export function resolveForcedLiveMutationStateDetail(
  forcedLiveMutationState: ForcedLiveMutationState,
  t: LiveLogMonitorSetupSectionInput["t"],
): string {
  if (forcedLiveMutationState === "normal") {
    return t.inspect.forcedStateNormal;
  }
  if (forcedLiveMutationState === "warning") {
    return t.inspect.forcedStateWarning;
  }
  if (forcedLiveMutationState === "critical") {
    return t.inspect.forcedStateCritical;
  }
  return t.inspect.liveLogDriven;
}

export function buildLiveLogMonitorLaunchPanelProps(
  input: Pick<
    LiveLogMonitorSetupSectionInput,
    | "t"
    | "adapterKind"
    | "adapterDescription"
    | "adapterTarget"
    | "selectedStyleProfileId"
    | "selectedMutationProfileId"
    | "selectedStyleProfile"
    | "selectedMutationProfile"
    | "forcedLiveMutationState"
    | "hasBaseListeningBed"
    | "baseTrackCount"
    | "adapterConfigured"
    | "cueEnginePreviewLabel"
    | "liveMutationStateLabel"
    | "error"
    | "isStarting"
    | "setAdapterKind"
    | "setSelectedStyleProfileId"
    | "setSelectedMutationProfileId"
    | "setForcedLiveMutationState"
    | "onStart"
  >,
): ComponentProps<typeof LiveLogMonitorLaunchPanel> {
  return {
    adapterKind: input.adapterKind,
    adapterLabel: getStreamAdapterLabel(input.adapterKind),
    adapterDescription: input.adapterDescription,
    adapterTarget: input.adapterTarget,
    fileTailLabel: input.t.library.fileTail,
    selectedStyleProfileId: input.selectedStyleProfileId,
    selectedMutationProfileId: input.selectedMutationProfileId,
    selectedStyleLabel: input.selectedStyleProfile.label,
    selectedMutationLabel: input.selectedMutationProfile.label,
    selectedStyleDescription: input.selectedStyleProfile.description,
    selectedMutationDescription: input.selectedMutationProfile.description,
    styleOptions: STYLE_PROFILES.map((profile) => ({
      id: profile.id,
      label: profile.label,
    })),
    mutationOptions: MUTATION_PROFILES.map((profile) => ({
      id: profile.id,
      label: profile.label,
    })),
    forcedLiveMutationState: input.forcedLiveMutationState,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseBedStatusLabel: input.hasBaseListeningBed
      ? `${input.baseTrackCount} ${input.t.library.sounds.toLowerCase()}${input.baseTrackCount === 1 ? "" : "s"} ${input.t.session.armed.toLowerCase()}`
      : input.t.inspect.recommended,
    adapterConfigured: input.adapterConfigured,
    cueEnginePreviewLabel: input.cueEnginePreviewLabel,
    liveMutationStateLabel: input.liveMutationStateLabel,
    forcedStateDetail: resolveForcedLiveMutationStateDetail(input.forcedLiveMutationState, input.t),
    isStarting: input.isStarting,
    error: input.error,
    labels: {
      signalFeedTitle: input.t.inspect.signalFeedTitle,
      weekOnePipeline: input.t.inspect.weekOnePipeline,
      targetLabel: input.t.inspect.targetLabel,
      sceneLaunchTitle: input.t.inspect.sceneLaunchTitle,
      styleProfileTitle: input.t.inspect.styleProfileTitle,
      mutationProfileTitle: input.t.inspect.mutationProfileTitle,
      auditionOverrideTitle: input.t.inspect.auditionOverrideTitle,
      auditionAuto: input.t.inspect.auditionAuto,
      auditionNormal: input.t.inspect.auditionNormal,
      auditionWarning: input.t.inspect.auditionWarning,
      auditionCritical: input.t.inspect.auditionCritical,
      baseBedLabel: input.t.session.baseBed,
      sourceFeedLabel: input.t.session.sourceFeed,
      cueEngineLabel: input.t.inspect.cueEngineLabel,
      ready: input.t.inspect.ready,
      needsConfig: input.t.inspect.needsConfig,
      recommended: input.t.inspect.recommended,
      synthOnlyHint: input.t.inspect.synthOnlyHint,
      auditionOverridePrefix: input.t.inspect.auditionOverridePrefix,
      liveLogDriven: input.t.inspect.liveLogDriven,
      forcedStateNormal: input.t.inspect.forcedStateNormal,
      forcedStateWarning: input.t.inspect.forcedStateWarning,
      forcedStateCritical: input.t.inspect.forcedStateCritical,
      startMonitor: input.t.inspect.startMonitor,
      starting: input.t.inspect.starting,
      feedTarget: input.t.inspect.feedTarget,
      configureFeedBeforeStart: input.t.inspect.configureFeedBeforeStart,
    },
    onChangeAdapterKind: (value) => input.setAdapterKind(value as typeof input.adapterKind),
    onChangeStyleProfileId: input.setSelectedStyleProfileId,
    onChangeMutationProfileId: input.setSelectedMutationProfileId,
    onChangeForcedState: input.setForcedLiveMutationState,
    onStart: input.onStart,
  };
}
