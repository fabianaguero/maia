import type { MutableRefObject } from "react";

import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import { resolveGuideTrackLoadSuccessOutcome } from "./monitorGuideTrackLoadOutcomeRuntime";
import { acceptDecodedGuideTrackState } from "./monitorGuideTrackStateRuntime";
import type {
  ClearGuideTrackStateInput,
  LoadGuideTrackPathStateInput,
} from "./monitorStartupRuntimeTypes";

export function applyDecodedGuideTrackSuccess(input: {
  requestedPath: string;
  pcm: GuideTrackPCM;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  setGuideTrackDurationSec: ClearGuideTrackStateInput["setGuideTrackDurationSec"];
  setGuideTrackReady: ClearGuideTrackStateInput["setGuideTrackReady"];
  logger?: LoadGuideTrackPathStateInput["logger"];
}): void {
  const accepted = acceptDecodedGuideTrackState({
    requestedPath: input.requestedPath,
    guideTrackPathRef: input.guideTrackPathRef,
    pcm: input.pcm,
    guideTrackRef: input.guideTrackRef,
    guideTrackCursorRef: input.guideTrackCursorRef,
    setGuideTrackDurationSec: input.setGuideTrackDurationSec,
    setGuideTrackReady: input.setGuideTrackReady,
  });
  const outcome = resolveGuideTrackLoadSuccessOutcome({
    accepted,
    requestedPath: input.requestedPath,
    currentPath: input.guideTrackPathRef.current,
    pcm: input.pcm,
  });

  if (outcome.kind === "superseded") {
    input.logger?.info?.(
      "guide track load superseded (wanted=%s, current=%s) — ignoring",
      outcome.requestedPath,
      outcome.currentPath,
    );
    return;
  }

  input.logger?.info?.(
    "guide track ready: %ss, %d samples",
    outcome.durationLabel,
    outcome.sampleCount,
  );
}
