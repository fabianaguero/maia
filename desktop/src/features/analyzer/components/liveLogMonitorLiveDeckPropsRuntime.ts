import type { ComponentProps, ReactNode } from "react";

import type { SessionBookmark } from "../../../api/sessions";
import type { AppTranslations } from "../../../i18n/types";
import { type LiveLogMonitorLiveDeck } from "./LiveLogMonitorLiveDeck";
import { type LiveLogMonitorOperationsPanel } from "./LiveLogMonitorOperationsPanel";
import { type LiveLogMonitorPlaylistSummary } from "./LiveLogMonitorPlaylistSummary";
import { type LiveLogMonitorReplaySection } from "./LiveLogMonitorReplaySection";
import { type LiveLogMonitorSessionCard } from "./LiveLogMonitorSessionCard";
import type { SessionCardDisplay, MetricGridItem } from "./liveLogMonitorDisplayRuntime";
import type { ReplayFeedbackRecommendation } from "../../../utils/replayFeedback";

export interface BuildLiveLogMonitorPlaylistSummaryPropsInput {
  t: AppTranslations;
  basePlaylistName: string | null;
  nowPlayingSummary: string | null;
  upNextSummary: string | null;
  selectedStyleProfileDescription: string;
  selectedMutationProfileDescription: string;
  playlistSummaryItems: ComponentProps<
    typeof LiveLogMonitorLiveDeck
  >["playlistSummaryProps"]["items"];
}

export interface BuildLiveLogMonitorSessionCardPropsInput {
  t: AppTranslations;
  liveEnabled: boolean;
  replayActive: boolean;
  playbackPercent: number | null;
  sessionRepoTitle: string | null;
  sessionCardDisplay: SessionCardDisplay | null;
}

export interface BuildLiveLogMonitorReplaySectionPropsInput {
  t: AppTranslations;
  replayActive: boolean;
  playbackProgress: number | null;
  playbackPercent: number | null;
  playbackWindowLabel: string | null;
  isPlaybackPaused: boolean;
  playbackEventCount: number | null;
  playbackEventIndex: number | null;
  replaySessionId: string | null;
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
  onStepWindow: (direction: -1 | 1) => void;
  onTogglePause: () => void;
  onSeekProgress: (progress: number) => void;
  onBookmarkLabelChange: ComponentProps<
    typeof LiveLogMonitorReplaySection
  >["onBookmarkLabelChange"];
  onBookmarkNoteChange: ComponentProps<typeof LiveLogMonitorReplaySection>["onBookmarkNoteChange"];
  onBookmarkTagToggle: (tagId: string) => void;
  onBookmarkStyleProfileChange: ComponentProps<
    typeof LiveLogMonitorReplaySection
  >["onBookmarkStyleProfileChange"];
  onBookmarkMutationProfileChange: ComponentProps<
    typeof LiveLogMonitorReplaySection
  >["onBookmarkMutationProfileChange"];
  onCaptureCurrentScene: () => void;
  onSaveBookmark: () => void;
  onDeleteCurrentBookmark: () => void;
  onJumpToBookmark: (bookmark: SessionBookmark) => void;
  onApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  onDeleteBookmark: (bookmark: SessionBookmark) => void;
  onApplyReplayFeedbackRecommendation: () => void;
}

export interface BuildLiveLogMonitorOperationsPanelPropsInput {
  t: AppTranslations;
  metricGridItems: MetricGridItem[];
  masterVolume: number;
  replayActive: boolean;
  repositorySourcePath: string;
  scenePanel: ReactNode;
  routingPanel: ReactNode;
  onSetMasterVolume: (nextVolume: number) => void;
  onToggleMute: () => void;
}

export function buildLiveLogMonitorPlaylistSummaryProps(
  input: BuildLiveLogMonitorPlaylistSummaryPropsInput,
): ComponentProps<typeof LiveLogMonitorPlaylistSummary> {
  return {
    label: input.t.inspect.basePlaylist,
    title: input.basePlaylistName ?? input.t.inspect.basePlaylist,
    nowPlayingLine: input.nowPlayingSummary,
    upNextLine: input.upNextSummary,
    profileDescription: `${input.selectedStyleProfileDescription} ${input.selectedMutationProfileDescription}`,
    items: input.playlistSummaryItems,
    lostLabel: input.t.library.lost.toUpperCase(),
  };
}

export function buildLiveLogMonitorSessionCardProps(
  input: BuildLiveLogMonitorSessionCardPropsInput,
): ComponentProps<typeof LiveLogMonitorSessionCard> | null {
  if (!input.liveEnabled || !input.sessionRepoTitle || !input.sessionCardDisplay) {
    return null;
  }

  return {
    replayActive: input.replayActive,
    replayProgressAria: input.t.inspect.replayProgressAria,
    playbackPercent: input.playbackPercent,
    repoTitle: input.sessionRepoTitle,
    display: input.sessionCardDisplay,
  };
}

export function buildLiveLogMonitorReplaySectionProps(
  input: BuildLiveLogMonitorReplaySectionPropsInput,
): ComponentProps<typeof LiveLogMonitorReplaySection> {
  return {
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
  };
}

export function buildLiveLogMonitorOperationsPanelProps(
  input: BuildLiveLogMonitorOperationsPanelPropsInput,
): ComponentProps<typeof LiveLogMonitorOperationsPanel> {
  return {
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
  };
}
