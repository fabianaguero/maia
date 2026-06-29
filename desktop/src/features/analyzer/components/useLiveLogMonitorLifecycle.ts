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
    if (audioContextRef.current && !usingSharedAudioContextRef.current) {
      void audioContextRef.current.close();
    }
  });

  useEffect(() => {
    setSceneBaseAssetId((current) =>
      resolveNextSceneBaseAssetId({
        currentSceneBaseAssetId: current,
        availableBaseAssets,
        preferredBaseAssetIdProp: preferredBaseAssetId,
      }),
    );
  }, [availableBaseAssets, preferredBaseAssetId, setSceneBaseAssetId]);

  useEffect(() => {
    setSceneCompositionId((current) =>
      resolveNextSceneCompositionId({
        currentSceneCompositionId: current,
        availableCompositions,
        preferredCompositionIdProp: preferredCompositionId,
      }),
    );
  }, [availableCompositions, preferredCompositionId, setSceneCompositionId]);

  useEffect(() => {
    return () => {
      stopManagedBlobAudioState(activeBlobAudioElements);
      closeOwnedAudioContext();
    };
  }, [activeBlobAudioElements, closeOwnedAudioContext]);

  useEffect(() => {
    const seededPlaylist = resolveGuideTrackSeedPlaylist({
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
      stopManagedBlobAudioState(activeBlobAudioElements);
    }
  }, [activeBlobAudioElements, replayActive]);

  useEffect(() => {
    const nextPrefs = loadMonitorPrefs(repository.id);
    const resetState = buildRepoResetMonitorState({
      availableBaseAssets,
      availableCompositions,
      preferredBaseAssetIdProp: preferredBaseAssetId,
      preferredCompositionIdProp: preferredCompositionId,
      prefs: nextPrefs,
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

  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;
  useEffect(() => {
    return subscribeRef.current(onStreamUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
