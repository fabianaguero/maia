import { useCallback, useEffectEvent } from "react";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SessionBookmark } from "../../../api/sessions";
import type { BaseTrackPlaylist } from "../../../types/library";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";
import { persistReplayFeedbackRecommendation } from "../../../utils/monitorPrefs";
import type { ReplayFeedbackRecommendation } from "../../../utils/replayFeedback";
import {
  resolveBookmarkJumpState,
  resolveTraceExplanationSelection,
} from "./liveLogMonitorInteractionRuntime";
import {
  resolveBookmarkSuggestionSelection,
  resolveReplayFeedbackSelection,
} from "./liveLogMonitorActionRuntime";

export interface UseLiveLogMonitorOperatorActionsInput {
  repositoryId: string;
  basePlaylist: BaseTrackPlaylist | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  replayFeedbackRecommendation: ReplayFeedbackRecommendation | null;
  recentExplanations: LiveMutationExplanation[];
  replayActive: boolean;
  playbackEventCount: number | null;
  previousAudibleVolumeRef: MutableRefObject<number>;
  setSelectedStyleProfileId: (value: string) => void;
  setSelectedMutationProfileId: (value: string) => void;
  setSelectedExplanationId: (value: string | null) => void;
  setBackgroundPlayheadSecond: (value: number) => void;
  setMasterVolume: Dispatch<SetStateAction<number>>;
  monitor: {
    pausePlayback: () => void;
    seekPlaybackProgress: (progress: number) => void;
  };
}

export function useLiveLogMonitorOperatorActions(input: UseLiveLogMonitorOperatorActionsInput) {
  const handleApplyBookmarkSuggestion = useEffectEvent((bookmark: SessionBookmark) => {
    const nextSelection = resolveBookmarkSuggestionSelection(bookmark);
    if (nextSelection.selectedStyleProfileId) {
      input.setSelectedStyleProfileId(nextSelection.selectedStyleProfileId);
    }

    if (nextSelection.selectedMutationProfileId) {
      input.setSelectedMutationProfileId(nextSelection.selectedMutationProfileId);
    }
  });

  const handleApplyReplayFeedbackRecommendation = useEffectEvent(() => {
    if (!input.replayFeedbackRecommendation) {
      return;
    }

    const nextPrefs = persistReplayFeedbackRecommendation(
      input.repositoryId,
      {
        basePlaylist: input.basePlaylist,
        selectedStyleProfileId: input.selectedStyleProfileId,
        selectedMutationProfileId: input.selectedMutationProfileId,
      },
      input.replayFeedbackRecommendation,
    );

    const nextSelection = resolveReplayFeedbackSelection({
      suggestedStyleProfileId: nextPrefs.selectedStyleProfileId,
      suggestedMutationProfileId: nextPrefs.selectedMutationProfileId,
    });

    input.setSelectedStyleProfileId(
      nextSelection.selectedStyleProfileId ?? input.selectedStyleProfileId,
    );
    input.setSelectedMutationProfileId(
      nextSelection.selectedMutationProfileId ?? input.selectedMutationProfileId,
    );
  });

  const handleJumpToBookmark = useEffectEvent((bookmark: SessionBookmark) => {
    const bookmarkExplanation =
      input.recentExplanations.find(
        (explanation) => explanation.replayWindowIndex === bookmark.replayWindowIndex,
      ) ?? null;
    const jumpState = resolveBookmarkJumpState({
      playbackEventCount: input.playbackEventCount,
      bookmark,
      bookmarkExplanation,
    });

    if (!jumpState) {
      return;
    }

    if (jumpState.shouldPausePlayback) {
      input.monitor.pausePlayback();
    }
    if (jumpState.nextPlaybackProgress !== null) {
      input.monitor.seekPlaybackProgress(jumpState.nextPlaybackProgress);
    }
    if (jumpState.nextSelectedExplanationId) {
      input.setSelectedExplanationId(jumpState.nextSelectedExplanationId);
    }
    if (jumpState.nextBackgroundPlayheadSecond !== null) {
      input.setBackgroundPlayheadSecond(jumpState.nextBackgroundPlayheadSecond);
    }
  });

  const handleSelectTraceExplanation = useEffectEvent((explanation: LiveMutationExplanation) => {
    const selectionState = resolveTraceExplanationSelection({
      replayActive: input.replayActive,
      playbackEventCount: input.playbackEventCount,
      explanation,
    });

    if (selectionState.shouldPausePlayback) {
      input.monitor.pausePlayback();
    }
    if (selectionState.nextPlaybackProgress !== null) {
      input.monitor.seekPlaybackProgress(selectionState.nextPlaybackProgress);
    }
    input.setSelectedExplanationId(selectionState.nextSelectedExplanationId);
    if (selectionState.nextBackgroundPlayheadSecond !== null) {
      input.setBackgroundPlayheadSecond(selectionState.nextBackgroundPlayheadSecond);
    }
  });

  const handleSetMasterVolume = useCallback((nextVolume: number) => {
    input.setMasterVolume(Math.max(0, Math.min(1, nextVolume)));
  }, [input]);

  const handleToggleMute = useCallback(() => {
    input.setMasterVolume((current) => {
      if (current <= 0.001) {
        return input.previousAudibleVolumeRef.current > 0.001
          ? input.previousAudibleVolumeRef.current
          : 0.45;
      }

      input.previousAudibleVolumeRef.current = current;
      return 0;
    });
  }, [input]);

  return {
    handleApplyBookmarkSuggestion,
    handleApplyReplayFeedbackRecommendation,
    handleJumpToBookmark,
    handleSelectTraceExplanation,
    handleSetMasterVolume,
    handleToggleMute,
  };
}
