import {
  resolveMutationProfile,
  resolveStyleProfile,
} from "../../../config/liveProfiles";
import type {
  BaseTrackPlaylist,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
  StreamAdapterKind,
} from "../../../types/library";
import type { MutationProfileOption, StyleProfileOption } from "../../../types/music";
import { resolvePlaylistTracks } from "../../../utils/playlist";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import { toLiveMutationVisualizationCues } from "../../../utils/liveMutationExplainability";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import { getStreamAdapterDescription, getStreamAdapterLabel } from "../../../utils/streamAdapter";
import { getTrackTitle, resolvePlayableTrackPath } from "../../../utils/track";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import {
  blendAnchors,
  deriveReferenceAnchor,
  resolveLiveSonificationScene,
  type ReferenceAnchor,
} from "./liveSonificationScene";

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

function resolveReferenceAnchor(
  basePlaylist: BaseTrackPlaylist | null,
  availableTracks: LibraryTrack[],
): ReferenceAnchor | null {
  const anchors = (basePlaylist?.trackIds ?? [])
    .map((id) => availableTracks.find((track) => track.id === id))
    .filter((track): track is LibraryTrack => track !== undefined)
    .map(deriveReferenceAnchor);

  return anchors.length > 0 ? blendAnchors(anchors) : null;
}

function resolveLiveMutationStateLabel(state: LiveMutationState): string {
  switch (state) {
    case "critical":
      return "Critical tension";
    case "warning":
      return "Warning pressure";
    default:
      return "Normal drift";
  }
}

function resolveCueEnginePreviewLabel(input: {
  hasBaseListeningBed: boolean;
  sampleStatus: SampleEngineStatus;
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
  traceWaveformCues: ReturnType<typeof toLiveMutationVisualizationCues>;
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
  const playableBaseTracks = resolvePlaylistTracks(input.basePlaylist, input.availableTracks).filter(
    (track) => Boolean(resolvePlayableTrackPath(track)),
  );
  const availableBaseTrackOptions = input.availableTracks
    .filter((track) => !(input.basePlaylist?.trackIds ?? []).includes(track.id))
    .sort((left, right) => {
      const leftMissing = left.file.availabilityState === "missing" ? 1 : 0;
      const rightMissing = right.file.availabilityState === "missing" ? 1 : 0;
      if (leftMissing !== rightMissing) {
        return leftMissing - rightMissing;
      }

      return getTrackTitle(left).localeCompare(getTrackTitle(right));
    });
  const playableBaseTrackIdsKey = playableBaseTracks.map((track) => track.id).join("|");
  const backgroundNowPlayingTrack = input.backgroundNowPlayingId
    ? (input.availableTracks.find((track) => track.id === input.backgroundNowPlayingId) ?? null)
    : null;
  const backgroundTransitionNextTrack = input.backgroundTransitionPlan?.nextTrackId
    ? (input.availableTracks.find(
        (track) => track.id === input.backgroundTransitionPlan?.nextTrackId,
      ) ?? null)
    : null;
  const traceWaveformTrack = backgroundNowPlayingTrack ?? playableBaseTracks[0] ?? null;
  const traceWaveformExplanations = traceWaveformTrack
    ? input.recentExplanations.filter(
        (explanation) =>
          explanation.trackId === traceWaveformTrack.id &&
          typeof explanation.trackSecond === "number",
      )
    : [];
  const selectedTraceExplanation =
    traceWaveformExplanations.find((explanation) => explanation.id === input.selectedExplanationId) ??
    null;
  const traceWaveformCues = toLiveMutationVisualizationCues(traceWaveformExplanations);
  const currentReplayExplanation =
    input.replayActive && input.playbackEventIndex !== null
      ? ((selectedTraceExplanation?.replayWindowIndex === input.playbackEventIndex
          ? selectedTraceExplanation
          : input.recentExplanations.find(
              (explanation) => explanation.replayWindowIndex === input.playbackEventIndex,
            )) ?? null)
      : null;
  const referenceAnchor = resolveReferenceAnchor(input.basePlaylist, input.availableTracks);
  const scene = resolveLiveSonificationScene(
    selectedSceneBaseAsset,
    selectedSceneComposition,
    input.selectedStyleProfileId,
    input.selectedMutationProfileId,
    referenceAnchor,
  );
  const baseTrackCount = input.basePlaylist?.trackIds.length ?? 0;
  const hasBaseListeningBed = baseTrackCount > 0;
  const activeAdapterKind =
    input.sessionRepoId === input.repositoryId
      ? (input.sessionAdapterKind ?? input.adapterKind)
      : input.adapterKind;
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
    playableBaseTracks,
    playableBaseTrackIdsKey,
    availableBaseTrackOptions,
    backgroundNowPlayingTrack,
    backgroundTransitionNextTrack,
    traceWaveformTrack,
    traceWaveformExplanations,
    selectedTraceExplanation,
    traceWaveformCues,
    currentReplayExplanation,
    referenceAnchor,
    scene,
    baseTrackCount,
    hasBaseListeningBed,
    activeAdapterKind,
    activeAdapterLabel: getStreamAdapterLabel(activeAdapterKind),
    adapterDescription: getStreamAdapterDescription(input.adapterKind),
    adapterTarget: input.repository.sourcePath,
    effectiveLiveMutationState,
    liveMutationStateLabel,
    cueEnginePreviewLabel: resolveCueEnginePreviewLabel({
      hasBaseListeningBed,
      sampleStatus: input.sampleStatus,
      liveMutationStateLabel,
      sampleSourceCount: scene.sampleSourceCount,
    }),
  };
}
