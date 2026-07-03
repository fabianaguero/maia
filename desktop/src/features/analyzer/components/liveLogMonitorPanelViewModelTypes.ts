import type { AppTranslations } from "../../../i18n/en";
import type {
  BaseTrackPlaylist,
  LibraryTrack,
  LiveLogMarker,
  LiveLogStreamUpdate,
} from "../../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../../monitor/monitorContextTypes";
import type { AudioEngineStatus, SampleEngineStatus } from "./liveLogMonitorViewModel";
import {
  buildLiveMonitorDisplayState,
  type MetricGridItem,
  type SessionCardDisplay,
} from "./liveLogMonitorDisplayRuntime";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import type { LiveLogMonitorPanelPlaylistState } from "./liveLogMonitorPanelViewModelRuntime";
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
