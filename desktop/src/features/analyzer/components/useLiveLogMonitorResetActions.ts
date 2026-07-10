import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { BaseTrackPlaylist, LiveLogMarker, LiveLogStreamUpdate } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { LiveMonitorStartResetState } from "./liveLogMonitorSessionRuntime";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import type { LiveMonitorStopResetState } from "./liveLogMonitorActionRuntime";
import type { ArrangementVoice, ComponentOverride, RoutedLiveCue } from "./liveSonificationScene";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";

export interface LiveMonitorRepositoryResetState {
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  basePlaylist: BaseTrackPlaylist | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  masterVolume: number;
  pendingAddTrackId: string;
  pendingLoadPlaylistId: string;
  backgroundNowPlayingId: string | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
  liveMutationState: LiveMutationState;
  forcedLiveMutationState: ForcedLiveMutationState;
}

export interface UseLiveLogMonitorResetActionsInput {
  knownComponentsRef: MutableRefObject<string[]>;
  beatClockRef: MutableRefObject<{ originTime: number; bpm: number } | null>;
  beatLooperRef: MutableRefObject<{ cancelled: boolean } | null>;
  panelAudioProbePlayedRef: MutableRefObject<boolean>;
  bounceCuesRef: MutableRefObject<RoutedLiveCue[][]>;
  setLastUpdate: Dispatch<SetStateAction<LiveLogStreamUpdate | null>>;
  setEmittedCueCount: Dispatch<SetStateAction<number>>;
  setEmittedVoiceCount: Dispatch<SetStateAction<number>>;
  setRecentCues: Dispatch<SetStateAction<RoutedLiveCue[]>>;
  setRecentVoices: Dispatch<SetStateAction<ArrangementVoice[]>>;
  setRecentMarkers: Dispatch<SetStateAction<LiveLogMarker[]>>;
  setRecentExplanations: Dispatch<SetStateAction<LiveMutationExplanation[]>>;
  setSelectedExplanationId: Dispatch<SetStateAction<string | null>>;
  setBackgroundPlayheadSecond: Dispatch<SetStateAction<number>>;
  setRecentWarnings: Dispatch<SetStateAction<string[]>>;
  setSyncTailRows: Dispatch<SetStateAction<SyncTailRow[]>>;
  setActiveTailWindowId: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setKnownComponents: Dispatch<SetStateAction<string[]>>;
  setComponentOverrides: Dispatch<SetStateAction<Map<string, ComponentOverride>>>;
  setSceneBaseAssetId: Dispatch<SetStateAction<string>>;
  setSceneCompositionId: Dispatch<SetStateAction<string>>;
  setBasePlaylist: Dispatch<SetStateAction<BaseTrackPlaylist | null>>;
  setSelectedStyleProfileId: Dispatch<SetStateAction<string>>;
  setSelectedMutationProfileId: Dispatch<SetStateAction<string>>;
  setMasterVolume: Dispatch<SetStateAction<number>>;
  setPendingAddTrackId: Dispatch<SetStateAction<string>>;
  setPendingLoadPlaylistId: Dispatch<SetStateAction<string>>;
  setBeatClockBpm: Dispatch<SetStateAction<number | null>>;
  setBackgroundNowPlayingId: Dispatch<SetStateAction<string | null>>;
  setBackgroundTransitionPlan: Dispatch<SetStateAction<PlaylistTransitionPlan | null>>;
  setLiveMutationState: Dispatch<SetStateAction<LiveMutationState>>;
  setForcedLiveMutationState: Dispatch<SetStateAction<ForcedLiveMutationState>>;
  setBeatLooperActive: Dispatch<SetStateAction<boolean>>;
  setIsStarting: Dispatch<SetStateAction<boolean>>;
  setBounceWindowCount: Dispatch<SetStateAction<number>>;
  stopBeatLooper: () => void;
}

export function useLiveLogMonitorResetActions(input: UseLiveLogMonitorResetActionsInput): {
  applyRepositoryReset: (resetState: LiveMonitorRepositoryResetState) => void;
  applyStartReset: (resetState: LiveMonitorStartResetState) => void;
  applyStopReset: (resetState: LiveMonitorStopResetState) => void;
} {
  const applyRepositoryReset = useCallback(
    (resetState: LiveMonitorRepositoryResetState) => {
      input.setLastUpdate(null);
      input.setEmittedCueCount(0);
      input.setEmittedVoiceCount(0);
      input.setRecentCues([]);
      input.setRecentVoices([]);
      input.setRecentMarkers([]);
      input.setRecentExplanations([]);
      input.setSelectedExplanationId(null);
      input.setBackgroundPlayheadSecond(0);
      input.setRecentWarnings([]);
      input.setSyncTailRows([]);
      input.setActiveTailWindowId(null);
      input.setError(null);
      input.knownComponentsRef.current = [];
      input.setKnownComponents([]);
      input.setComponentOverrides(new Map());
      input.setSceneBaseAssetId(resetState.sceneBaseAssetId);
      input.setSceneCompositionId(resetState.sceneCompositionId);
      input.setBasePlaylist(resetState.basePlaylist);
      input.setSelectedStyleProfileId(resetState.selectedStyleProfileId);
      input.setSelectedMutationProfileId(resetState.selectedMutationProfileId);
      input.setMasterVolume(resetState.masterVolume);
      input.setPendingAddTrackId(resetState.pendingAddTrackId);
      input.setPendingLoadPlaylistId(resetState.pendingLoadPlaylistId);
      input.beatClockRef.current = null;
      input.setBeatClockBpm(null);
      input.setBackgroundNowPlayingId(resetState.backgroundNowPlayingId);
      input.setBackgroundTransitionPlan(resetState.backgroundTransitionPlan);
      input.setLiveMutationState(resetState.liveMutationState);
      input.setForcedLiveMutationState(resetState.forcedLiveMutationState);
      input.stopBeatLooper();
      input.setBeatLooperActive(false);
    },
    [input],
  );

  const applyStartReset = useCallback(
    (resetState: LiveMonitorStartResetState) => {
      input.setLastUpdate(null);
      input.setEmittedCueCount(resetState.emittedCueCount);
      input.setRecentCues([]);
      input.setRecentVoices([]);
      input.setRecentMarkers([]);
      input.setRecentExplanations([]);
      input.setSelectedExplanationId(null);
      input.setBackgroundPlayheadSecond(resetState.backgroundPlayheadSecond);
      input.setLiveMutationState(resetState.liveMutationState);
      input.setForcedLiveMutationState(resetState.forcedLiveMutationState);
      input.setSyncTailRows([]);
      input.setActiveTailWindowId(resetState.activeTailWindowId);
      input.setError(resetState.error);
      input.setIsStarting(resetState.isStarting);
      input.panelAudioProbePlayedRef.current = false;
      input.bounceCuesRef.current = [];
      input.setBounceWindowCount(resetState.bounceWindowCount);
    },
    [input],
  );

  const applyStopReset = useCallback(
    (resetState: LiveMonitorStopResetState) => {
      input.setRecentExplanations([]);
      input.setSelectedExplanationId(resetState.selectedExplanationId);
      input.setBackgroundPlayheadSecond(resetState.backgroundPlayheadSecond);
      input.setLiveMutationState(resetState.liveMutationState);
      input.setForcedLiveMutationState(resetState.forcedLiveMutationState);
      input.beatClockRef.current = null;
      input.setBeatClockBpm(resetState.beatClockBpm);
      input.setBeatLooperActive(resetState.beatLooperActive);
    },
    [input],
  );

  return { applyRepositoryReset, applyStartReset, applyStopReset };
}
