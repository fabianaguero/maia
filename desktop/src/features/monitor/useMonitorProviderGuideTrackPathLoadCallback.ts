import { useCallback } from "react";

import { runLoadMonitorProviderGuideTrackPath } from "./monitorProviderGuideTrackActionRuntime";
import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";

export function useMonitorProviderGuideTrackPathLoadCallback(
  input: UseMonitorProviderGuideTrackInput,
) {
  return useCallback(
    (path: string | null) => {
      runLoadMonitorProviderGuideTrackPath({
        path,
        audioContextRef: input.audioContextRef,
        currentSegmentRef: input.currentSegmentRef,
        guideTrackPathRef: input.guideTrackPathRef,
        guideTrackRef: input.guideTrackRef,
        guideTrackCursorRef: input.guideTrackCursorRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
        guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
        setGuideTrackReady: input.setGuideTrackReady,
        setGuideTrackPathState: input.setGuideTrackPathState,
        setGuideTrackDurationSec: input.setGuideTrackDurationSec,
        decodedAudioCache: input.decodedAudioCache,
        logger: input.logger,
      });
    },
    [
      input.audioContextRef,
      input.currentSegmentRef,
      input.guideTrackPathRef,
      input.guideTrackRef,
      input.guideTrackCursorRef,
      input.guideTrackFinishedRef,
      input.guideTrackLoadPromiseRef,
      input.setGuideTrackReady,
      input.setGuideTrackPathState,
      input.setGuideTrackDurationSec,
      input.decodedAudioCache,
      input.logger,
    ],
  );
}
