import type { AppTranslations } from "../../../i18n/en";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  LiveLogMarker,
  LiveLogStreamUpdate,
} from "../../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../../monitor/monitorContextTypes";
import type {
  AudioEngineStatus,
  SampleEngineStatus,
} from "./liveLogMonitorViewModel";
import {
  buildLiveMonitorDisplayState,
  type MetricGridItem,
  type SessionCardDisplay,
} from "./liveLogMonitorDisplayRuntime";
import { type SyncTailRow } from "./liveLogMonitorPanelRuntime";
import {
  buildLiveLogMonitorPanelPlaylistState,
  buildLiveLogMonitorPanelStatusState,
  type LiveLogMonitorPanelPlaylistState,
  type LiveLogMonitorPanelStatusState,
} from "./liveLogMonitorPanelViewModelRuntime";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
export interface LiveLogMonitorPanelViewModelInput {
  t: AppTranslations;
  lastUpdate: LiveLogStreamUpdate | null;
  recentMarkers: LiveLogMarker[];
  syncTailRows: SyncTailRow[];
  replayActive: boolean;
  liveEnabled: boolean;
  repositorySourcePath: string;
  repositorySuggestedBpm: number | null;
  audioStatus: AudioEngineStatus;
  bounceWindowCount: number;
  bounceWindowSeconds: number;
  sampleStatus: SampleEngineStatus;
  sampleSourceCount: number;
  activeAdapterLabel: string;
  selectedStyleProfileLabel: string;
  selectedMutationProfileLabel: string;
  playbackWindowLabel: string | null;
  metrics: MonitorMetrics;
  emittedCueCount: number;
  emittedVoiceCount: number;
  beatClockBpm: number | null;
  beatLooperActive: boolean;
  availableTracks: LibraryTrack[];
  availableBaseTrackOptions: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  basePlaylist: BaseTrackPlaylist | null;
  backgroundNowPlayingTrack: LibraryTrack | null;
  backgroundTransitionNextTrack: LibraryTrack | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  playbackPercent: number | null;
  session: ActiveMonitorSession | null;
  maxSyncTailLines: number;
  maxAnomalySourceLines: number;
}

export interface LiveLogMonitorPanelViewModel {
  currentLevelCounts: Record<string, number>;
  anomalySourceRows: ReturnType<typeof buildLiveMonitorDisplayState>["anomalySourceRows"];
  waveAnomalyMarkers: LiveLogMarker[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  deckStatusLabel: string;
  audioStateLabel: string;
  audioBadgeLabel: string;
  audioBadgeTone: "ready" | "warn";
  bounceAction: { label: string; title: string } | null;
  cueEngineStateLabel: string;
  sessionCardDisplay: SessionCardDisplay | null;
  metricGridItems: MetricGridItem[];
  playlistSummaryItems: LiveLogMonitorPanelPlaylistState["playlistSummaryItems"];
  basePlaylistEditorItems: LiveLogMonitorPanelPlaylistState["basePlaylistEditorItems"];
  basePlaylistTrackOptions: LiveLogMonitorPanelPlaylistState["basePlaylistTrackOptions"];
  savedPlaylistOptions: LiveLogMonitorPanelPlaylistState["savedPlaylistOptions"];
  nowPlayingSummary: string | null;
  upNextSummary: string | null;
  windowMetricGridItems: MetricGridItem[];
  ctaMetaLabel: string;
}

export function buildLiveLogMonitorPanelViewModel(
  input: LiveLogMonitorPanelViewModelInput,
): LiveLogMonitorPanelViewModel {
  const displayState = buildLiveMonitorDisplayState({
    lastUpdate: input.lastUpdate,
    recentMarkers: input.recentMarkers,
    syncTailRows: input.syncTailRows,
    maxSyncTailLines: input.maxSyncTailLines,
    maxAnomalySourceLines: input.maxAnomalySourceLines,
    replayActive: input.replayActive,
    liveEnabled: input.liveEnabled,
    repositorySourcePath: input.repositorySourcePath,
    audioStatus: input.audioStatus,
    labels: {
      replayLabel: input.t.session.replay,
      liveLabel: input.t.appShell.live,
      stoppedLabel: input.t.session.stopped,
      audioUnavailable: input.t.inspect.audioStateUnavailable,
      audioError: input.t.inspect.audioStateError,
      audioActive: input.t.inspect.audioStateActive,
      audioArmed: input.t.inspect.audioStateArmed,
      audioIdle: input.t.inspect.audioStateIdle,
      audioOn: input.t.inspect.audioOn,
      audioBlocked: input.t.inspect.audioBlocked,
    },
  });

  const statusState: LiveLogMonitorPanelStatusState = buildLiveLogMonitorPanelStatusState({
    t: input.t,
    replayActive: input.replayActive,
    liveEnabled: input.liveEnabled,
    audioStatus: input.audioStatus,
    bounceWindowCount: input.bounceWindowCount,
    bounceWindowSeconds: input.bounceWindowSeconds,
    sampleStatus: input.sampleStatus,
    sampleSourceCount: input.sampleSourceCount,
    activeAdapterLabel: input.activeAdapterLabel,
    selectedStyleProfileLabel: input.selectedStyleProfileLabel,
    selectedMutationProfileLabel: input.selectedMutationProfileLabel,
    playbackWindowLabel: input.playbackWindowLabel,
    metrics: input.metrics,
    emittedCueCount: input.emittedCueCount,
    emittedVoiceCount: input.emittedVoiceCount,
    beatClockBpm: input.beatClockBpm,
    beatLooperActive: input.beatLooperActive,
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    repositorySuggestedBpm: input.repositorySuggestedBpm,
    session: input.session,
    playbackPercent: input.playbackPercent,
    currentLevelCounts: displayState.currentLevelCounts,
    lastUpdate: input.lastUpdate,
    audioStateLabel: displayState.audioStateLabel,
  });
  const playlistState: LiveLogMonitorPanelPlaylistState = buildLiveLogMonitorPanelPlaylistState({
    availableTracks: input.availableTracks,
    availableBaseTrackOptions: input.availableBaseTrackOptions,
    availablePlaylists: input.availablePlaylists,
    basePlaylist: input.basePlaylist,
    backgroundNowPlayingTrack: input.backgroundNowPlayingTrack,
    backgroundTransitionNextTrack: input.backgroundTransitionNextTrack,
    backgroundTransitionPlan: input.backgroundTransitionPlan,
    liveEnabled: input.liveEnabled,
    nowPlayingLabel: input.t.appShell.nowPlaying,
    upNextLabel: input.t.appShell.upNext,
    lostLabel: input.t.library.lost.toUpperCase(),
  });

  return {
    ...displayState,
    ...statusState,
    ...playlistState,
  };
}
