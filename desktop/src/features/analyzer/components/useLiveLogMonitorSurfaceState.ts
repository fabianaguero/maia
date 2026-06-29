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
import { createBasePlaylist, loadMonitorPrefs } from "../../../utils/monitorPrefs";
import type { AudioEngineStatus, ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import { preferredBaseAssetId, preferredCompositionId } from "./liveLogMonitorViewModel";
import type { ArrangementVoice, ComponentOverride, RoutedLiveCue } from "./liveSonificationScene";
import type { BeatClock, BeatLooperState } from "./liveLogMonitorBeatRuntime";
import type { LiveMutationState } from "./liveLogMonitorAudioRuntime";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import {
  DEFAULT_MUTATION_PROFILE_ID,
  DEFAULT_STYLE_PROFILE_ID,
} from "../../../config/liveProfiles";

export type LiveLogMonitorSampleStatus = "unavailable" | "loading" | "ready" | "error";

export interface UseLiveLogMonitorSurfaceStateInput {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
}

export function useLiveLogMonitorSurfaceState(input: UseLiveLogMonitorSurfaceStateInput) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const usingSharedAudioContextRef = useRef(false);
  const masterGainRef = useRef<GainNode | null>(null);
  const backgroundGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const backgroundDryGainRef = useRef<GainNode | null>(null);
  const backgroundDriveWetGainRef = useRef<GainNode | null>(null);
  const backgroundDriveNodeRef = useRef<WaveShaperNode | null>(null);
  const sampleBuffersRef = useRef(new Map<string, AudioBuffer>());
  const [masterVolume, setMasterVolume] = useState(
    () => loadMonitorPrefs(input.repository.id)?.masterVolume ?? 0.45,
  );
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [selectedStyleProfileId, setSelectedStyleProfileId] = useState(
    () => loadMonitorPrefs(input.repository.id)?.selectedStyleProfileId ?? DEFAULT_STYLE_PROFILE_ID,
  );
  const [selectedMutationProfileId, setSelectedMutationProfileId] = useState(
    () =>
      loadMonitorPrefs(input.repository.id)?.selectedMutationProfileId ??
      DEFAULT_MUTATION_PROFILE_ID,
  );
  const [basePlaylist, setBasePlaylist] = useState<BaseTrackPlaylist | null>(
    () => loadMonitorPrefs(input.repository.id)?.basePlaylist ?? createBasePlaylist([]),
  );
  const [pendingAddTrackId, setPendingAddTrackId] = useState("");
  const [pendingLoadPlaylistId, setPendingLoadPlaylistId] = useState("");
  const beatClockRef = useRef<BeatClock | null>(null);
  const beatLooperRef = useRef<BeatLooperState | null>(null);
  const backgroundDeckRef = useRef<BackgroundDeckState | null>(null);
  const panelAudioProbePlayedRef = useRef(false);
  const backgroundTransitionTimerRef = useRef<number | null>(null);
  const backgroundBufferCacheRef = useRef(new Map<string, Promise<AudioBuffer>>());
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const [beatClockBpm, setBeatClockBpm] = useState<number | null>(null);
  const bounceCuesRef = useRef<RoutedLiveCue[][]>([]);
  const [bounceWindowCount, setBounceWindowCount] = useState(0);
  const [beatLooperActive, setBeatLooperActive] = useState(false);
  const [backgroundNowPlayingId, setBackgroundNowPlayingId] = useState<string | null>(null);
  const [backgroundTransitionPlan, setBackgroundTransitionPlan] =
    useState<PlaylistTransitionPlan | null>(null);
  const [liveMutationState, setLiveMutationState] = useState<LiveMutationState>("normal");
  const [forcedLiveMutationState, setForcedLiveMutationState] =
    useState<ForcedLiveMutationState>("auto");
  const knownComponentsRef = useRef<string[]>([]);
  const [knownComponents, setKnownComponents] = useState<string[]>([]);
  const [componentOverrides, setComponentOverrides] = useState<Map<string, ComponentOverride>>(
    () => new Map(),
  );
  const [sceneBaseAssetId, setSceneBaseAssetId] = useState(
    preferredBaseAssetId(input.availableBaseAssets, input.preferredBaseAssetId) ?? "",
  );
  const [sceneCompositionId, setSceneCompositionId] = useState(
    preferredCompositionId(input.availableCompositions, input.preferredCompositionId) ?? "",
  );
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
  const syncTailListRef = useRef<HTMLDivElement | null>(null);
  const previousAudibleVolumeRef = useRef(masterVolume > 0 ? masterVolume : 0.45);

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
    beatClockRef,
    beatLooperRef,
    backgroundDeckRef,
    panelAudioProbePlayedRef,
    backgroundTransitionTimerRef,
    backgroundBufferCacheRef,
    filterNodeRef,
    beatClockBpm,
    setBeatClockBpm,
    bounceCuesRef,
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
    knownComponentsRef,
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
    syncTailListRef,
    previousAudibleVolumeRef,
  };
}
