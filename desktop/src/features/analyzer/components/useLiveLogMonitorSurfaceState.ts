import { useRef, useState } from "react";

import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StreamAdapterKind,
} from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import { loadMonitorPrefs } from "../../../utils/monitorPrefs";
import type { AudioEngineStatus, ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import type { ArrangementVoice, ComponentOverride, RoutedLiveCue } from "./liveSonificationScene";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import { useLiveLogMonitorSurfaceRefs } from "./useLiveLogMonitorSurfaceRefs";
import { buildLiveLogMonitorSurfaceInitialState } from "./liveLogMonitorSurfaceStateRuntime";

export type LiveLogMonitorSampleStatus = "unavailable" | "loading" | "ready" | "error";

export interface UseLiveLogMonitorSurfaceStateInput {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
}

export function useLiveLogMonitorSurfaceState(input: UseLiveLogMonitorSurfaceStateInput) {
  const initialStateRef = useRef<ReturnType<typeof buildLiveLogMonitorSurfaceInitialState> | null>(
    null,
  );
  if (initialStateRef.current === null) {
    initialStateRef.current = buildLiveLogMonitorSurfaceInitialState({
      availableBaseAssets: input.availableBaseAssets,
      availableCompositions: input.availableCompositions,
      preferredBaseAssetId: input.preferredBaseAssetId,
      preferredCompositionId: input.preferredCompositionId,
      prefs: loadMonitorPrefs(input.repository.id),
    });
  }

  const initialState = initialStateRef.current;
  const {
    audioContextRef,
    usingSharedAudioContextRef,
    masterGainRef,
    backgroundGainRef,
    analyserRef,
    backgroundDryGainRef,
    backgroundDriveWetGainRef,
    backgroundDriveNodeRef,
    sampleBuffersRef,
    beatClockRef,
    beatLooperRef,
    backgroundDeckRef,
    panelAudioProbePlayedRef,
    backgroundTransitionTimerRef,
    backgroundBufferCacheRef,
    filterNodeRef,
    bounceCuesRef,
    knownComponentsRef,
    syncTailListRef,
    previousAudibleVolumeRef,
  } = useLiveLogMonitorSurfaceRefs(initialState.masterVolume);
  const [masterVolume, setMasterVolume] = useState(initialState.masterVolume);
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [selectedStyleProfileId, setSelectedStyleProfileId] = useState(
    initialState.selectedStyleProfileId,
  );
  const [selectedMutationProfileId, setSelectedMutationProfileId] = useState(
    initialState.selectedMutationProfileId,
  );
  const [basePlaylist, setBasePlaylist] = useState<BaseTrackPlaylist | null>(
    initialState.basePlaylist,
  );
  const [pendingAddTrackId, setPendingAddTrackId] = useState("");
  const [pendingLoadPlaylistId, setPendingLoadPlaylistId] = useState("");
  const [beatClockBpm, setBeatClockBpm] = useState<number | null>(null);
  const [bounceWindowCount, setBounceWindowCount] = useState(0);
  const [beatLooperActive, setBeatLooperActive] = useState(false);
  const [backgroundNowPlayingId, setBackgroundNowPlayingId] = useState<string | null>(null);
  const [backgroundTransitionPlan, setBackgroundTransitionPlan] =
    useState<PlaylistTransitionPlan | null>(null);
  const [liveMutationState, setLiveMutationState] = useState<LiveMutationState>("normal");
  const [forcedLiveMutationState, setForcedLiveMutationState] =
    useState<ForcedLiveMutationState>("auto");
  const [knownComponents, setKnownComponents] = useState<string[]>([]);
  const [componentOverrides, setComponentOverrides] = useState<Map<string, ComponentOverride>>(
    () => new Map(),
  );
  const [sceneBaseAssetId, setSceneBaseAssetId] = useState(initialState.sceneBaseAssetId);
  const [sceneCompositionId, setSceneCompositionId] = useState(initialState.sceneCompositionId);
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>("idle");
  const [sampleStatus, setSampleStatus] = useState<LiveLogMonitorSampleStatus>("unavailable");
  const [lastUpdate, setLastUpdate] = useState<LiveLogStreamUpdate | null>(null);
  const [emittedCueCount, setEmittedCueCount] = useState(0);
  const [emittedVoiceCount, setEmittedVoiceCount] = useState(0);
  const [recentCues, setRecentCues] = useState<RoutedLiveCue[]>([]);
  const [recentVoices, setRecentVoices] = useState<ArrangementVoice[]>([]);
  const [recentMarkers, setRecentMarkers] = useState<LiveLogMarker[]>([]);
  const [recentExplanations, setRecentExplanations] = useState<LiveMutationExplanation[]>([]);
  const [selectedExplanationId, setSelectedExplanationId] = useState<string | null>(null);
  const [backgroundPlayheadSecond, setBackgroundPlayheadSecond] = useState<number>(0);
  const [recentWarnings, setRecentWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isAnomalyFlash, setIsAnomalyFlash] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [syncTailRows, setSyncTailRows] = useState<SyncTailRow[]>([]);
  const [activeTailWindowId, setActiveTailWindowId] = useState<string | null>(null);

  return {
    audioContextRef,
    usingSharedAudioContextRef,
    masterGainRef,
    backgroundGainRef,
    analyserRef,
    backgroundDryGainRef,
    backgroundDriveWetGainRef,
    backgroundDriveNodeRef,
    sampleBuffersRef,
    masterVolume,
    setMasterVolume,
    adapterKind,
    setAdapterKind,
    selectedStyleProfileId,
    setSelectedStyleProfileId,
    selectedMutationProfileId,
    setSelectedMutationProfileId,
    basePlaylist,
    setBasePlaylist,
    pendingAddTrackId,
    setPendingAddTrackId,
    pendingLoadPlaylistId,
    setPendingLoadPlaylistId,
    beatClockBpm,
    setBeatClockBpm,
    bounceWindowCount,
    setBounceWindowCount,
    beatLooperActive,
    setBeatLooperActive,
    backgroundNowPlayingId,
    setBackgroundNowPlayingId,
    backgroundTransitionPlan,
    setBackgroundTransitionPlan,
    liveMutationState,
    setLiveMutationState,
    forcedLiveMutationState,
    setForcedLiveMutationState,
    knownComponents,
    setKnownComponents,
    componentOverrides,
    setComponentOverrides,
    sceneBaseAssetId,
    setSceneBaseAssetId,
    sceneCompositionId,
    setSceneCompositionId,
    audioStatus,
    setAudioStatus,
    sampleStatus,
    setSampleStatus,
    lastUpdate,
    setLastUpdate,
    emittedCueCount,
    setEmittedCueCount,
    emittedVoiceCount,
    setEmittedVoiceCount,
    recentCues,
    setRecentCues,
    recentVoices,
    setRecentVoices,
    recentMarkers,
    setRecentMarkers,
    recentExplanations,
    setRecentExplanations,
    selectedExplanationId,
    setSelectedExplanationId,
    backgroundPlayheadSecond,
    setBackgroundPlayheadSecond,
    recentWarnings,
    setRecentWarnings,
    error,
    setError,
    isStarting,
    setIsStarting,
    isAnomalyFlash,
    setIsAnomalyFlash,
    expanded,
    setExpanded,
    syncTailRows,
    setSyncTailRows,
    activeTailWindowId,
    setActiveTailWindowId,
    beatClockRef,
    beatLooperRef,
    backgroundDeckRef,
    panelAudioProbePlayedRef,
    backgroundTransitionTimerRef,
    backgroundBufferCacheRef,
    filterNodeRef,
    bounceCuesRef,
    knownComponentsRef,
    syncTailListRef,
    previousAudibleVolumeRef,
  };
}
