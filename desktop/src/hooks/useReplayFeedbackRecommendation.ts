import { useMemo } from "react";
import type { SessionBookmark } from "../api/sessions";
import {
  deriveReplayFeedbackRecommendation,
  type ReplayFeedbackRecommendation,
} from "../utils/replayFeedback";

interface UseReplayFeedbackRecommendationOptions {
  currentStyleProfileId?: string | null;
  currentMutationProfileId?: string | null;
}

export function useReplayFeedbackRecommendation(
  bookmarks: readonly SessionBookmark[],
  options?: UseReplayFeedbackRecommendationOptions,
): ReplayFeedbackRecommendation | null {
  return useMemo(
    () =>
      deriveReplayFeedbackRecommendation(bookmarks, {
        currentStyleProfileId: options?.currentStyleProfileId,
        currentMutationProfileId: options?.currentMutationProfileId,
      }),
    [bookmarks, options?.currentMutationProfileId, options?.currentStyleProfileId],
  );
}
