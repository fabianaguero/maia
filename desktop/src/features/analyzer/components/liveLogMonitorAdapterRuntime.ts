import type { RepositoryAnalysis, StreamAdapterKind } from "../../../types/library";
import { getStreamAdapterDescription, getStreamAdapterLabel } from "../../../utils/streamAdapter";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";

export function resolveLiveMutationStateLabel(state: LiveMutationState): string {
  switch (state) {
    case "critical":
      return "Critical tension";
    case "warning":
      return "Warning pressure";
    default:
      return "Normal drift";
  }
}

export function resolveCueEnginePreviewLabel(input: {
  hasBaseListeningBed: boolean;
  sampleStatus: "unavailable" | "loading" | "ready" | "error";
  liveMutationStateLabel: string;
  sampleSourceCount: number;
}): string {
  const { hasBaseListeningBed, sampleStatus, liveMutationStateLabel, sampleSourceCount } = input;

  if (hasBaseListeningBed) {
    return sampleStatus === "ready"
      ? `Guide-track modulation + samples · ${liveMutationStateLabel}`
      : `Guide-track modulation · ${liveMutationStateLabel}`;
  }

  if (sampleStatus === "ready") {
    return sampleSourceCount > 1
      ? `Base sample pack · ${liveMutationStateLabel}`
      : `Base sample · ${liveMutationStateLabel}`;
  }

  if (sampleStatus === "loading") {
    return `Loading sample · ${liveMutationStateLabel}`;
  }

  return `Internal synth · ${liveMutationStateLabel}`;
}

export function buildLiveLogMonitorAdapterState(input: {
  repository: RepositoryAnalysis;
  repositoryId: string;
  adapterKind: StreamAdapterKind;
  sessionRepoId: string | null;
  sessionAdapterKind: StreamAdapterKind | null;
}) {
  const activeAdapterKind =
    input.sessionRepoId === input.repositoryId
      ? (input.sessionAdapterKind ?? input.adapterKind)
      : input.adapterKind;

  return {
    activeAdapterKind,
    activeAdapterLabel: getStreamAdapterLabel(activeAdapterKind),
    adapterDescription: getStreamAdapterDescription(input.adapterKind),
    adapterTarget: input.repository.sourcePath,
  };
}
