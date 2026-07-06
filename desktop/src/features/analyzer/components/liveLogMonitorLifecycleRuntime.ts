import type { MutableRefObject } from "react";

import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
} from "../../../types/library";
import { loadMonitorPrefs } from "../../../utils/monitorPrefs";
import {
  buildRepoResetMonitorState,
  resolveGuideTrackSeedPlaylist,
  resolveNextSceneBaseAssetId,
  resolveNextSceneCompositionId,
} from "./liveLogMonitorPreferencesRuntime";
import {
  stopManagedBlobAudioState,
  type ManagedBlobAudioElement,
} from "./liveLogMonitorAudioRuntime";

export function closeOwnedLiveLogMonitorAudioContext(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  usingSharedAudioContextRef: MutableRefObject<boolean>;
}): void {
  if (input.audioContextRef.current && !input.usingSharedAudioContextRef.current) {
    void input.audioContextRef.current.close();
  }
}

export function resolveNextLiveLogMonitorSceneBaseAssetId(input: {
  currentSceneBaseAssetId: string;
  availableBaseAssets: BaseAssetRecord[];
  preferredBaseAssetId?: string | null;
}): string {
  return resolveNextSceneBaseAssetId({
    currentSceneBaseAssetId: input.currentSceneBaseAssetId,
    availableBaseAssets: input.availableBaseAssets,
    preferredBaseAssetIdProp: input.preferredBaseAssetId,
  });
}

export function resolveNextLiveLogMonitorSceneCompositionId(input: {
  currentSceneCompositionId: string;
  availableCompositions: CompositionResultRecord[];
  preferredCompositionId?: string | null;
}): string {
  return resolveNextSceneCompositionId({
    currentSceneCompositionId: input.currentSceneCompositionId,
    availableCompositions: input.availableCompositions,
    preferredCompositionIdProp: input.preferredCompositionId,
  });
}

export function resolveLiveLogMonitorSeedPlaylist(input: {
  currentTrackCount: number;
  guideTrackPath: string | null;
  availableTracks: LibraryTrack[];
}): BaseTrackPlaylist | null {
  return resolveGuideTrackSeedPlaylist({
    currentTrackCount: input.currentTrackCount,
    guideTrackPath: input.guideTrackPath,
    availableTracks: input.availableTracks,
  });
}

export function resolveLiveLogMonitorRepositoryResetState(input: {
  repositoryId: string;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
}) {
  const nextPrefs = loadMonitorPrefs(input.repositoryId);
  return buildRepoResetMonitorState({
    availableBaseAssets: input.availableBaseAssets,
    availableCompositions: input.availableCompositions,
    preferredBaseAssetIdProp: input.preferredBaseAssetId,
    preferredCompositionIdProp: input.preferredCompositionId,
    prefs: nextPrefs,
  });
}

export function stopLiveLogMonitorBlobAudio(
  activeBlobAudioElements: Set<ManagedBlobAudioElement>,
): void {
  stopManagedBlobAudioState(activeBlobAudioElements);
}
