import { loadGuideTrackPathState } from "./monitorStartupRuntime";
import {
  seekMonitorGuideTrackState,
  setMonitorActiveTemplateState,
} from "./monitorProviderGuideTrackRuntime";
import { buildMonitorProviderGuideTrackLoadStateInput } from "./monitorProviderGuideTrackLoadInputRuntime";
import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";

export function setMonitorProviderActiveTemplate(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    "resolveSourceTemplate" | "activeTemplateRef" | "setActiveTemplateState" | "logger"
  > & { id: string },
): void {
  setMonitorActiveTemplateState({
    id: input.id,
    resolveSourceTemplate: input.resolveSourceTemplate,
    activeTemplateRef: input.activeTemplateRef,
    setActiveTemplateState: input.setActiveTemplateState,
    logger: input.logger,
  });
}

export function seekMonitorProviderGuideTrack(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    "guideTrackRef" | "guideTrackCursorRef" | "guideTrackFinishedRef" | "logger"
  > & { second: number },
): boolean {
  return seekMonitorGuideTrackState({
    second: input.second,
    guideTrack: input.guideTrackRef.current,
    guideTrackCursorRef: input.guideTrackCursorRef,
    guideTrackFinishedRef: input.guideTrackFinishedRef,
    logger: input.logger,
  });
}

export function loadMonitorProviderGuideTrackPath(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    | "audioContextRef"
    | "currentSegmentRef"
    | "guideTrackPathRef"
    | "guideTrackRef"
    | "guideTrackCursorRef"
    | "guideTrackFinishedRef"
    | "guideTrackLoadPromiseRef"
    | "setGuideTrackReady"
    | "setGuideTrackPathState"
    | "setGuideTrackDurationSec"
    | "decodedAudioCache"
    | "logger"
  > & { path: string | null },
): void {
  loadGuideTrackPathState(
    buildMonitorProviderGuideTrackLoadStateInput({
      path: input.path,
      currentPath: input.guideTrackPathRef.current,
      hasGuideTrack: input.guideTrackRef.current !== null,
      hasPendingLoad: input.guideTrackLoadPromiseRef.current !== null,
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
      cache: input.decodedAudioCache,
      logger: input.logger,
    }),
  );
}
