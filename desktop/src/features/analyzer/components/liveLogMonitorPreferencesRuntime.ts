import {
  DEFAULT_MUTATION_PROFILE_ID,
  DEFAULT_STYLE_PROFILE_ID,
} from "../../../config/liveProfiles";
import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
} from "../../../types/library";
import { createBasePlaylist, type MonitorPrefs } from "../../../utils/monitorPrefs";
import { preferredBaseAssetId, preferredCompositionId } from "./liveLogMonitorViewModel";
import { getTrackTitle, resolvePlayableTrackPath } from "../../../utils/track";

export interface RepoResetMonitorState {
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  basePlaylist: BaseTrackPlaylist;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  masterVolume: number;
  pendingAddTrackId: string;
  pendingLoadPlaylistId: string;
  backgroundNowPlayingId: string | null;
  backgroundTransitionPlan: null;
  liveMutationState: "normal";
  forcedLiveMutationState: "auto";
}

export function buildLiveMonitorPrefsState(input: {
  basePlaylist: BaseTrackPlaylist | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  masterVolume: number;
}): MonitorPrefs {
  return {
    basePlaylist: input.basePlaylist,
    selectedStyleProfileId: input.selectedStyleProfileId,
    selectedMutationProfileId: input.selectedMutationProfileId,
    masterVolume: input.masterVolume,
  };
}

export function resolveGuideTrackSeedPlaylist(input: {
  currentTrackCount: number;
  guideTrackPath: string | null;
  availableTracks: LibraryTrack[];
}): BaseTrackPlaylist | null {
  if (input.currentTrackCount > 0 || !input.guideTrackPath) {
    return null;
  }

  const guideTrack =
    input.availableTracks.find(
      (track) => resolvePlayableTrackPath(track) === input.guideTrackPath,
    ) ?? null;

  if (!guideTrack) {
    return null;
  }

  return createBasePlaylist([guideTrack.id], `${getTrackTitle(guideTrack)} · Monitoring`);
}

export function buildRepoResetMonitorState(input: {
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetIdProp?: string | null;
  preferredCompositionIdProp?: string | null;
  prefs: MonitorPrefs | null;
}): RepoResetMonitorState {
  return {
    sceneBaseAssetId:
      preferredBaseAssetId(input.availableBaseAssets, input.preferredBaseAssetIdProp) ?? "",
    sceneCompositionId:
      preferredCompositionId(input.availableCompositions, input.preferredCompositionIdProp) ?? "",
    basePlaylist: input.prefs?.basePlaylist ?? createBasePlaylist([]),
    selectedStyleProfileId: input.prefs?.selectedStyleProfileId ?? DEFAULT_STYLE_PROFILE_ID,
    selectedMutationProfileId:
      input.prefs?.selectedMutationProfileId ?? DEFAULT_MUTATION_PROFILE_ID,
    masterVolume: input.prefs?.masterVolume ?? 0.45,
    pendingAddTrackId: "",
    pendingLoadPlaylistId: "",
    backgroundNowPlayingId: null,
    backgroundTransitionPlan: null,
    liveMutationState: "normal",
    forcedLiveMutationState: "auto",
  };
}

export function resolveNextSceneBaseAssetId(input: {
  currentSceneBaseAssetId: string;
  availableBaseAssets: BaseAssetRecord[];
  preferredBaseAssetIdProp?: string | null;
}): string {
  if (
    input.currentSceneBaseAssetId &&
    input.availableBaseAssets.some((entry) => entry.id === input.currentSceneBaseAssetId)
  ) {
    return input.currentSceneBaseAssetId;
  }

  return preferredBaseAssetId(input.availableBaseAssets, input.preferredBaseAssetIdProp) ?? "";
}

export function resolveNextSceneCompositionId(input: {
  currentSceneCompositionId: string;
  availableCompositions: CompositionResultRecord[];
  preferredCompositionIdProp?: string | null;
}): string {
  if (
    input.currentSceneCompositionId &&
    input.availableCompositions.some((entry) => entry.id === input.currentSceneCompositionId)
  ) {
    return input.currentSceneCompositionId;
  }

  return (
    preferredCompositionId(input.availableCompositions, input.preferredCompositionIdProp) ?? ""
  );
}
