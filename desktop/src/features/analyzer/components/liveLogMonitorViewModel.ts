import { resolveMutationProfile, resolveStyleProfile } from "../../../config/liveProfiles";
import type {
  BaseTrackPlaylist,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
  StreamAdapterKind,
} from "../../../types/library";
import type { MutationProfileOption, StyleProfileOption } from "../../../types/music";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import { type ReferenceAnchor, resolveLiveSonificationScene } from "./liveSonificationScene";
import {
  buildLiveLogMonitorAdapterState,
  buildLiveLogMonitorExplanationState,
  buildLiveLogMonitorTrackSelectionState,
  resolveCueEnginePreviewLabel,
  resolveLiveMutationStateLabel,
} from "./liveLogMonitorViewModelRuntime";

export type AudioEngineStatus = "idle" | "ready" | "unsupported" | "error";
export type SampleEngineStatus = "unavailable" | "loading" | "ready" | "error";
export type ForcedLiveMutationState = "auto" | LiveMutationState;

export function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected live log monitor failure.";
}

export function preferredBaseAssetId(
  availableBaseAssets: BaseAssetRecord[],
  preferredId?: string | null,
): string {
  if (preferredId && availableBaseAssets.some((entry) => entry.id === preferredId)) {
    return preferredId;
  }

  return (
    availableBaseAssets.find((entry) => entry.reusable)?.id ?? availableBaseAssets[0]?.id ?? ""
  );
}

export function preferredCompositionId(
  availableCompositions: CompositionResultRecord[],
  preferredId?: string | null,
): string {
  if (preferredId && availableCompositions.some((entry) => entry.id === preferredId)) {
    return preferredId;
  }

  return "";
}

export function audioLabel(
  status: AudioEngineStatus,
  liveEnabled: boolean,
  labels: {
    unavailable: string;
    error: string;
    active: string;
    armed: string;
    idle: string;
  },
): string {
  if (status === "unsupported") {
    return labels.unavailable;
  }
  if (status === "error") {
    return labels.error;
  }
  if (liveEnabled && status === "ready") {
    return labels.active;
  }
  if (status === "ready") {
    return labels.armed;
  }
  return labels.idle;
}

export interface LiveLogMonitorViewModelInput {
  repository: RepositoryAnalysis;
  repositoryId: string;
  adapterKind: StreamAdapterKind;
  sessionRepoId: string | null;
  sessionAdapterKind: StreamAdapterKind | null;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  availableTracks: LibraryTrack[];
  basePlaylist: BaseTrackPlaylist | null;
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  backgroundNowPlayingId: string | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
  replayActive: boolean;
  playbackEventIndex: number | null;
  forcedLiveMutationState: ForcedLiveMutationState;
  liveMutationState: LiveMutationState;
  sampleStatus: SampleEngineStatus;
}

export interface LiveLogMonitorViewModel {
  selectedSceneBaseAsset: BaseAssetRecord | null;
  selectedSceneComposition: CompositionResultRecord | null;
  selectedStyleProfile: StyleProfileOption;
  selectedMutationProfile: MutationProfileOption;
  playableBaseTracks: LibraryTrack[];
  playableBaseTrackIdsKey: string;
  availableBaseTrackOptions: LibraryTrack[];
  backgroundNowPlayingTrack: LibraryTrack | null;
  backgroundTransitionNextTrack: LibraryTrack | null;
  traceWaveformTrack: LibraryTrack | null;
  traceWaveformExplanations: LiveMutationExplanation[];
  selectedTraceExplanation: LiveMutationExplanation | null;
  traceWaveformCues: ReturnType<typeof buildLiveLogMonitorExplanationState>["traceWaveformCues"];
  currentReplayExplanation: LiveMutationExplanation | null;
  referenceAnchor: ReferenceAnchor | null;
  scene: ReturnType<typeof resolveLiveSonificationScene>;
  baseTrackCount: number;
  hasBaseListeningBed: boolean;
  activeAdapterKind: StreamAdapterKind;
  activeAdapterLabel: string;
  adapterDescription: string;
  adapterTarget: string;
  effectiveLiveMutationState: LiveMutationState;
  liveMutationStateLabel: string;
  cueEnginePreviewLabel: string;
}

export function buildLiveLogMonitorViewModel(
  input: LiveLogMonitorViewModelInput,
): LiveLogMonitorViewModel {
  const selectedSceneBaseAsset =
    input.availableBaseAssets.find((entry) => entry.id === input.sceneBaseAssetId) ?? null;
  const selectedSceneComposition =
    input.availableCompositions.find((entry) => entry.id === input.sceneCompositionId) ?? null;
  const selectedStyleProfile = resolveStyleProfile(input.selectedStyleProfileId);
  const selectedMutationProfile = resolveMutationProfile(input.selectedMutationProfileId);
  const trackSelectionState = buildLiveLogMonitorTrackSelectionState({
    basePlaylist: input.basePlaylist,
    availableTracks: input.availableTracks,
    backgroundNowPlayingId: input.backgroundNowPlayingId,
    backgroundTransitionPlan: input.backgroundTransitionPlan,
  });
  const explanationState = buildLiveLogMonitorExplanationState({
    recentExplanations: input.recentExplanations,
    selectedExplanationId: input.selectedExplanationId,
    traceWaveformTrack: trackSelectionState.traceWaveformTrack,
    replayActive: input.replayActive,
    playbackEventIndex: input.playbackEventIndex,
  });
  const scene = resolveLiveSonificationScene(
    selectedSceneBaseAsset,
    selectedSceneComposition,
    input.selectedStyleProfileId,
    input.selectedMutationProfileId,
    trackSelectionState.referenceAnchor,
  );
  const adapterState = buildLiveLogMonitorAdapterState({
    repository: input.repository,
    repositoryId: input.repositoryId,
    adapterKind: input.adapterKind,
    sessionRepoId: input.sessionRepoId,
    sessionAdapterKind: input.sessionAdapterKind,
  });
  const effectiveLiveMutationState =
    input.forcedLiveMutationState === "auto"
      ? input.liveMutationState
      : input.forcedLiveMutationState;
  const liveMutationStateLabel = resolveLiveMutationStateLabel(effectiveLiveMutationState);

  return {
    selectedSceneBaseAsset,
    selectedSceneComposition,
    selectedStyleProfile,
    selectedMutationProfile,
    ...trackSelectionState,
    ...explanationState,
    scene,
    ...adapterState,
    effectiveLiveMutationState,
    liveMutationStateLabel,
    cueEnginePreviewLabel: resolveCueEnginePreviewLabel({
      hasBaseListeningBed: trackSelectionState.hasBaseListeningBed,
      sampleStatus: input.sampleStatus,
      liveMutationStateLabel,
      sampleSourceCount: scene.sampleSourceCount,
    }),
  };
}
