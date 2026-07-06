import type { ChangeEvent, ComponentProps, ReactNode } from "react";

import type { SessionBookmark } from "../../../api/sessions";
import type { MetricGridItem, SessionCardDisplay } from "./liveLogMonitorDisplayRuntime";
import type { AppTranslations } from "../../../i18n/types";
import type { ReplayFeedbackRecommendation } from "../../../utils/replayFeedback";
import type { LiveLogMonitorLiveDeck } from "./LiveLogMonitorLiveDeck";
import {
  buildLiveLogMonitorOperationsPanelProps,
  buildLiveLogMonitorPlaylistSummaryProps,
  buildLiveLogMonitorReplaySectionProps,
  buildLiveLogMonitorSessionCardProps,
} from "./liveLogMonitorLiveDeckPropsRuntime";

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

export function buildLiveLogMonitorLiveDeckProps(
  input: BuildLiveLogMonitorLiveDeckPropsInput,
): ComponentProps<typeof LiveLogMonitorLiveDeck> {
  return {
    liveEnabled: input.liveEnabled,
    hasBasePlaylist: input.hasBasePlaylist,
    playlistSummaryProps: buildLiveLogMonitorPlaylistSummaryProps({
      t: input.t,
      basePlaylistName: input.basePlaylistName,
      nowPlayingSummary: input.nowPlayingSummary,
      upNextSummary: input.upNextSummary,
      selectedStyleProfileDescription: input.selectedStyleProfileDescription,
      selectedMutationProfileDescription: input.selectedMutationProfileDescription,
      playlistSummaryItems: input.playlistSummaryItems,
    }),
    sessionCardProps: buildLiveLogMonitorSessionCardProps({
      t: input.t,
      liveEnabled: input.liveEnabled,
      replayActive: input.replayActive,
      playbackPercent: input.playbackPercent,
      sessionRepoTitle: input.sessionRepoTitle,
      sessionCardDisplay: input.sessionCardDisplay,
    }),
    replaySectionProps: buildLiveLogMonitorReplaySectionProps({
      t: input.t,
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
    }),
    operationsPanelProps: buildLiveLogMonitorOperationsPanelProps({
      t: input.t,
      metricGridItems: input.metricGridItems,
      masterVolume: input.masterVolume,
      replayActive: input.replayActive,
      repositorySourcePath: input.repositorySourcePath,
      scenePanel: input.scenePanel,
      routingPanel: input.routingPanel,
      onSetMasterVolume: input.onSetMasterVolume,
      onToggleMute: input.onToggleMute,
    }),
    activeDeckContent: input.activeDeckContent,
  };
}
