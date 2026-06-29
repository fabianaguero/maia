import type { SessionBookmark } from "../../../api/sessions";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import type { UseLiveLogMonitorPanelDeckRuntimeInput } from "./useLiveLogMonitorPanelDeckRuntime";

export interface LiveLogMonitorDeckOperatorActions {
  handleApplyBookmarkSuggestion: (bookmark: SessionBookmark) => void;
  handleApplyReplayFeedbackRecommendation: () => void;
  handleJumpToBookmark: (bookmark: SessionBookmark) => void;
  handleSelectTraceExplanation: (explanation: LiveMutationExplanation) => void;
  handleSetMasterVolume: (volume: number) => void;
  handleToggleMute: () => void;
}

export function buildLiveLogMonitorDeckPlaybackCallbacks(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
) {
  return {
    onStepWindow: (direction: -1 | 1) => input.monitor.stepPlaybackWindow(direction),
    onTogglePause: () =>
      input.monitor.isPlaybackPaused ? input.monitor.resumePlayback() : input.monitor.pausePlayback(),
    onSeekProgress: (progress: number) => input.monitor.seekPlaybackProgress(progress),
  };
}

export function buildLiveLogMonitorDeckBookmarkCallbacks(
  input: UseLiveLogMonitorPanelDeckRuntimeInput,
  operatorActions: LiveLogMonitorDeckOperatorActions,
) {
  return {
    onBookmarkLabelChange: (value: string) => input.setBookmarkLabelDraft(value),
    onBookmarkNoteChange: (value: string) => input.setBookmarkNoteDraft(value),
    onBookmarkTagToggle: (tagId: string) =>
      input.setBookmarkTagDraft((current) => (current === tagId ? null : tagId)),
    onBookmarkStyleProfileChange: (value: string | null) => input.setBookmarkStyleProfileIdDraft(value),
    onBookmarkMutationProfileChange: (value: string | null) => input.setBookmarkMutationProfileIdDraft(value),
    onCaptureCurrentScene: input.captureCurrentScene,
    onSaveBookmark: () => void input.saveReplayBookmark(),
    onDeleteCurrentBookmark: () => {
      if (!input.activeReplayBookmark) {
        return;
      }
      void input.deleteReplayBookmark(input.activeReplayBookmark);
    },
    onJumpToBookmark: operatorActions.handleJumpToBookmark,
    onApplyBookmarkSuggestion: operatorActions.handleApplyBookmarkSuggestion,
    onDeleteBookmark: (bookmark: SessionBookmark) => void input.deleteReplayBookmark(bookmark),
    onApplyReplayFeedbackRecommendation: () => operatorActions.handleApplyReplayFeedbackRecommendation(),
    onSelectExplanation: operatorActions.handleSelectTraceExplanation,
    onSetMasterVolume: operatorActions.handleSetMasterVolume,
    onToggleMute: operatorActions.handleToggleMute,
  };
}
