import type { ChangeEventHandler } from "react";

import type { SessionBookmark } from "../../../api/sessions";
import { ReplayFeedbackSummaryCard } from "../../../components/ReplayFeedbackSummaryCard";
import type { ReplayFeedbackRecommendation } from "../../../utils/replayFeedback";
import { LiveMonitorReplayBookmarksCard } from "./LiveMonitorReplayBookmarksCard";
import { LiveMonitorReplayTimelineCard } from "./LiveMonitorReplayTimelineCard";

interface LiveLogMonitorReplaySectionLabels {
  sceneAlreadyAligned: string;
  applyFeedbackMix: string;
}

interface LiveLogMonitorReplaySectionProps {
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
  labels: LiveLogMonitorReplaySectionLabels;
  onStepWindow: (direction: -1 | 1) => void;
  onTogglePause: () => void;
  onSeekProgress: (progress: number) => void;
  onBookmarkLabelChange: ChangeEventHandler<HTMLInputElement>;
  onBookmarkNoteChange: ChangeEventHandler<HTMLTextAreaElement>;
  onBookmarkTagToggle: (tagId: string) => void;
  onBookmarkStyleProfileChange: ChangeEventHandler<HTMLSelectElement>;
  onBookmarkMutationProfileChange: ChangeEventHandler<HTMLSelectElement>;
  onCaptureCurrentScene: () => void;
  onSaveBookmark: () => void;
  onDeleteCurrentBookmark: () => void;
  onJumpToBookmark: (bookmark: SessionBookmark) => void;
  onApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  onDeleteBookmark: (bookmark: SessionBookmark) => void;
  onApplyReplayFeedbackRecommendation: () => void;
}

export function LiveLogMonitorReplaySection({
  replayActive,
  playbackProgress,
  playbackPercent,
  playbackWindowLabel,
  isPlaybackPaused,
  playbackEventCount,
  playbackEventIndex,
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
  labels,
  onStepWindow,
  onTogglePause,
  onSeekProgress,
  onBookmarkLabelChange,
  onBookmarkNoteChange,
  onBookmarkTagToggle,
  onBookmarkStyleProfileChange,
  onBookmarkMutationProfileChange,
  onCaptureCurrentScene,
  onSaveBookmark,
  onDeleteCurrentBookmark,
  onJumpToBookmark,
  onApplyBookmarkSuggestion,
  onDeleteBookmark,
  onApplyReplayFeedbackRecommendation,
}: LiveLogMonitorReplaySectionProps) {
  return (
    <>
      {replayActive && playbackProgress !== null && playbackEventCount !== null ? (
        <LiveMonitorReplayTimelineCard
          playbackProgress={playbackProgress}
          playbackPercent={playbackPercent ?? 0}
          playbackWindowLabel={playbackWindowLabel}
          isPlaybackPaused={isPlaybackPaused}
          playbackEventCount={playbackEventCount}
          onStepWindow={onStepWindow}
          onTogglePause={onTogglePause}
          onSeekProgress={onSeekProgress}
        />
      ) : null}

      {replayActive && replaySessionId && playbackEventIndex !== null ? (
        <LiveMonitorReplayBookmarksCard
          replayWindowIndex={playbackEventIndex}
          activeReplayBookmark={activeReplayBookmark}
          sortedSessionBookmarks={sortedSessionBookmarks}
          playbackEventCount={playbackEventCount}
          bookmarkLabelDraft={bookmarkLabelDraft}
          bookmarkNoteDraft={bookmarkNoteDraft}
          bookmarkTagDraft={bookmarkTagDraft}
          bookmarkStyleProfileIdDraft={bookmarkStyleProfileIdDraft}
          bookmarkMutationProfileIdDraft={bookmarkMutationProfileIdDraft}
          bookmarkBusy={bookmarkBusy}
          bookmarkError={bookmarkError}
          onBookmarkLabelChange={onBookmarkLabelChange}
          onBookmarkNoteChange={onBookmarkNoteChange}
          onBookmarkTagToggle={onBookmarkTagToggle}
          onBookmarkStyleProfileChange={onBookmarkStyleProfileChange}
          onBookmarkMutationProfileChange={onBookmarkMutationProfileChange}
          onCaptureCurrentScene={onCaptureCurrentScene}
          onSaveBookmark={onSaveBookmark}
          onDeleteCurrentBookmark={onDeleteCurrentBookmark}
          onJumpToBookmark={onJumpToBookmark}
          onApplyBookmarkSuggestion={onApplyBookmarkSuggestion}
          onDeleteBookmark={onDeleteBookmark}
        />
      ) : null}

      {replayActive && replayFeedbackRecommendation ? (
        <ReplayFeedbackSummaryCard
          recommendation={replayFeedbackRecommendation}
          className="audio-path-card--replay top-spaced"
          actionLabel={
            replayFeedbackRecommendation.isAligned
              ? labels.sceneAlreadyAligned
              : labels.applyFeedbackMix
          }
          actionDisabled={replayFeedbackRecommendation.isAligned}
          onApply={onApplyReplayFeedbackRecommendation}
        />
      ) : null}
    </>
  );
}
