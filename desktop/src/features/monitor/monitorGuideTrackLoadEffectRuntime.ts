import {
  beginGuideTrackLoadState,
  clearGuideTrackState,
  shouldSkipGuideTrackLoadState,
} from "./monitorGuideTrackStateRuntime";
import {
  applyDecodedGuideTrackFailure,
  applyDecodedGuideTrackSuccess,
} from "./monitorGuideTrackLoadResolutionRuntime";
import { createGuideTrackLoadPromise } from "./monitorGuideTrackLoadPromiseRuntime";
import type { LoadGuideTrackPathStateInput } from "./monitorStartupRuntimeTypes";

export function loadGuideTrackPathState(input: LoadGuideTrackPathStateInput): void {
  if (
    shouldSkipGuideTrackLoadState({
      currentPath: input.currentPath,
      nextPath: input.path,
      hasGuideTrack: input.hasGuideTrack,
      hasPendingLoad: input.hasPendingLoad,
    })
  ) {
    return;
  }

  if (!input.path) {
    input.logger?.info?.("guide track cleared → synth fallback");
    clearGuideTrackState(input);
    return;
  }

  input.logger?.info?.("loading guide track: %s", input.path);
  beginGuideTrackLoadState({
    path: input.path,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackCursorRef: input.guideTrackCursorRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    setGuideTrackPathState: input.setGuideTrackPathState,
    setGuideTrackReady: input.setGuideTrackReady,
  });

  const requestedPath = input.path;
  const loadPromise = createGuideTrackLoadPromise({
    requestedPath,
    decodeGuideTrack: input.decodeGuideTrack,
    onDecodeSuccess: (pcm) => {
      applyDecodedGuideTrackSuccess({
        requestedPath,
        pcm,
        guideTrackPathRef: input.guideTrackPathRef,
        guideTrackRef: input.guideTrackRef,
        guideTrackCursorRef: input.guideTrackCursorRef,
        setGuideTrackDurationSec: input.setGuideTrackDurationSec,
        setGuideTrackReady: input.setGuideTrackReady,
        logger: input.logger,
      });
    },
    onDecodeFailure: (error) => {
      applyDecodedGuideTrackFailure({
        requestedPath,
        guideTrackPathRef: input.guideTrackPathRef,
        guideTrackRef: input.guideTrackRef,
        guideTrackCursorRef: input.guideTrackCursorRef,
        guideTrackFinishedRef: input.guideTrackFinishedRef,
        setGuideTrackPathState: input.setGuideTrackPathState,
        setGuideTrackReady: input.setGuideTrackReady,
        setGuideTrackDurationSec: input.setGuideTrackDurationSec,
        error,
        logger: input.logger,
      });
    },
  });

  input.guideTrackLoadPromiseRef.current = loadPromise;
}
