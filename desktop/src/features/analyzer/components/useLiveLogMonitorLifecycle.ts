import {
  useEffect,
  useEffectEvent,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
} from "../../../types/library";
import type { buildRepoResetMonitorState } from "./liveLogMonitorPreferencesRuntime";
import { type ManagedBlobAudioElement } from "./liveLogMonitorAudioRuntime";
import {
  closeOwnedLiveLogMonitorAudioContext,
  resolveLiveLogMonitorRepositoryResetState,
  resolveLiveLogMonitorSeedPlaylist,
  resolveNextLiveLogMonitorSceneBaseAssetId,
  resolveNextLiveLogMonitorSceneCompositionId,
  stopLiveLogMonitorBlobAudio,
} from "./liveLogMonitorLifecycleRuntime";

interface LiveLogMonitorLifecycleInput {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  availableTracks: LibraryTrack[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  basePlaylist: BaseTrackPlaylist | null;
  guideTrackPath: string | null;
  replayActive: boolean;
  onStreamUpdate: (update: LiveLogStreamUpdate) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  activeBlobAudioElements: Set<ManagedBlobAudioElement>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  usingSharedAudioContextRef: MutableRefObject<boolean>;
  setSceneBaseAssetId: Dispatch<SetStateAction<string>>;
  setSceneCompositionId: Dispatch<SetStateAction<string>>;
  setBasePlaylist: Dispatch<SetStateAction<BaseTrackPlaylist | null>>;
  applyRepositoryReset: (state: ReturnType<typeof buildRepoResetMonitorState>) => void;
}

export function useLiveLogMonitorLifecycle(input: LiveLogMonitorLifecycleInput): void {
  const {
    repository,
    availableBaseAssets,
    availableCompositions,
    availableTracks,
    preferredBaseAssetId,
    preferredCompositionId,
    basePlaylist,
    guideTrackPath,
    replayActive,
    onStreamUpdate,
    subscribe,
    activeBlobAudioElements,
    audioContextRef,
    usingSharedAudioContextRef,
    setSceneBaseAssetId,
    setSceneCompositionId,
    setBasePlaylist,
    applyRepositoryReset,
  } = input;

  const closeOwnedAudioContext = useEffectEvent(() => {
    closeOwnedLiveLogMonitorAudioContext({
      audioContextRef,
      usingSharedAudioContextRef,
    });
  });
  const onStreamUpdateRef = useRef(onStreamUpdate);

  useEffect(() => {
    onStreamUpdateRef.current = onStreamUpdate;
  }, [onStreamUpdate]);

  useEffect(() => {
    setSceneBaseAssetId((current) =>
      resolveNextLiveLogMonitorSceneBaseAssetId({
        currentSceneBaseAssetId: current,
        availableBaseAssets,
        preferredBaseAssetId,
      }),
    );
  }, [availableBaseAssets, preferredBaseAssetId, setSceneBaseAssetId]);

  useEffect(() => {
    setSceneCompositionId((current) =>
      resolveNextLiveLogMonitorSceneCompositionId({
        currentSceneCompositionId: current,
        availableCompositions,
        preferredCompositionId,
      }),
    );
  }, [availableCompositions, preferredCompositionId, setSceneCompositionId]);

  useEffect(() => {
    return () => {
      stopLiveLogMonitorBlobAudio(activeBlobAudioElements);
      closeOwnedAudioContext();
    };
  }, [activeBlobAudioElements, closeOwnedAudioContext]);

  useEffect(() => {
    const seededPlaylist = resolveLiveLogMonitorSeedPlaylist({
      currentTrackCount: basePlaylist?.trackIds.length ?? 0,
      guideTrackPath,
      availableTracks,
    });
    if (!seededPlaylist) {
      return;
    }

    setBasePlaylist((current) => {
      if ((current?.trackIds.length ?? 0) > 0) {
        return current;
      }

      return seededPlaylist;
    });
  }, [availableTracks, basePlaylist?.trackIds.length, guideTrackPath, setBasePlaylist]);

  useEffect(() => {
    if (replayActive) {
      stopLiveLogMonitorBlobAudio(activeBlobAudioElements);
    }
  }, [activeBlobAudioElements, replayActive]);

  useEffect(() => {
    const resetState = resolveLiveLogMonitorRepositoryResetState({
      repositoryId: repository.id,
      availableBaseAssets,
      availableCompositions,
      preferredBaseAssetId,
      preferredCompositionId,
    });
    applyRepositoryReset(resetState);
  }, [
    applyRepositoryReset,
    availableBaseAssets,
    availableCompositions,
    preferredBaseAssetId,
    preferredCompositionId,
    repository.id,
  ]);

  useEffect(() => {
    return subscribe((update) => onStreamUpdateRef.current(update));
  }, [subscribe]);
}
