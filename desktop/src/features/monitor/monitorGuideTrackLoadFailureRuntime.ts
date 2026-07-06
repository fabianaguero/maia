import type { MutableRefObject } from "react";

import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import { resolveGuideTrackLoadFailureOutcome } from "./monitorGuideTrackLoadOutcomeRuntime";
import { rejectDecodedGuideTrackState } from "./monitorGuideTrackStateRuntime";
import type {
  ClearGuideTrackStateInput,
  LoadGuideTrackPathStateInput,
} from "./monitorStartupRuntimeTypes";

export function applyDecodedGuideTrackFailure(input: {
  requestedPath: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  setGuideTrackPathState: ClearGuideTrackStateInput["setGuideTrackPathState"];
  setGuideTrackReady: ClearGuideTrackStateInput["setGuideTrackReady"];
  setGuideTrackDurationSec: ClearGuideTrackStateInput["setGuideTrackDurationSec"];
  error: unknown;
  logger?: LoadGuideTrackPathStateInput["logger"];
}): void {
  const rejected = rejectDecodedGuideTrackState({
    requestedPath: input.requestedPath,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackCursorRef: input.guideTrackCursorRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    setGuideTrackPathState: input.setGuideTrackPathState,
    setGuideTrackReady: input.setGuideTrackReady,
    setGuideTrackDurationSec: input.setGuideTrackDurationSec,
  });
  const outcome = resolveGuideTrackLoadFailureOutcome({
    rejected,
    error: input.error,
  });

  if (outcome.kind === "ignored") {
    return;
  }

  input.logger?.error?.("failed to decode guide track: %s", outcome.message);
}
