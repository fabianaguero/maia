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
import type { BaseAssetRecord, CompositionResultRecord } from "../../../types/library";
import type { ComponentOverride } from "./liveSonificationScene";
export { buildLiveLogMonitorDeckSectionContent } from "./liveLogMonitorDeckSectionContentRuntime";
export { buildLiveLogMonitorLiveDeckProps } from "./liveLogMonitorLiveDeckPropsBuilderRuntime";
export {
  buildLiveLogMonitorRoutingPanel,
  buildLiveLogMonitorScenePanel,
} from "./liveLogMonitorDeckPanelsRuntime";

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

export type { BuildLiveLogMonitorScenePanelInput } from "./liveLogMonitorDeckPanelsRuntime";
export type { BuildLiveLogMonitorRoutingPanelInput } from "./liveLogMonitorDeckPanelsRuntime";
