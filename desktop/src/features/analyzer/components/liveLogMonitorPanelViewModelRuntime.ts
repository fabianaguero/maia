import type { AppTranslations } from "../../../i18n/en";
import type { BaseTrackPlaylist, LibraryTrack, LiveLogStreamUpdate } from "../../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../../monitor/monitorContextTypes";
import type { AudioEngineStatus, SampleEngineStatus } from "./liveLogMonitorViewModel";
import {
  buildMetricGridItems,
  resolveBounceActionLabel,
  resolveCueEngineStateLabel,
  resolveSessionCardDisplay,
  type MetricGridItem,
  type SessionCardDisplay,
} from "./liveLogMonitorDisplayRuntime";
import {
  buildBasePlaylistTrackOptions,
  buildNowPlayingSummary,
  buildPlaylistEditorItems,
  buildPlaylistSummaryItems,
  buildSavedPlaylistOptions,
  buildUpNextSummary,
} from "./liveLogMonitorPlaylistViewState";
import { formatConfidence, formatCursor, levelCount } from "./liveLogMonitorPanelRuntime";
import { resolveLiveMonitorCtaMeta } from "./liveLogMonitorSessionRuntime";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";

export interface LiveLogMonitorPanelStatusStateInput {
  t: AppTranslations;
  replayActive: boolean;
  liveEnabled: boolean;
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
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  repositorySuggestedBpm: number | null;
  session: ActiveMonitorSession | null;
  playbackPercent: number | null;
  currentLevelCounts: Record<string, number>;
  lastUpdate: LiveLogStreamUpdate | null;
  audioStateLabel: string;
}

export interface LiveLogMonitorPanelStatusState {
  bounceAction: { label: string; title: string } | null;
  cueEngineStateLabel: string;
  sessionCardDisplay: SessionCardDisplay | null;
  metricGridItems: MetricGridItem[];
  windowMetricGridItems: MetricGridItem[];
  ctaMetaLabel: string;
}

export function buildLiveLogMonitorPanelStatusState(
  input: LiveLogMonitorPanelStatusStateInput,
): LiveLogMonitorPanelStatusState {
  const bounceAction = resolveBounceActionLabel(input.bounceWindowCount, input.bounceWindowSeconds);
  const cueEngineStateLabel = resolveCueEngineStateLabel({
    sampleStatus: input.sampleStatus,
    sampleSourceCount: input.sampleSourceCount,
    labels: {
      cueEngineBaseSamplePack: input.t.inspect.cueEngineBaseSamplePack,
      cueEngineBaseSample: input.t.inspect.cueEngineBaseSample,
      cueEngineLoadingSample: input.t.inspect.cueEngineLoadingSample,
      cueEngineInternalSynth: input.t.inspect.cueEngineInternalSynth,
    },
  });
  const sessionCardDisplay =
    input.liveEnabled && input.session
      ? resolveSessionCardDisplay({
          session: input.session,
          replayActive: input.replayActive,
          playbackPercent: input.playbackPercent,
          windowsHeard: input.metrics.windowCount,
          labels: {
            replaySessionTitle: input.t.inspect.replaySession,
            sessionTitle: input.t.inspect.sessionLabel,
            storedSourceReplay: input.t.inspect.storedSourceReplay,
            fallbackDirectFilePoll: input.t.inspect.fallbackDirectFilePoll,
            replayComplete: input.t.session.complete,
            windowsReplayed: input.t.inspect.windowsReplayed,
          },
        })
      : null;
  const metricGridItems = buildMetricGridItems({
    replayActive: input.replayActive,
    replaySessionTitle: input.t.inspect.replaySession,
    activeAdapterLabel: input.activeAdapterLabel,
    audioStateLabel: input.audioStateLabel,
    styleProfileLabel: input.selectedStyleProfileLabel,
    mutationProfileLabel: input.selectedMutationProfileLabel,
    cueEngineStateLabel,
    playbackWindowLabel: input.playbackWindowLabel,
    windowsHeard: input.metrics.windowCount,
    cuesEmitted: input.emittedCueCount,
    processedLines: input.metrics.processedLines,
    anomaliesHeard: input.metrics.totalAnomalies,
    beatClockBpm: input.beatClockBpm,
    voicesEmitted: input.emittedVoiceCount,
    beatLooperActive: input.beatLooperActive,
    labels: {
      modeLabel: input.t.inspect.mode,
      audioEngineLabel: input.t.simpleMode.monitor.audioEngine,
      styleProfileTitle: input.t.inspect.styleProfileTitle,
      mutationProfileTitle: input.t.inspect.mutationProfileTitle,
      cueEngineLabel: input.t.inspect.cueEngineLabel,
      windowsHeardLabel: input.t.inspect.windowsHeard,
      cuesEmittedLabel: input.t.inspect.cuesEmitted,
      linesProcessedLabel: input.t.session.linesProcessed,
      anomaliesHeardLabel: input.t.inspect.anomaliesHeard,
      beatClockLabel: input.t.inspect.beatClock,
      freeLabel: input.t.inspect.free,
      voicesEmittedLabel: input.t.inspect.voicesEmitted,
      rhythmPulseLabel: input.t.inspect.rhythmPulse,
      activeLabel: input.t.session.active,
      offLabel: input.t.inspect.off,
    },
  });
  const windowMetricGridItems = input.lastUpdate
    ? [
        {
          label: input.t.inspect.suggestedBpm,
          value:
            typeof input.lastUpdate.suggestedBpm === "number"
              ? input.lastUpdate.suggestedBpm.toFixed(0)
              : (input.repositorySuggestedBpm?.toFixed(0) ?? input.t.inspect.pending),
        },
        {
          label: input.t.session.confidence,
          value: formatConfidence(input.lastUpdate.confidence),
        },
        {
          label: input.t.session.dominantLevel,
          value: input.lastUpdate.dominantLevel,
        },
        {
          label: input.t.inspect.chunkLines,
          value: String(input.lastUpdate.lineCount),
        },
        {
          label: input.t.inspect.errors,
          value: String(levelCount(input.currentLevelCounts, "error")),
        },
        {
          label: input.t.inspect.warnings,
          value: String(levelCount(input.currentLevelCounts, "warn")),
        },
        {
          label: input.t.inspect.info,
          value: String(levelCount(input.currentLevelCounts, "info")),
        },
        {
          label: input.t.inspect.tailWindow,
          value: `${formatCursor(input.lastUpdate.fromOffset)} -> ${formatCursor(input.lastUpdate.toOffset)}`,
        },
      ]
    : [];
  const ctaMetaLabel = resolveLiveMonitorCtaMeta({
    hasBaseListeningBed: input.hasBaseListeningBed,
    baseTrackCount: input.baseTrackCount,
    soundsLabel: input.t.library.sounds,
    armedLabel: input.t.session.armed,
    notArmedLabel: input.t.session.notArmed,
    basePlaylistLabel: input.t.inspect.basePlaylist,
    styleLabel: input.selectedStyleProfileLabel,
    mutationLabel: input.selectedMutationProfileLabel,
  });

  return {
    bounceAction,
    cueEngineStateLabel,
    sessionCardDisplay,
    metricGridItems,
    windowMetricGridItems,
    ctaMetaLabel,
  };
}

export interface LiveLogMonitorPanelPlaylistStateInput {
  availableTracks: LibraryTrack[];
  availableBaseTrackOptions: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  basePlaylist: BaseTrackPlaylist | null;
  backgroundNowPlayingTrack: LibraryTrack | null;
  backgroundTransitionNextTrack: LibraryTrack | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
  liveEnabled: boolean;
  nowPlayingLabel: string;
  upNextLabel: string;
  lostLabel: string;
}

export interface LiveLogMonitorPanelPlaylistState {
  playlistSummaryItems: ReturnType<typeof buildPlaylistSummaryItems>;
  basePlaylistEditorItems: ReturnType<typeof buildPlaylistEditorItems>;
  basePlaylistTrackOptions: ReturnType<typeof buildBasePlaylistTrackOptions>;
  savedPlaylistOptions: ReturnType<typeof buildSavedPlaylistOptions>;
  nowPlayingSummary: string | null;
  upNextSummary: string | null;
}

export function buildLiveLogMonitorPanelPlaylistState(
  input: LiveLogMonitorPanelPlaylistStateInput,
): LiveLogMonitorPanelPlaylistState {
  return {
    playlistSummaryItems: buildPlaylistSummaryItems(
      input.basePlaylist?.trackIds,
      input.availableTracks,
    ),
    basePlaylistEditorItems: buildPlaylistEditorItems(
      input.basePlaylist?.trackIds,
      input.availableTracks,
    ),
    basePlaylistTrackOptions: buildBasePlaylistTrackOptions(
      input.availableBaseTrackOptions,
      input.lostLabel,
    ),
    savedPlaylistOptions: buildSavedPlaylistOptions(input.availablePlaylists),
    nowPlayingSummary: buildNowPlayingSummary(
      input.liveEnabled,
      input.backgroundNowPlayingTrack,
      input.nowPlayingLabel,
    ),
    upNextSummary: buildUpNextSummary(
      input.liveEnabled,
      input.backgroundTransitionNextTrack,
      input.backgroundTransitionPlan?.summary ?? null,
      input.upNextLabel,
    ),
  };
}
