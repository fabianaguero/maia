import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useT } from "../../../i18n/I18nContext";
import { getLogger } from "../../../utils/logger";

const log = getLogger("LiveMonitor");

import type {
  BaseTrackPlaylist,
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  LiveLogMarker,
  LiveLogStreamUpdate,
  RepositoryAnalysis,
  StreamAdapterKind,
} from "../../../types/library";
import type { SessionBookmark } from "../../../api/sessions";
import { useReplayBookmarks } from "../../../hooks/useReplayBookmarks";
import { useReplayFeedbackRecommendation } from "../../../hooks/useReplayFeedbackRecommendation";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import {
  getTrackTitle,
} from "../../../utils/track";
import {
  type LiveMutationExplanation,
} from "../../../utils/liveMutationExplainability";
import {
  createBasePlaylist,
  loadMonitorPrefs,
  persistReplayFeedbackRecommendation,
} from "../../../utils/monitorPrefs";
import { useMonitor } from "../../monitor/MonitorContext";
import { DEFAULT_MUTATION_PROFILE_ID, DEFAULT_STYLE_PROFILE_ID } from "../../../config/liveProfiles";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import { LiveLogMonitorHeader } from "./LiveLogMonitorHeader";
import { LiveLogMonitorSetupSection } from "./LiveLogMonitorSetupSection";
import { LiveWaveformCanvas } from "./LiveWaveformCanvas";
import { ComponentRoutingPanel } from "./ComponentRoutingPanel";
import { LiveLogMonitorLiveDeck } from "./LiveLogMonitorLiveDeck";
import { LiveLogMonitorDeckSection } from "./LiveLogMonitorDeckSection";
import {
  type ArrangementVoice,
  type ComponentOverride,
  type RoutedLiveCue,
} from "./liveSonificationScene";
import {
  renderBounceWav,
  BOUNCE_WINDOW_S,
} from "./wavRenderer";
import {
  appendSyncTailRows,
  buildSyncTailRows,
  formatConfidence,
  formatCursor,
  levelCount,
  resolveBackgroundTrackSecond,
  type SyncTailRow,
} from "./liveLogMonitorPanelRuntime";
import {
  buildBasePlaylistTrackOptions,
  buildNowPlayingSummary,
  buildPlaylistEditorItems,
  buildPlaylistSummaryItems,
  buildSavedPlaylistOptions,
  buildUpNextSummary,
} from "./liveLogMonitorPlaylistViewState";
import {
  buildLiveMonitorDisplayState,
  buildMetricGridItems,
  resolveBounceActionLabel,
  resolveCueEngineStateLabel,
  resolveSessionCardDisplay,
} from "./liveLogMonitorDisplayRuntime";
import {
  createManagedBlobAudioRegistry,
  setBlobAudioVolumeState,
  stopManagedBlobAudioState,
  type LiveMutationState,
} from "./liveLogMonitorAudioRuntime";
import {
  buildLiveLogMonitorViewModel,
  preferredBaseAssetId,
  preferredCompositionId,
  toMessage,
  type AudioEngineStatus,
  type ForcedLiveMutationState,
} from "./liveLogMonitorViewModel";
import {
  buildLiveMonitorStartResetState,
  createLiveMonitorSessionInput,
  resolveLiveMonitorStartAudioPlan,
  resolveLiveMonitorCtaMeta,
} from "./liveLogMonitorSessionRuntime";
import {
  resolveBookmarkJumpState,
  resolveTraceExplanationSelection,
} from "./liveLogMonitorInteractionRuntime";
import {
  createLiveMonitorSessionId,
  resolveLiveMonitorStartFailureMessage,
  resolveLiveMonitorStartWarning,
} from "./liveLogMonitorControlRuntime";
import { stopLiveMonitorAudioGraph } from "./liveLogMonitorAudioCleanupRuntime";
import {
  buildRepoResetMonitorState,
  resolveNextSceneBaseAssetId,
  resolveNextSceneCompositionId,
  resolveGuideTrackSeedPlaylist,
} from "./liveLogMonitorPreferencesRuntime";
import {
  buildRecentCueHistory,
  buildRecentExplanationHistory,
  buildRecentMarkerHistory,
  buildRecentMonitorVoices,
  resolveActiveTailWindowId,
  resolveSelectedMonitorExplanationId,
} from "./liveLogMonitorStreamUpdateRuntime";
import {
  buildLiveMonitorStopResetState,
  resolveBookmarkSuggestionSelection,
  resolveLiveMonitorBounceFilename,
  resolveReplayFeedbackSelection,
} from "./liveLogMonitorActionRuntime";
import {
  resolveBeatClockLiveSync,
  startBeatLooper,
  stopBeatLooper,
  type BeatClock,
  type BeatLooperState,
} from "./liveLogMonitorBeatRuntime";
import { buildMonitorUpdateDerivation } from "./liveLogMonitorUpdateDerivationRuntime";
import { useLiveLogMonitorSampleBank } from "./useLiveLogMonitorSampleBank";
import { useLiveLogMonitorResetActions } from "./useLiveLogMonitorResetActions";
import { useLiveLogMonitorSurfaceSync } from "./useLiveLogMonitorSurfaceSync";
import {
  type BackgroundDeckState,
} from "./liveLogMonitorBackgroundDeckRuntime";
import { useLiveLogMonitorBackgroundLifecycle } from "./useLiveLogMonitorBackgroundLifecycle";
import { useLiveLogMonitorAudioBootstrap } from "./useLiveLogMonitorAudioBootstrap";
import { useLiveLogMonitorBackgroundAudioEngine } from "./useLiveLogMonitorBackgroundAudioEngine";
import { useLiveLogMonitorAuxPlayback } from "./useLiveLogMonitorAuxPlayback";
import { useLiveLogMonitorBackgroundDeckControl } from "./useLiveLogMonitorBackgroundDeckControl";
import { useLiveLogMonitorPlayback } from "./useLiveLogMonitorPlayback";

const MAX_RECENT_CUES = 8;
const MAX_RECENT_MARKERS = 6;
const MAX_RECENT_WARNINGS = 4;
const MAX_RECENT_EXPLANATIONS = 6;
const MAX_PARSED_LINES = 5;
const MAX_ANOMALY_SOURCE_LINES = 6;
const MAX_SYNC_TAIL_LINES = 60;

interface LiveLogMonitorPanelProps {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  return audioConstructor ? new audioConstructor() : null;
}

// ---------------------------------------------------------------------------
// WAV renderer is in wavRenderer.ts (imported above).
// ---------------------------------------------------------------------------

const activeBlobAudioElements = createManagedBlobAudioRegistry();

// ---------------------------------------------------------------------------
// Live waveform canvas — draws the real-time audio waveform from AnalyserNode
// ---------------------------------------------------------------------------

export function LiveLogMonitorPanel({
  repository,
  availableBaseAssets,
  availableCompositions,
  preferredBaseAssetId: preferredBaseAssetIdProp,
  preferredCompositionId: preferredCompositionIdProp,
  availableTracks,
  availablePlaylists,
}: LiveLogMonitorPanelProps) {
  const t = useT();
  const monitor = useMonitor();
  // Session is live for THIS repo when the global monitor owns it
  const liveEnabled = monitor.session?.repoId === repository.id;
  const replayActive = liveEnabled && monitor.isPlayback;
  const playbackPercent =
    typeof monitor.playbackProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(monitor.playbackProgress * 100)))
      : null;
  const playbackWindowLabel =
    replayActive && monitor.playbackEventIndex !== null && monitor.playbackEventCount !== null
      ? `${monitor.playbackEventIndex}/${monitor.playbackEventCount}`
      : null;

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
    () => loadMonitorPrefs(repository.id)?.masterVolume ?? 0.45,
  );
  const [adapterKind, setAdapterKind] = useState<StreamAdapterKind>("file");
  const [selectedStyleProfileId, setSelectedStyleProfileId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedStyleProfileId ?? DEFAULT_STYLE_PROFILE_ID,
  );
  const [selectedMutationProfileId, setSelectedMutationProfileId] = useState(
    () => loadMonitorPrefs(repository.id)?.selectedMutationProfileId ?? DEFAULT_MUTATION_PROFILE_ID,
  );
  const [basePlaylist, setBasePlaylist] = useState<BaseTrackPlaylist | null>(
    () => loadMonitorPrefs(repository.id)?.basePlaylist ?? createBasePlaylist([]),
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
  // Bounce buffer: accumulates voiced cues per poll window (not state — no re-render)
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
    preferredBaseAssetId(availableBaseAssets, preferredBaseAssetIdProp) ?? "",
  );
  const [sceneCompositionId, setSceneCompositionId] = useState(
    preferredCompositionId(availableCompositions, preferredCompositionIdProp) ?? "",
  );
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>("idle");
  const [sampleStatus, setSampleStatus] = useState<"unavailable" | "loading" | "ready" | "error">(
    "unavailable",
  );
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
  const {
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
    activeAdapterLabel,
    adapterDescription,
    adapterTarget,
    effectiveLiveMutationState,
    liveMutationStateLabel,
    cueEnginePreviewLabel,
  } = useMemo(
    () =>
      buildLiveLogMonitorViewModel({
        repository,
        repositoryId: repository.id,
        adapterKind,
        sessionRepoId: monitor.session?.repoId ?? null,
        sessionAdapterKind: monitor.session?.adapterKind ?? null,
        availableBaseAssets,
        availableCompositions,
        availableTracks,
        basePlaylist,
        sceneBaseAssetId,
        sceneCompositionId,
        selectedStyleProfileId,
        selectedMutationProfileId,
        recentExplanations,
        selectedExplanationId,
        backgroundNowPlayingId,
        backgroundTransitionPlan,
        replayActive,
        playbackEventIndex: monitor.playbackEventIndex,
        forcedLiveMutationState,
        liveMutationState,
        sampleStatus,
      }),
    [
      adapterKind,
      availableBaseAssets,
      availableCompositions,
      availableTracks,
      backgroundNowPlayingId,
      backgroundTransitionPlan,
      basePlaylist,
      forcedLiveMutationState,
      liveMutationState,
      monitor.playbackEventIndex,
      monitor.session?.adapterKind,
      monitor.session?.repoId,
      recentExplanations,
      replayActive,
      repository,
      sampleStatus,
      sceneBaseAssetId,
      sceneCompositionId,
      selectedExplanationId,
      selectedMutationProfileId,
      selectedStyleProfileId,
    ],
  );
  const replaySessionId = replayActive ? (monitor.session?.persistedSessionId ?? null) : null;
  const {
    sortedSessionBookmarks,
    activeReplayBookmark,
    bookmarkLabelDraft,
    setBookmarkLabelDraft,
    bookmarkNoteDraft,
    setBookmarkNoteDraft,
    bookmarkTagDraft,
    setBookmarkTagDraft,
    bookmarkStyleProfileIdDraft,
    setBookmarkStyleProfileIdDraft,
    bookmarkMutationProfileIdDraft,
    setBookmarkMutationProfileIdDraft,
    bookmarkBusy,
    bookmarkError,
    captureCurrentScene,
    saveReplayBookmark,
    deleteReplayBookmark,
  } = useReplayBookmarks({
    replaySessionId,
    replayActive,
    replayWindowIndex: monitor.playbackEventIndex,
    selectedStyleProfileId,
    selectedMutationProfileId,
    currentReplayExplanation: currentReplayExplanation
      ? {
          eventIndex: currentReplayExplanation.eventIndex,
          trackId: currentReplayExplanation.trackId,
          trackTitle: currentReplayExplanation.trackTitle,
          trackSecond: currentReplayExplanation.trackSecond,
        }
      : null,
    fallbackTrackId: traceWaveformTrack?.id ?? null,
    fallbackTrackTitle: traceWaveformTrack ? getTrackTitle(traceWaveformTrack) : null,
    fallbackTrackSecond:
      typeof backgroundPlayheadSecond === "number" ? backgroundPlayheadSecond : null,
  });
  const replayFeedbackRecommendation = useReplayFeedbackRecommendation(sortedSessionBookmarks, {
    currentStyleProfileId: selectedStyleProfileId,
    currentMutationProfileId: selectedMutationProfileId,
  });
  const adapterConfigured = true;
  const { ensureAudioReady } = useLiveLogMonitorAudioBootstrap({
    monitorAudioContext: monitor.audioContext,
    resumeSharedAudio: monitor.resumeAudio,
    createAudioContext,
    audioContextRef,
    usingSharedAudioContextRef,
    masterGainRef,
    analyserRef,
    setAudioStatus,
    liveEnabled,
    replayActive,
    masterVolume,
    logger: log,
  });
  const { playRenderedBlobThroughGraph, playPanelTestTone } = useLiveLogMonitorAuxPlayback({
    ensureAudioReady,
    masterGainRef,
    masterVolume,
    activeBlobAudioElements,
    setAudioStatus,
    logger: log,
    toMessage,
  });
  const { ensureBackgroundBus, applyLogModulation } = useLiveLogMonitorBackgroundAudioEngine({
    audioContextRef,
    masterGainRef,
    backgroundGainRef,
    backgroundDryGainRef,
    backgroundDriveWetGainRef,
    backgroundDriveNodeRef,
    filterNodeRef,
    backgroundDeckRef,
    selectedStyleProfile: {
      backgroundGain: selectedStyleProfile.backgroundGain,
      filterBaseHz: selectedStyleProfile.filterBaseHz,
      filterCeilingHz: selectedStyleProfile.filterCeilingHz,
    },
    selectedMutationProfile: {
      backgroundDucking: selectedMutationProfile.backgroundDucking,
      filterSweepMultiplier: selectedMutationProfile.filterSweepMultiplier,
      anomalyBoostMultiplier: selectedMutationProfile.anomalyBoostMultiplier,
      transitionTightness: selectedMutationProfile.transitionTightness,
    },
    forcedLiveMutationState,
    liveEnabled,
    setLiveMutationState,
  });
  const {
    stopBackgroundDeck,
    scheduleBackgroundTransition,
    startBackgroundDeck,
    ensureBackgroundAudio,
  } = useLiveLogMonitorBackgroundDeckControl({
    audioContextRef,
    backgroundDeckRef,
    backgroundTransitionTimerRef,
    backgroundBufferCacheRef,
    filterNodeRef,
    playableBaseTracks,
    selectedStyleProfile: {
      backgroundGain: selectedStyleProfile.backgroundGain,
      playlistCrossfadeSeconds: selectedStyleProfile.playlistCrossfadeSeconds,
      transitionFeel: selectedStyleProfile.transitionFeel,
    },
    selectedMutationProfile: {
      transitionTightness: selectedMutationProfile.transitionTightness,
    },
    maxRecentWarnings: MAX_RECENT_WARNINGS,
    ensureBackgroundBus,
    setBackgroundNowPlayingId,
    setBackgroundTransitionPlan,
    setBackgroundPlayheadSecond,
    setRecentWarnings,
    toMessage,
  });
  const { applyRepositoryReset, applyStartReset, applyStopReset } = useLiveLogMonitorResetActions({
    knownComponentsRef,
    beatClockRef,
    beatLooperRef,
    panelAudioProbePlayedRef,
    bounceCuesRef,
    setLastUpdate,
    setEmittedCueCount,
    setEmittedVoiceCount,
    setRecentCues,
    setRecentVoices,
    setRecentMarkers,
    setRecentExplanations,
    setSelectedExplanationId,
    setBackgroundPlayheadSecond,
    setRecentWarnings,
    setSyncTailRows,
    setActiveTailWindowId,
    setError,
    setKnownComponents,
    setComponentOverrides,
    setSceneBaseAssetId,
    setSceneCompositionId,
    setBasePlaylist,
    setSelectedStyleProfileId,
    setSelectedMutationProfileId,
    setMasterVolume,
    setPendingAddTrackId,
    setPendingLoadPlaylistId,
    setBeatClockBpm,
    setBackgroundNowPlayingId,
    setBackgroundTransitionPlan,
    setLiveMutationState,
    setForcedLiveMutationState,
    setBeatLooperActive,
    setIsStarting,
    setBounceWindowCount,
    stopBeatLooper: () => stopBeatLooper(beatLooperRef),
  });
  const handleSampleLoadError = useCallback(
    (message: string) => {
      setRecentWarnings((current) =>
        [`Base sample routing failed: ${message}`, ...current].slice(0, MAX_RECENT_WARNINGS),
      );
    },
    [],
  );
  useLiveLogMonitorSampleBank({
    sampleSources: scene.sampleSources,
    audioContextRef,
    sampleBuffersRef,
    setSampleStatus,
    createAudioContext,
    onLoadError: handleSampleLoadError,
  });
  useLiveLogMonitorSurfaceSync({
    repositoryId: repository.id,
    basePlaylist,
    selectedStyleProfileId,
    selectedMutationProfileId,
    masterVolume,
    activeBlobAudioElements,
    audioContextRef,
    masterGainRef,
    syncTailListRef,
    syncTailRowCount: syncTailRows.length,
    previousAudibleVolumeRef,
    backgroundGainRef,
    backgroundDryGainRef,
    backgroundDriveWetGainRef,
    filterNodeRef,
    selectedStyleProfile: {
      backgroundGain: selectedStyleProfile.backgroundGain,
      filterCeilingHz: selectedStyleProfile.filterCeilingHz,
    },
  });
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
        preferredBaseAssetIdProp,
      }),
    );
  }, [availableBaseAssets, preferredBaseAssetIdProp]);

  useEffect(() => {
    setSceneCompositionId((current) =>
      resolveNextSceneCompositionId({
        currentSceneCompositionId: current,
        availableCompositions,
        preferredCompositionIdProp,
      }),
    );
  }, [availableCompositions, preferredCompositionIdProp]);

  // Close AudioContext on unmount — the background poll loop lives in MonitorContext
  useEffect(() => {
    return () => {
      stopManagedBlobAudioState(activeBlobAudioElements);
      closeOwnedAudioContext();
    };
  }, [closeOwnedAudioContext]);

  useEffect(() => {
    const seededPlaylist = resolveGuideTrackSeedPlaylist({
      currentTrackCount: basePlaylist?.trackIds.length ?? 0,
      guideTrackPath: monitor.guideTrackPath,
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
  }, [availableTracks, basePlaylist?.trackIds.length, monitor.guideTrackPath]);

  useEffect(() => {
    if (replayActive) {
      stopManagedBlobAudioState(activeBlobAudioElements);
    }
  }, [replayActive]);

  // Reset local display state when switching repos; the background monitor keeps running
  useEffect(() => {
    const nextPrefs = loadMonitorPrefs(repository.id);
    const resetState = buildRepoResetMonitorState({
      availableBaseAssets,
      availableCompositions,
      preferredBaseAssetIdProp,
      preferredCompositionIdProp,
      prefs: nextPrefs,
    });
    applyRepositoryReset(resetState);
  }, [
    applyRepositoryReset,
    availableBaseAssets,
    availableCompositions,
    preferredBaseAssetIdProp,
    preferredCompositionIdProp,
    repository.id,
  ]);

  useLiveLogMonitorBackgroundLifecycle({
    liveEnabled,
    playableBaseTracks,
    playableBaseTrackIdsKey,
    audioContextRef,
    backgroundDeckRef,
    setBackgroundNowPlayingId,
    setBackgroundTransitionPlan: () => setBackgroundTransitionPlan(null),
    stopBackgroundDeck,
    startBackgroundDeck,
    scheduleBackgroundTransition,
  });

  const { playWithCurrentEngine, handleSequencerStepFire } =
    useLiveLogMonitorPlayback({
      audioContextRef,
      masterGainRef,
      backgroundDeckRef,
      sampleBuffersRef,
      beatClockRef,
      bounceCuesRef,
      masterVolume,
      scene: {
        preset: scene.preset,
        mutationProfile: scene.mutationProfile,
      },
      effectiveLiveMutationState,
      sampleStatus,
      playableBaseTracks,
      playRenderedBlobThroughGraph,
      setBounceWindowCount,
      setEmittedVoiceCount,
      logger: log,
    });

  // ---------------------------------------------------------------------------
  // Stream update handler — receives poll windows from MonitorContext
  // ---------------------------------------------------------------------------

  const onStreamUpdate = useEffectEvent((update: LiveLogStreamUpdate) => {
    log.trace(
      "onStreamUpdate hasData=%s lines=%d cues=%d sessionRepo=%s panelRepo=%s",
      update.hasData,
      update.lineCount,
      update.sonificationCues.length,
      monitor.session?.repoId,
      repository.id,
    );
    // Only process updates for the repo this panel is showing
    if (monitor.session?.repoId !== repository.id) {
      log.debug(
        "onStreamUpdate — skipped (repo mismatch session=%s vs panel=%s)",
        monitor.session?.repoId,
        repository.id,
      );
      return;
    }

    // Accumulate known components for per-component stereo routing
    const currentDeck = backgroundDeckRef.current;
    const currentTrackSecond = resolveBackgroundTrackSecond(audioContextRef.current, currentDeck);
    const updateDerivation = buildMonitorUpdateDerivation({
      update,
      scene,
      knownComponents: knownComponentsRef.current,
      componentOverrides,
      currentDeckTrackId: currentDeck?.trackId ?? null,
      availableTracks,
      currentTrackSecond,
      maxRecentExplanations: MAX_RECENT_EXPLANATIONS,
    });

    knownComponentsRef.current = updateDerivation.knownComponents;
    if (updateDerivation.knownComponentsChanged) {
      setKnownComponents(knownComponentsRef.current.slice());
    }
    const routedCues = updateDerivation.routedCues;
    const nextExplanations = updateDerivation.nextExplanations;

    startTransition(() => {
      setLastUpdate(update);
      setRecentWarnings(update.warnings.slice(0, MAX_RECENT_WARNINGS));
      setError(null);

      if (!update.hasData) {
        setLastUpdate(update);
        return;
      }

      const nextTailRows = buildSyncTailRows({
        update,
        maxParsedLines: MAX_PARSED_LINES,
      });

      if (nextTailRows.length > 0) {
        setSyncTailRows((current) =>
          appendSyncTailRows(current, nextTailRows, MAX_SYNC_TAIL_LINES),
        );
      }
      setActiveTailWindowId(resolveActiveTailWindowId(nextTailRows));

      if (update.anomalyCount > 0) {
        setIsAnomalyFlash(true);
        window.setTimeout(() => setIsAnomalyFlash(false), 1200);
      }

      if (replayActive) return;

      setEmittedCueCount((current) => current + routedCues.length);
      setRecentCues((current) =>
        buildRecentCueHistory(current, routedCues, updateDerivation.primaryLine, MAX_RECENT_CUES),
      );
      setRecentMarkers((current) =>
        buildRecentMarkerHistory(current, update.anomalyMarkers, MAX_RECENT_MARKERS),
      );
      setRecentExplanations((current) =>
        buildRecentExplanationHistory(
          current,
          nextExplanations,
          MAX_RECENT_EXPLANATIONS,
        ),
      );
      if (typeof currentTrackSecond === "number") {
        setBackgroundPlayheadSecond(currentTrackSecond);
      }
      if (nextExplanations[0]) {
        setSelectedExplanationId((current) =>
          resolveSelectedMonitorExplanationId(current, nextExplanations, monitor.isPlayback),
        );
      }
      setRecentVoices(buildRecentMonitorVoices(routedCues, scene.mutationProfile.arrangementDepth, 12));
    });

    if (update.hasData && !replayActive) {
      void ensureAudioReady();

      const beatClockSyncPlan = resolveBeatClockLiveSync({
        currentClock: beatClockRef.current,
        liveBpm: update.suggestedBpm,
        useBeatGrid: scene.preset.useBeatGrid,
        audioCurrentTime: audioContextRef.current?.currentTime ?? null,
      });
      if (beatClockSyncPlan.changed) {
        beatClockRef.current = beatClockSyncPlan.nextClock;
        setBeatClockBpm(beatClockSyncPlan.nextDisplayBpm);
      }

      log.info(
        "onStreamUpdate → playing %d routed cues, bpm=%s",
        routedCues.length,
        update.suggestedBpm,
      );
      if (!panelAudioProbePlayedRef.current && backgroundDeckRef.current === null) {
        panelAudioProbePlayedRef.current = true;
        void playPanelTestTone();
      }
      playWithCurrentEngine(routedCues, update.suggestedBpm);
      applyLogModulation(update);
    }
  });

  // Subscribe to the global monitor stream while this panel is mounted
  // Use a ref so the effect runs once (monitor object changes identity every render)
  const subscribeRef = useRef(monitor.subscribe);
  subscribeRef.current = monitor.subscribe;
  useEffect(() => {
    return subscribeRef.current(onStreamUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Start / stop (delegate to MonitorContext)
  // ---------------------------------------------------------------------------

  async function handleStart() {
    const resetState = buildLiveMonitorStartResetState();
    applyStartReset(resetState);

    // Prime the AudioContext BEFORE any other async operation so the browser
    // still recognises this as a trusted user gesture. WebKit requires
    // new AudioContext() / resume() to be called during a user interaction.
    await ensureAudioReady();

    const sessionId = createLiveMonitorSessionId(repository.id, Date.now());

    try {
      const startWarning = resolveLiveMonitorStartWarning(adapterKind, repository.sourcePath);
      if (startWarning) {
        setRecentWarnings((c) => [
          startWarning,
          ...c,
        ]);
      }
      const input = createLiveMonitorSessionInput(repository, sessionId);

      const started = await monitor.startSession(repository, input);
      if (!started) {
        throw new Error("Maia could not start the selected live source in the current runtime.");
      }

      // AudioContext was already created above — just read the ref
      const ctx = audioContextRef.current;
      const startAudioPlan = resolveLiveMonitorStartAudioPlan({
        contextTime: ctx?.currentTime ?? null,
        anchorBpm: referenceAnchor?.bpm ?? null,
        useBeatGrid: scene.preset.useBeatGrid,
      });
      if (startAudioPlan.beatClockSeed) {
        beatClockRef.current = startAudioPlan.beatClockSeed;
        setBeatClockBpm(startAudioPlan.beatClockBpm);
      } else {
        beatClockRef.current = null;
        setBeatClockBpm(null);
      }
      // Start the background rhythm pulse when beat-locked preset is active
      if (ctx && startAudioPlan.shouldStartBeatLooper && startAudioPlan.beatLooperBpm) {
        startBeatLooper(
          ctx,
          startAudioPlan.beatLooperBpm,
          scene.preset.rhythmDivision,
          beatLooperRef,
          masterGainRef.current ?? ctx.destination,
        );
        setBeatLooperActive(true);
      }

      // Start background guide track if present
      if (ctx) {
        void ensureBackgroundAudio(ctx);
      }
    } catch (err) {
      console.error("Start session failed", err);
      setError(resolveLiveMonitorStartFailureMessage(err, toMessage));
    } finally {
      setIsStarting(false);
    }
  }

  function handleStop() {
    const resetState = buildLiveMonitorStopResetState();

    void monitor.stopSession();
    applyStopReset(resetState);
    stopLiveMonitorAudioGraph({
      stopBackgroundDeck,
      stopBeatLooper: () => stopBeatLooper(beatLooperRef),
      muteManagedBlobAudio: () => {
        setBlobAudioVolumeState(activeBlobAudioElements, 0);
        stopManagedBlobAudioState(activeBlobAudioElements);
      },
      backgroundGainRef,
      backgroundDryGainRef,
      backgroundDriveWetGainRef,
      backgroundDriveNodeRef,
      filterNodeRef,
      masterGainRef,
      analyserRef,
    });
  }

  function handleBounce() {
    const windows = bounceCuesRef.current;
    if (windows.length === 0) return;
    const blob = renderBounceWav(windows, masterVolume);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resolveLiveMonitorBounceFilename({
      repositoryTitle: repository.title,
      windowCount: windows.length,
      bounceWindowSeconds: BOUNCE_WINDOW_S,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function handleApplyBookmarkSuggestion(bookmark: SessionBookmark) {
    const nextSelection = resolveBookmarkSuggestionSelection(bookmark);
    if (nextSelection.selectedStyleProfileId) {
      setSelectedStyleProfileId(nextSelection.selectedStyleProfileId);
    }

    if (nextSelection.selectedMutationProfileId) {
      setSelectedMutationProfileId(nextSelection.selectedMutationProfileId);
    }
  }

  function handleApplyReplayFeedbackRecommendation() {
    if (!replayFeedbackRecommendation) {
      return;
    }

    const nextPrefs = persistReplayFeedbackRecommendation(
      repository.id,
      {
        basePlaylist,
        selectedStyleProfileId,
        selectedMutationProfileId,
      },
      replayFeedbackRecommendation,
    );

    const nextSelection = resolveReplayFeedbackSelection({
      suggestedStyleProfileId: nextPrefs.selectedStyleProfileId,
      suggestedMutationProfileId: nextPrefs.selectedMutationProfileId,
    });

    setSelectedStyleProfileId(nextSelection.selectedStyleProfileId ?? selectedStyleProfileId);
    setSelectedMutationProfileId(
      nextSelection.selectedMutationProfileId ?? selectedMutationProfileId,
    );
  }

  function handleJumpToBookmark(bookmark: SessionBookmark) {
    const bookmarkExplanation =
      recentExplanations.find(
        (explanation) => explanation.replayWindowIndex === bookmark.replayWindowIndex,
      ) ?? null;
    const jumpState = resolveBookmarkJumpState({
      playbackEventCount: monitor.playbackEventCount,
      bookmark,
      bookmarkExplanation,
    });

    if (!jumpState) {
      return;
    }

    if (jumpState.shouldPausePlayback) {
      monitor.pausePlayback();
    }
    if (jumpState.nextPlaybackProgress !== null) {
      monitor.seekPlaybackProgress(jumpState.nextPlaybackProgress);
    }
    if (jumpState.nextSelectedExplanationId) {
      setSelectedExplanationId(jumpState.nextSelectedExplanationId);
    }
    if (jumpState.nextBackgroundPlayheadSecond !== null) {
      setBackgroundPlayheadSecond(jumpState.nextBackgroundPlayheadSecond);
    }
  }

  const handleSetMasterVolume = useCallback((nextVolume: number) => {
    setMasterVolume(Math.max(0, Math.min(1, nextVolume)));
  }, []);

  const handleToggleMute = useCallback(() => {
    setMasterVolume((current) => {
      if (current <= 0.001) {
        return previousAudibleVolumeRef.current > 0.001 ? previousAudibleVolumeRef.current : 0.45;
      }

      previousAudibleVolumeRef.current = current;
      return 0;
    });
  }, []);

  const {
    currentLevelCounts,
    anomalySourceRows,
    waveAnomalyMarkers,
    liveSourceLabel,
    recentSyncTailRows,
    deckStatusLabel,
    audioStateLabel: resolvedAudioStateLabel,
    audioBadgeLabel,
    audioBadgeTone,
  } = useMemo(
    () =>
      buildLiveMonitorDisplayState({
        lastUpdate,
        recentMarkers,
        syncTailRows,
        maxSyncTailLines: MAX_SYNC_TAIL_LINES,
        maxAnomalySourceLines: MAX_ANOMALY_SOURCE_LINES,
        replayActive,
        liveEnabled,
        repositorySourcePath: repository.sourcePath,
        audioStatus,
        labels: {
          replayLabel: t.session.replay,
          liveLabel: t.appShell.live,
          stoppedLabel: t.session.stopped,
          audioUnavailable: t.inspect.audioStateUnavailable,
          audioError: t.inspect.audioStateError,
          audioActive: t.inspect.audioStateActive,
          audioArmed: t.inspect.audioStateArmed,
          audioIdle: t.inspect.audioStateIdle,
          audioOn: t.inspect.audioOn,
          audioBlocked: t.inspect.audioBlocked,
        },
      }),
    [audioStatus, lastUpdate, liveEnabled, recentMarkers, replayActive, repository.sourcePath, syncTailRows, t],
  );
  const bounceAction = useMemo(
    () => resolveBounceActionLabel(bounceWindowCount, BOUNCE_WINDOW_S),
    [bounceWindowCount],
  );
  const cueEngineStateLabel = useMemo(
    () =>
      resolveCueEngineStateLabel({
        sampleStatus,
        sampleSourceCount: scene.sampleSourceCount,
        labels: {
          cueEngineBaseSamplePack: t.inspect.cueEngineBaseSamplePack,
          cueEngineBaseSample: t.inspect.cueEngineBaseSample,
          cueEngineLoadingSample: t.inspect.cueEngineLoadingSample,
          cueEngineInternalSynth: t.inspect.cueEngineInternalSynth,
        },
      }),
    [sampleStatus, scene.sampleSourceCount, t],
  );
  const sessionCardDisplay = useMemo(
    () =>
      liveEnabled && monitor.session
        ? resolveSessionCardDisplay({
            session: monitor.session,
            replayActive,
            playbackPercent,
            windowsHeard: monitor.metrics.windowCount,
            labels: {
              replaySessionTitle: t.inspect.replaySession,
              sessionTitle: t.inspect.sessionLabel,
              storedSourceReplay: t.inspect.storedSourceReplay,
              fallbackDirectFilePoll: t.inspect.fallbackDirectFilePoll,
              replayComplete: t.session.complete,
              windowsReplayed: t.inspect.windowsReplayed,
            },
          })
        : null,
    [liveEnabled, monitor.metrics.windowCount, monitor.session, playbackPercent, replayActive, t],
  );
  const metricGridItems = useMemo(
    () =>
      buildMetricGridItems({
        replayActive,
        replaySessionTitle: t.inspect.replaySession,
        activeAdapterLabel,
        audioStateLabel: resolvedAudioStateLabel,
        styleProfileLabel: selectedStyleProfile.label,
        mutationProfileLabel: selectedMutationProfile.label,
        cueEngineStateLabel,
        playbackWindowLabel,
        windowsHeard: monitor.metrics.windowCount,
        cuesEmitted: emittedCueCount,
        processedLines: monitor.metrics.processedLines,
        anomaliesHeard: monitor.metrics.totalAnomalies,
        beatClockBpm,
        voicesEmitted: emittedVoiceCount,
        beatLooperActive,
        labels: {
          modeLabel: t.inspect.mode,
          audioEngineLabel: t.simpleMode.monitor.audioEngine,
          styleProfileTitle: t.inspect.styleProfileTitle,
          mutationProfileTitle: t.inspect.mutationProfileTitle,
          cueEngineLabel: t.inspect.cueEngineLabel,
          windowsHeardLabel: t.inspect.windowsHeard,
          cuesEmittedLabel: t.inspect.cuesEmitted,
          linesProcessedLabel: t.session.linesProcessed,
          anomaliesHeardLabel: t.inspect.anomaliesHeard,
          beatClockLabel: t.inspect.beatClock,
          freeLabel: t.inspect.free,
          voicesEmittedLabel: t.inspect.voicesEmitted,
          rhythmPulseLabel: t.inspect.rhythmPulse,
          activeLabel: t.session.active,
          offLabel: t.inspect.off,
        },
      }),
    [
      activeAdapterLabel,
      beatClockBpm,
      beatLooperActive,
      cueEngineStateLabel,
      emittedCueCount,
      emittedVoiceCount,
      monitor.metrics.processedLines,
      monitor.metrics.totalAnomalies,
      monitor.metrics.windowCount,
      playbackWindowLabel,
      replayActive,
      resolvedAudioStateLabel,
      selectedMutationProfile.label,
      selectedStyleProfile.label,
      t,
    ],
  );
  const playlistSummaryItems = useMemo(
    () => buildPlaylistSummaryItems(basePlaylist?.trackIds, availableTracks),
    [availableTracks, basePlaylist?.trackIds],
  );
  const basePlaylistEditorItems = useMemo(
    () => buildPlaylistEditorItems(basePlaylist?.trackIds, availableTracks),
    [availableTracks, basePlaylist?.trackIds],
  );
  const basePlaylistTrackOptions = useMemo(
    () => buildBasePlaylistTrackOptions(availableBaseTrackOptions, t.library.lost.toUpperCase()),
    [availableBaseTrackOptions, t.library.lost],
  );
  const savedPlaylistOptions = useMemo(
    () => buildSavedPlaylistOptions(availablePlaylists),
    [availablePlaylists],
  );
  const nowPlayingSummary = useMemo(
    () => buildNowPlayingSummary(liveEnabled, backgroundNowPlayingTrack, "Now playing"),
    [backgroundNowPlayingTrack, liveEnabled],
  );
  const upNextSummary = useMemo(
    () =>
      buildUpNextSummary(
        liveEnabled,
        backgroundTransitionNextTrack,
        backgroundTransitionPlan?.summary ?? null,
        "Up next",
      ),
    [backgroundTransitionNextTrack, backgroundTransitionPlan?.summary, liveEnabled],
  );
  const windowMetricGridItems = useMemo(
    () =>
      lastUpdate
        ? [
            {
              label: t.inspect.suggestedBpm,
              value:
                typeof lastUpdate.suggestedBpm === "number"
                  ? lastUpdate.suggestedBpm.toFixed(0)
                  : (repository.suggestedBpm?.toFixed(0) ?? t.inspect.pending),
            },
            {
              label: t.session.confidence,
              value: formatConfidence(lastUpdate.confidence),
            },
            {
              label: t.session.dominantLevel,
              value: lastUpdate.dominantLevel,
            },
            {
              label: t.inspect.chunkLines,
              value: String(lastUpdate.lineCount),
            },
            {
              label: t.inspect.errors,
              value: String(levelCount(currentLevelCounts, "error")),
            },
            {
              label: t.inspect.warnings,
              value: String(levelCount(currentLevelCounts, "warn")),
            },
            {
              label: t.inspect.info,
              value: String(levelCount(currentLevelCounts, "info")),
            },
            {
              label: t.inspect.tailWindow,
              value: `${formatCursor(lastUpdate.fromOffset)} → ${formatCursor(lastUpdate.toOffset)}`,
            },
          ]
        : [],
    [currentLevelCounts, lastUpdate, repository.suggestedBpm, t],
  );
  const ctaMetaLabel = resolveLiveMonitorCtaMeta({
    hasBaseListeningBed,
    baseTrackCount,
    soundsLabel: t.library.sounds,
    armedLabel: t.session.armed,
    notArmedLabel: t.session.notArmed,
    basePlaylistLabel: t.inspect.basePlaylist,
    styleLabel: selectedStyleProfile.label,
    mutationLabel: selectedMutationProfile.label,
  });

  if (!expanded && !liveEnabled) {
    return (
      <section className="panel live-monitor-cta">
        <div className="live-monitor-cta-content">
          <div>
            <h2>{t.inspect.liveMonitorDeckTitle}</h2>
            <p className="support-copy">{t.inspect.liveMonitorDeckCta}</p>
            <small className="monitor-cta-meta">{ctaMetaLabel}</small>
          </div>
          <button type="button" className="action" onClick={() => setExpanded(true)}>
            {t.inspect.liveMonitorDeckOpen}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel waveform-panel">
      <LiveLogMonitorHeader
        title={t.inspect.liveMonitorDeckTitle}
        subtitle={replayActive ? t.inspect.liveMonitorReplayCopy : t.inspect.liveMonitorLiveCopy}
        deckStatusLabel={deckStatusLabel}
        activeAdapterLabel={activeAdapterLabel}
        audioBadgeTone={audioBadgeTone}
        audioBadgeLabel={audioBadgeLabel}
        audioBadgeTitle={
          audioStatus === "ready" ? t.inspect.audioEngineActive : t.inspect.audioEngineBlocked
        }
        testAudioLabel={t.inspect.testAudio}
        liveEnabled={liveEnabled}
        stopLabel={replayActive ? t.session.exitReplay : t.inspect.stopMonitor}
        bounceAction={bounceAction}
        onEnsureAudioReady={() => void ensureAudioReady()}
        onPlayTestTone={() => void playPanelTestTone()}
        onStop={handleStop}
        onBounce={handleBounce}
      />

      <LiveLogMonitorSetupSection
        visible={!liveEnabled}
        t={t}
        adapterKind={adapterKind}
        adapterDescription={adapterDescription}
        adapterTarget={adapterTarget}
        selectedStyleProfileId={selectedStyleProfileId}
        selectedMutationProfileId={selectedMutationProfileId}
        selectedStyleProfile={selectedStyleProfile}
        selectedMutationProfile={selectedMutationProfile}
        forcedLiveMutationState={forcedLiveMutationState}
        hasBaseListeningBed={hasBaseListeningBed}
        baseTrackCount={baseTrackCount}
        adapterConfigured={adapterConfigured}
        cueEnginePreviewLabel={cueEnginePreviewLabel}
        liveMutationStateLabel={liveMutationStateLabel}
        error={error}
        isStarting={isStarting}
        pendingAddTrackId={pendingAddTrackId}
        pendingLoadPlaylistId={pendingLoadPlaylistId}
        basePlaylist={basePlaylist}
        basePlaylistTrackOptions={basePlaylistTrackOptions}
        savedPlaylistOptions={savedPlaylistOptions}
        basePlaylistEditorItems={basePlaylistEditorItems}
        availablePlaylists={availablePlaylists}
        availableTracks={availableTracks}
        setBasePlaylist={setBasePlaylist}
        setPendingAddTrackId={setPendingAddTrackId}
        setPendingLoadPlaylistId={setPendingLoadPlaylistId}
        setAdapterKind={setAdapterKind}
        setSelectedStyleProfileId={setSelectedStyleProfileId}
        setSelectedMutationProfileId={setSelectedMutationProfileId}
        setForcedLiveMutationState={setForcedLiveMutationState}
        onStart={handleStart}
      />

      <LiveLogMonitorLiveDeck
        liveEnabled={liveEnabled}
        hasBasePlaylist={(basePlaylist?.trackIds.length ?? 0) > 0}
        playlistSummaryProps={{
          label: t.inspect.basePlaylist,
          title: basePlaylist?.name ?? t.inspect.basePlaylist,
          nowPlayingLine: nowPlayingSummary,
          upNextLine: upNextSummary,
          profileDescription: `${selectedStyleProfile.description} ${selectedMutationProfile.description}`,
          items: playlistSummaryItems,
          lostLabel: t.library.lost.toUpperCase(),
        }}
        sessionCardProps={
          liveEnabled && monitor.session && sessionCardDisplay
            ? {
                replayActive,
                replayProgressAria: t.inspect.replayProgressAria,
                playbackPercent,
                repoTitle: monitor.session.repoTitle,
                display: sessionCardDisplay,
              }
            : null
        }
        replaySectionProps={{
          replayActive,
          playbackProgress: monitor.playbackProgress,
          playbackPercent,
          playbackWindowLabel,
          isPlaybackPaused: monitor.isPlaybackPaused,
          playbackEventCount: monitor.playbackEventCount,
          playbackEventIndex: monitor.playbackEventIndex,
          replaySessionId,
          activeReplayBookmark,
          sortedSessionBookmarks,
          bookmarkLabelDraft,
          bookmarkNoteDraft,
          bookmarkTagDraft,
          bookmarkStyleProfileIdDraft,
          bookmarkMutationProfileIdDraft,
          bookmarkBusy,
          bookmarkError,
          replayFeedbackRecommendation,
          labels: {
            sceneAlreadyAligned: t.inspect.sceneAlreadyAligned,
            applyFeedbackMix: t.inspect.applyFeedbackMix,
          },
          onStepWindow: (direction) => monitor.stepPlaybackWindow(direction),
          onTogglePause: () =>
            monitor.isPlaybackPaused ? monitor.resumePlayback() : monitor.pausePlayback(),
          onSeekProgress: (progress) => monitor.seekPlaybackProgress(progress),
          onBookmarkLabelChange: (event) => setBookmarkLabelDraft(event.target.value),
          onBookmarkNoteChange: (event) => setBookmarkNoteDraft(event.target.value),
          onBookmarkTagToggle: (tagId) =>
            setBookmarkTagDraft((current) => (current === tagId ? null : tagId)),
          onBookmarkStyleProfileChange: (event) =>
            setBookmarkStyleProfileIdDraft(event.target.value || null),
          onBookmarkMutationProfileChange: (event) =>
            setBookmarkMutationProfileIdDraft(event.target.value || null),
          onCaptureCurrentScene: captureCurrentScene,
          onSaveBookmark: () => void saveReplayBookmark(),
          onDeleteCurrentBookmark: () => {
            if (!activeReplayBookmark) {
              return;
            }
            void deleteReplayBookmark(activeReplayBookmark);
          },
          onJumpToBookmark: handleJumpToBookmark,
          onApplyBookmarkSuggestion: handleApplyBookmarkSuggestion,
          onDeleteBookmark: (bookmark) => void deleteReplayBookmark(bookmark),
          onApplyReplayFeedbackRecommendation: handleApplyReplayFeedbackRecommendation,
        }}
        operationsPanelProps={{
          metricGridItems,
          masterVolume,
          replayActive,
          repositorySourcePath: repository.sourcePath,
          labels: {
            masterVolume: t.inspect.masterVolume,
            masterVolumeAria: t.inspect.masterVolumeAria,
            muteAction: t.inspect.muteAction,
            unmuteAction: t.inspect.unmuteAction,
            replaySourcePath: t.inspect.replaySourcePath,
            liveSourcePath: t.inspect.liveSourcePath,
          },
          onSetMasterVolume: handleSetMasterVolume,
          onToggleMute: handleToggleMute,
          scenePanel: (
            <LiveSonificationScenePanel
              availableBaseAssets={availableBaseAssets}
              availableCompositions={availableCompositions}
              sceneBaseAssetId={sceneBaseAssetId}
              sceneCompositionId={sceneCompositionId}
              onSceneBaseAssetIdChange={setSceneBaseAssetId}
              onSceneCompositionIdChange={setSceneCompositionId}
              scene={scene}
            />
          ),
          routingPanel: (
            <ComponentRoutingPanel
              knownComponents={knownComponents}
              overrides={componentOverrides}
              liveActive={monitor.session?.repoId === repository.id}
              onOverrideChange={(component, override) =>
                setComponentOverrides((current) => {
                  const next = new Map(current);
                  next.set(component, override);
                  return next;
                })
              }
            />
          ),
        }}
        activeDeckContent={
          <LiveLogMonitorDeckSection
            hasUpdate={Boolean(lastUpdate)}
            emptyStateLabel={t.inspect.startLiveTailHint}
            activityPanelProps={{
              waveform: (
                <LiveWaveformCanvas
                  analyserRef={analyserRef}
                  active={liveEnabled}
                  accentColor={scene.genreId === "tropical-house" ? "#ef7f45" : "#21b4b8"}
                  isAnomaly={isAnomalyFlash}
                />
              ),
              recentCues,
              waveAnomalyMarkers,
              liveSourceLabel,
              recentSyncTailRows,
              anomalySourceRows,
              activeTailWindowId,
              syncTailListRef,
              isTropicalTheme: scene.genreId === "tropical-house",
              maxRecentCues: MAX_RECENT_CUES,
              maxSyncTailLines: MAX_SYNC_TAIL_LINES,
              maxAnomalySourceLines: MAX_ANOMALY_SOURCE_LINES,
              labels: {
                liveSystemRhythm: t.inspect.liveSystemRhythm,
                liveSystemRhythmCopy: t.inspect.liveSystemRhythmCopy,
                awaitingSystemPulse: t.inspect.awaitingSystemPulse,
                idleUpper: t.inspect.idleUpper,
                waveAnomalyMarkers: t.inspect.waveAnomalyMarkers,
                noAnomalyMarkersLatestWindows: t.inspect.noAnomalyMarkersLatestWindows,
                waveSourceStream: t.inspect.waveSourceStream,
                streamTailSync: t.inspect.streamTailSync,
                syncTailAria: t.inspect.syncTailAria,
                waitingSynchronizedLines: t.inspect.waitingSynchronizedLines,
                anomalySourceLines: t.inspect.anomalySourceLines,
                anomalySourceAria: t.inspect.anomalySourceAria,
                noAnomalyProducingLine: t.inspect.noAnomalyProducingLine,
              },
            }}
            windowSummaryLabel={t.inspect.currentWindowSummary}
            windowSummary={lastUpdate?.summary ?? ""}
            windowMetrics={windowMetricGridItems}
            activeComponentsTitle={t.inspect.activeComponentsTitle}
            activeComponentsCopy={t.inspect.activeComponentsCopy}
            activeComponents={lastUpdate?.topComponents ?? []}
            tracePanelProps={{
              replayActive,
              playbackEventIndex: monitor.playbackEventIndex,
              traceWaveformTrack,
              traceWaveformExplanations,
              traceWaveformCues,
              traceWaveformCurrentTime:
                selectedTraceExplanation?.trackSecond ?? backgroundPlayheadSecond,
              recentExplanations,
              selectedExplanationId,
              onSelectExplanation: (explanation) => {
                const selectionState = resolveTraceExplanationSelection({
                  replayActive,
                  playbackEventCount: monitor.playbackEventCount,
                  explanation,
                });

                if (selectionState.shouldPausePlayback) {
                  monitor.pausePlayback();
                }
                if (selectionState.nextPlaybackProgress !== null) {
                  monitor.seekPlaybackProgress(selectionState.nextPlaybackProgress);
                }
                setSelectedExplanationId(selectionState.nextSelectedExplanationId);
                if (selectionState.nextBackgroundPlayheadSecond !== null) {
                  setBackgroundPlayheadSecond(selectionState.nextBackgroundPlayheadSecond);
                }
              },
            }}
            performanceSummaryProps={{
              recentVoices,
              recentCues,
              recentMarkers,
              recentWarnings,
              error,
              labels: {
                arrangementLayers: t.inspect.arrangementLayers,
                arrangementLayersCopy: t.inspect.arrangementLayersCopy,
                noArrangementVoices: t.inspect.noArrangementVoices,
                padSequencerTitle: t.inspect.padSequencerTitle,
                padSequencerCopy: t.inspect.padSequencerCopy,
                recentCuesTitle: t.inspect.recentCuesTitle,
                recentCuesCopy: t.inspect.recentCuesCopy,
                noLiveCues: t.inspect.noLiveCues,
                recentAnomalyMarkersTitle: t.inspect.recentAnomalyMarkersTitle,
                recentAnomalyMarkersCopy: t.inspect.recentAnomalyMarkersCopy,
                eventLabel: t.inspect.eventLabel,
                noAnomalyMarkersSession: t.inspect.noAnomalyMarkersSession,
                monitorNotesTitle: t.inspect.monitorNotesTitle,
                monitorNotesCopy: t.inspect.monitorNotesCopy,
                runtimeError: t.inspect.runtimeError,
                monitorNoteLabel: t.inspect.monitorNoteLabel,
              },
            }}
            sequencerPanelProps={{
              bpm: beatClockBpm ?? repository.suggestedBpm ?? 120,
              recentVoices,
              onStepFire: handleSequencerStepFire,
            }}
          />
        }
      />
    </section>
  );
}
