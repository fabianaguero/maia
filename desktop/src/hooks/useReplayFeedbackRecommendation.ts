import { useMemo } from "react";
import type { SessionBookmark } from "../api/sessions";
import { useT } from "../i18n/I18nContext";
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
  const t = useT();

  return useMemo(
    () =>
      deriveReplayFeedbackRecommendation(bookmarks, {
        currentStyleProfileId: options?.currentStyleProfileId,
        currentMutationProfileId: options?.currentMutationProfileId,
        labels: {
          balancedSummary: t.session.replayFeedbackBalancedSummary,
          balancedDetail: t.session.replayFeedbackBalancedDetail,
          quieterSummary: t.session.replayFeedbackQuieterSummary,
          quieterDetail: t.session.replayFeedbackQuieterDetail,
          sharperSummary: t.session.replayFeedbackSharperSummary,
          sharperDetail: t.session.replayFeedbackSharperDetail,
          alertSummary: t.session.replayFeedbackAlertSummary,
          alertDetail: t.session.replayFeedbackAlertDetail,
          smoothSummary: t.session.replayFeedbackSmoothSummary,
          smoothDetail: t.session.replayFeedbackSmoothDetail,
        },
      }),
    [
      bookmarks,
      options?.currentMutationProfileId,
      options?.currentStyleProfileId,
      t.session.replayFeedbackAlertDetail,
      t.session.replayFeedbackAlertSummary,
      t.session.replayFeedbackBalancedDetail,
      t.session.replayFeedbackBalancedSummary,
      t.session.replayFeedbackQuieterDetail,
      t.session.replayFeedbackQuieterSummary,
      t.session.replayFeedbackSharperDetail,
      t.session.replayFeedbackSharperSummary,
      t.session.replayFeedbackSmoothDetail,
      t.session.replayFeedbackSmoothSummary,
    ],
  );
}
