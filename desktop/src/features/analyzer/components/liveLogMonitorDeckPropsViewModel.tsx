import type { ChangeEvent, ComponentProps, ReactNode } from "react";

import type { SessionBookmark } from "../../../api/sessions";
import type {
  SessionCardDisplay,
  MetricGridItem,
  LiveMonitorDisplayState,
} from "./liveLogMonitorDisplayRuntime";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { LiveLogMarker, LibraryTrack, VisualizationCuePoint } from "../../../types/library";
import type { SyncTailRow } from "./liveLogMonitorPanelRuntime";
import type { AppTranslations } from "../../../i18n/en";
import type { ReplayFeedbackRecommendation } from "../../../utils/replayFeedback";
import type { RoutedLiveCue, ArrangementVoice } from "./liveSonificationScene";
import { LiveLogMonitorDeckSection } from "./LiveLogMonitorDeckSection";
import type { LiveLogMonitorLiveDeck } from "./LiveLogMonitorLiveDeck";
import { LiveWaveformCanvas } from "./LiveWaveformCanvas";
import { LiveSonificationScenePanel } from "./LiveSonificationScenePanel";
import { ComponentRoutingPanel } from "./ComponentRoutingPanel";
import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import type { ComponentOverride } from "./liveSonificationScene";

export interface BuildLiveLogMonitorDeckSectionContentInput {
  t: AppTranslations;
  liveEnabled: boolean;
  replayActive: boolean;
  playbackEventIndex: number | null;
  beatClockBpm: number | null;
  repositorySuggestedBpm: number | null;
  sceneGenreId: string;
  isAnomalyFlash: boolean;
  traceWaveformTrack: LibraryTrack | null;
  traceWaveformExplanations: LiveMutationExplanation[];
  traceWaveformCues: VisualizationCuePoint[];
  traceWaveformCurrentTime: number;
  recentExplanations: LiveMutationExplanation[];
  selectedExplanationId: string | null;
  recentCues: RoutedLiveCue[];
  recentVoices: ArrangementVoice[];
  recentMarkers: LiveLogMarker[];
  recentWarnings: string[];
  error: string | null;
  lastUpdateSummary: string;
  lastUpdateTopComponents: Array<{ component: string; count: number }>;
  windowMetricGridItems: MetricGridItem[];
  waveAnomalyMarkers: LiveLogMarker[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  anomalySourceRows: LiveMonitorDisplayState["anomalySourceRows"];
  activeTailWindowId: string | null;
  syncTailListRef: ComponentProps<
    typeof LiveLogMonitorDeckSection
  >["activityPanelProps"]["syncTailListRef"];
  analyserRef: ComponentProps<typeof LiveWaveformCanvas>["analyserRef"];
  onSelectExplanation: (explanation: LiveMutationExplanation) => void;
  onSequencerStepFire: ComponentProps<
    typeof LiveLogMonitorDeckSection
  >["sequencerPanelProps"]["onStepFire"];
}

export function buildLiveLogMonitorDeckSectionContent(
  input: BuildLiveLogMonitorDeckSectionContentInput,
): ReactNode {
  const accentColor = input.sceneGenreId === "tropical-house" ? "#ef7f45" : "#21b4b8";

  return (
    <LiveLogMonitorDeckSection
      hasUpdate={Boolean(input.lastUpdateSummary)}
      emptyStateLabel={input.t.inspect.startLiveTailHint}
      activityPanelProps={{
        waveform: (
          <LiveWaveformCanvas
            analyserRef={input.analyserRef}
            active={input.liveEnabled}
            accentColor={accentColor}
            isAnomaly={input.isAnomalyFlash}
          />
        ),
        recentCues: input.recentCues,
        waveAnomalyMarkers: input.waveAnomalyMarkers,
        liveSourceLabel: input.liveSourceLabel,
        recentSyncTailRows: input.recentSyncTailRows,
        anomalySourceRows: input.anomalySourceRows,
        activeTailWindowId: input.activeTailWindowId,
        syncTailListRef: input.syncTailListRef,
        isTropicalTheme: input.sceneGenreId === "tropical-house",
        maxRecentCues: 8,
        maxSyncTailLines: 60,
        maxAnomalySourceLines: 6,
        labels: {
          liveSystemRhythm: input.t.inspect.liveSystemRhythm,
          liveSystemRhythmCopy: input.t.inspect.liveSystemRhythmCopy,
          awaitingSystemPulse: input.t.inspect.awaitingSystemPulse,
          idleUpper: input.t.inspect.idleUpper,
          waveAnomalyMarkers: input.t.inspect.waveAnomalyMarkers,
          noAnomalyMarkersLatestWindows: input.t.inspect.noAnomalyMarkersLatestWindows,
          waveSourceStream: input.t.inspect.waveSourceStream,
          streamTailSync: input.t.inspect.streamTailSync,
          syncTailAria: input.t.inspect.syncTailAria,
          waitingSynchronizedLines: input.t.inspect.waitingSynchronizedLines,
          anomalySourceLines: input.t.inspect.anomalySourceLines,
          anomalySourceAria: input.t.inspect.anomalySourceAria,
          noAnomalyProducingLine: input.t.inspect.noAnomalyProducingLine,
        },
      }}
      windowSummaryLabel={input.t.inspect.currentWindowSummary}
      windowSummary={input.lastUpdateSummary}
      windowMetrics={input.windowMetricGridItems}
      activeComponentsTitle={input.t.inspect.activeComponentsTitle}
      activeComponentsCopy={input.t.inspect.activeComponentsCopy}
      activeComponents={input.lastUpdateTopComponents}
      tracePanelProps={{
        replayActive: input.replayActive,
        playbackEventIndex: input.playbackEventIndex,
        traceWaveformTrack: input.traceWaveformTrack,
        traceWaveformExplanations: input.traceWaveformExplanations,
        traceWaveformCues: input.traceWaveformCues,
        traceWaveformCurrentTime: input.traceWaveformCurrentTime,
        recentExplanations: input.recentExplanations,
        selectedExplanationId: input.selectedExplanationId,
        onSelectExplanation: input.onSelectExplanation,
      }}
      performanceSummaryProps={{
        recentVoices: input.recentVoices,
        recentCues: input.recentCues,
        recentMarkers: input.recentMarkers,
        recentWarnings: input.recentWarnings,
        error: input.error,
        labels: {
          arrangementLayers: input.t.inspect.arrangementLayers,
          arrangementLayersCopy: input.t.inspect.arrangementLayersCopy,
          noArrangementVoices: input.t.inspect.noArrangementVoices,
          padSequencerTitle: input.t.inspect.padSequencerTitle,
          padSequencerCopy: input.t.inspect.padSequencerCopy,
          recentCuesTitle: input.t.inspect.recentCuesTitle,
          recentCuesCopy: input.t.inspect.recentCuesCopy,
          noLiveCues: input.t.inspect.noLiveCues,
          recentAnomalyMarkersTitle: input.t.inspect.recentAnomalyMarkersTitle,
          recentAnomalyMarkersCopy: input.t.inspect.recentAnomalyMarkersCopy,
          eventLabel: input.t.inspect.eventLabel,
          noAnomalyMarkersSession: input.t.inspect.noAnomalyMarkersSession,
          monitorNotesTitle: input.t.inspect.monitorNotesTitle,
          monitorNotesCopy: input.t.inspect.monitorNotesCopy,
          runtimeError: input.t.inspect.runtimeError,
          monitorNoteLabel: input.t.inspect.monitorNoteLabel,
        },
      }}
      sequencerPanelProps={{
        bpm: input.beatClockBpm ?? input.repositorySuggestedBpm ?? 120,
        recentVoices: input.recentVoices,
        onStepFire: input.onSequencerStepFire,
      }}
    />
  );
}

export interface BuildLiveLogMonitorLiveDeckPropsInput {
  t: AppTranslations;
  liveEnabled: boolean;
  basePlaylistName: string | null;
  hasBasePlaylist: boolean;
  replayActive: boolean;
  playbackProgress: number | null;
  playbackPercent: number | null;
  playbackWindowLabel: string | null;
  isPlaybackPaused: boolean;
  playbackEventCount: number | null;
  playbackEventIndex: number | null;
  replaySessionId: string | null;
  sessionRepoTitle: string | null;
  sessionCardDisplay: SessionCardDisplay | null;
  metricGridItems: MetricGridItem[];
  masterVolume: number;
  repositorySourcePath: string;
  playlistSummaryItems: ComponentProps<
    typeof LiveLogMonitorLiveDeck
  >["playlistSummaryProps"]["items"];
  nowPlayingSummary: string | null;
  upNextSummary: string | null;
  selectedStyleProfileDescription: string;
  selectedMutationProfileDescription: string;
  activeReplayBookmark: SessionBookmark | null;
  sortedSessionBookmarks: SessionBookmark[];
  bookmarkLabelDraft: string;
  bookmarkNoteDraft: string;
  bookmarkTagDraft: string | null;
  bookmarkStyleProfileIdDraft: string | null;
  bookmarkMutationProfileIdDraft: string | null;
  bookmarkBusy: boolean;
  bookmarkError: string | null;
  replayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  activeDeckContent: ReactNode;
  scenePanel: ReactNode;
  routingPanel: ReactNode;
  onSetMasterVolume: (nextVolume: number) => void;
  onToggleMute: () => void;
  onStepWindow: (direction: -1 | 1) => void;
  onTogglePause: () => void;
  onSeekProgress: (progress: number) => void;
  onBookmarkLabelChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBookmarkNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onBookmarkTagToggle: (tagId: string) => void;
  onBookmarkStyleProfileChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onBookmarkMutationProfileChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onCaptureCurrentScene: () => void;
  onSaveBookmark: () => void;
  onDeleteCurrentBookmark: () => void;
  onJumpToBookmark: (bookmark: SessionBookmark) => void;
  onApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  onDeleteBookmark: (bookmark: SessionBookmark) => void;
  onApplyReplayFeedbackRecommendation: () => void;
}

export interface BuildLiveLogMonitorScenePanelInput {
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  scene: ComponentProps<typeof LiveSonificationScenePanel>["scene"];
  onSceneBaseAssetIdChange: (value: string) => void;
  onSceneCompositionIdChange: (value: string) => void;
}

export function buildLiveLogMonitorScenePanel(
  input: BuildLiveLogMonitorScenePanelInput,
): ReactNode {
  return (
    <LiveSonificationScenePanel
      availableBaseAssets={input.availableBaseAssets}
      availableCompositions={input.availableCompositions}
      sceneBaseAssetId={input.sceneBaseAssetId}
      sceneCompositionId={input.sceneCompositionId}
      onSceneBaseAssetIdChange={input.onSceneBaseAssetIdChange}
      onSceneCompositionIdChange={input.onSceneCompositionIdChange}
      scene={input.scene}
    />
  );
}

export interface BuildLiveLogMonitorRoutingPanelInput {
  knownComponents: string[];
  overrides: Map<string, ComponentOverride>;
  liveActive: boolean;
  onOverrideChange: (component: string, override: ComponentOverride) => void;
}

export function buildLiveLogMonitorRoutingPanel(
  input: BuildLiveLogMonitorRoutingPanelInput,
): ReactNode {
  return (
    <ComponentRoutingPanel
      knownComponents={input.knownComponents}
      overrides={input.overrides}
      liveActive={input.liveActive}
      onOverrideChange={input.onOverrideChange}
    />
  );
}

export function buildLiveLogMonitorLiveDeckProps(
  input: BuildLiveLogMonitorLiveDeckPropsInput,
): ComponentProps<typeof LiveLogMonitorLiveDeck> {
  return {
    liveEnabled: input.liveEnabled,
    hasBasePlaylist: input.hasBasePlaylist,
    playlistSummaryProps: {
      label: input.t.inspect.basePlaylist,
      title: input.basePlaylistName ?? input.t.inspect.basePlaylist,
      nowPlayingLine: input.nowPlayingSummary,
      upNextLine: input.upNextSummary,
      profileDescription: `${input.selectedStyleProfileDescription} ${input.selectedMutationProfileDescription}`,
      items: input.playlistSummaryItems,
      lostLabel: input.t.library.lost.toUpperCase(),
    },
    sessionCardProps:
      input.liveEnabled && input.sessionRepoTitle && input.sessionCardDisplay
        ? {
            replayActive: input.replayActive,
            replayProgressAria: input.t.inspect.replayProgressAria,
            playbackPercent: input.playbackPercent,
            repoTitle: input.sessionRepoTitle,
            display: input.sessionCardDisplay,
          }
        : null,
    replaySectionProps: {
      replayActive: input.replayActive,
      playbackProgress: input.playbackProgress,
      playbackPercent: input.playbackPercent,
      playbackWindowLabel: input.playbackWindowLabel,
      isPlaybackPaused: input.isPlaybackPaused,
      playbackEventCount: input.playbackEventCount,
      playbackEventIndex: input.playbackEventIndex,
      replaySessionId: input.replaySessionId,
      activeReplayBookmark: input.activeReplayBookmark,
      sortedSessionBookmarks: input.sortedSessionBookmarks,
      bookmarkLabelDraft: input.bookmarkLabelDraft,
      bookmarkNoteDraft: input.bookmarkNoteDraft,
      bookmarkTagDraft: input.bookmarkTagDraft,
      bookmarkStyleProfileIdDraft: input.bookmarkStyleProfileIdDraft,
      bookmarkMutationProfileIdDraft: input.bookmarkMutationProfileIdDraft,
      bookmarkBusy: input.bookmarkBusy,
      bookmarkError: input.bookmarkError,
      replayFeedbackRecommendation: input.replayFeedbackRecommendation,
      labels: {
        sceneAlreadyAligned: input.t.inspect.sceneAlreadyAligned,
        applyFeedbackMix: input.t.inspect.applyFeedbackMix,
      },
      onStepWindow: input.onStepWindow,
      onTogglePause: input.onTogglePause,
      onSeekProgress: input.onSeekProgress,
      onBookmarkLabelChange: input.onBookmarkLabelChange,
      onBookmarkNoteChange: input.onBookmarkNoteChange,
      onBookmarkTagToggle: input.onBookmarkTagToggle,
      onBookmarkStyleProfileChange: input.onBookmarkStyleProfileChange,
      onBookmarkMutationProfileChange: input.onBookmarkMutationProfileChange,
      onCaptureCurrentScene: input.onCaptureCurrentScene,
      onSaveBookmark: input.onSaveBookmark,
      onDeleteCurrentBookmark: input.onDeleteCurrentBookmark,
      onJumpToBookmark: input.onJumpToBookmark,
      onApplyBookmarkSuggestion: input.onApplyBookmarkSuggestion,
      onDeleteBookmark: input.onDeleteBookmark,
      onApplyReplayFeedbackRecommendation: input.onApplyReplayFeedbackRecommendation,
    },
    operationsPanelProps: {
      metricGridItems: input.metricGridItems,
      masterVolume: input.masterVolume,
      replayActive: input.replayActive,
      repositorySourcePath: input.repositorySourcePath,
      labels: {
        masterVolume: input.t.inspect.masterVolume,
        masterVolumeAria: input.t.inspect.masterVolumeAria,
        muteAction: input.t.inspect.muteAction,
        unmuteAction: input.t.inspect.unmuteAction,
        replaySourcePath: input.t.inspect.replaySourcePath,
        liveSourcePath: input.t.inspect.liveSourcePath,
      },
      onSetMasterVolume: input.onSetMasterVolume,
      onToggleMute: input.onToggleMute,
      scenePanel: input.scenePanel,
      routingPanel: input.routingPanel,
    },
    activeDeckContent: input.activeDeckContent,
  };
}
