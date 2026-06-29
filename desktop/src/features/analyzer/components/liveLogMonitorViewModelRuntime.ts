import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RepositoryAnalysis,
  StreamAdapterKind,
} from "../../../types/library";
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
  type ReferenceAnchor,
} from "./liveSonificationScene";

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

export interface BuildLiveLogMonitorTrackSelectionStateInput {
  basePlaylist: BaseTrackPlaylist | null;
  availableTracks: LibraryTrack[];
  backgroundNowPlayingId: string | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
}

export function buildLiveLogMonitorTrackSelectionState(
  input: BuildLiveLogMonitorTrackSelectionStateInput,
) {
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
  const referenceAnchor = resolveReferenceAnchor(input.basePlaylist, input.availableTracks);
  const baseTrackCount = input.basePlaylist?.trackIds.length ?? 0;
  const hasBaseListeningBed = baseTrackCount > 0;

  return {
    playableBaseTracks,
    availableBaseTrackOptions,
    playableBaseTrackIdsKey,
    backgroundNowPlayingTrack,
    backgroundTransitionNextTrack,
    traceWaveformTrack,
    referenceAnchor,
    baseTrackCount,
    hasBaseListeningBed,
  };
}

export interface BuildLiveLogMonitorExplanationStateInput {
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  traceWaveformTrack: LibraryTrack | null;
  replayActive: boolean;
  playbackEventIndex: number | null;
}

export function buildLiveLogMonitorExplanationState(
  input: BuildLiveLogMonitorExplanationStateInput,
) {
  const traceWaveformExplanations = input.traceWaveformTrack
    ? input.recentExplanations.filter(
        (explanation) =>
          explanation.trackId === input.traceWaveformTrack?.id &&
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

  return {
    traceWaveformExplanations,
    selectedTraceExplanation,
    traceWaveformCues,
    currentReplayExplanation,
  };
}

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
