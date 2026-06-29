import { useReplayBookmarks } from "../../../hooks/useReplayBookmarks";
import { useReplayFeedbackRecommendation } from "../../../hooks/useReplayFeedbackRecommendation";
import type { LibraryTrack } from "../../../types/library";
import { getTrackTitle } from "../../../utils/track";
import type { LiveMutationExplanation } from "../../../utils/liveMutationExplainability";

export interface UseLiveLogMonitorReplayStateInput {
  replayActive: boolean;
  persistedSessionId: string | null | undefined;
  playbackEventIndex: number | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  currentReplayExplanation: LiveMutationExplanation | null;
  traceWaveformTrack: LibraryTrack | null;
  backgroundPlayheadSecond: number;
}

export function useLiveLogMonitorReplayState(input: UseLiveLogMonitorReplayStateInput) {
  const replaySessionId = input.replayActive ? (input.persistedSessionId ?? null) : null;

  const replayBookmarks = useReplayBookmarks({
    replaySessionId,
    replayActive: input.replayActive,
    replayWindowIndex: input.playbackEventIndex,
    selectedStyleProfileId: input.selectedStyleProfileId,
    selectedMutationProfileId: input.selectedMutationProfileId,
    currentReplayExplanation: input.currentReplayExplanation
      ? {
          eventIndex: input.currentReplayExplanation.eventIndex,
          trackId: input.currentReplayExplanation.trackId,
          trackTitle: input.currentReplayExplanation.trackTitle,
          trackSecond: input.currentReplayExplanation.trackSecond,
        }
      : null,
    fallbackTrackId: input.traceWaveformTrack?.id ?? null,
    fallbackTrackTitle: input.traceWaveformTrack
      ? getTrackTitle(input.traceWaveformTrack)
      : null,
    fallbackTrackSecond:
      typeof input.backgroundPlayheadSecond === "number"
        ? input.backgroundPlayheadSecond
        : null,
  });

  const replayFeedbackRecommendation = useReplayFeedbackRecommendation(
    replayBookmarks.sortedSessionBookmarks,
    {
      currentStyleProfileId: input.selectedStyleProfileId,
      currentMutationProfileId: input.selectedMutationProfileId,
    },
  );

  return {
    replaySessionId,
    replayFeedbackRecommendation,
    ...replayBookmarks,
  };
}
