import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";
import {
  loadMonitorProviderGuideTrackPath,
  reloadPendingMonitorProviderGuideTrack,
  seekMonitorProviderGuideTrack,
  setMonitorProviderActiveTemplate,
  setMonitorProviderGuideTrack,
  setMonitorProviderGuideTrackPlaylist,
} from "./monitorProviderGuideTrackHookRuntime";

export function runSetMonitorProviderActiveTemplate(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    "resolveSourceTemplate" | "activeTemplateRef" | "setActiveTemplateState" | "logger"
  > & { id: string },
): void {
  setMonitorProviderActiveTemplate(input);
}

export function runSeekMonitorProviderGuideTrack(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    "guideTrackRef" | "guideTrackCursorRef" | "guideTrackFinishedRef" | "logger"
  > & { second: number },
): void {
  seekMonitorProviderGuideTrack(input);
}

export function runLoadMonitorProviderGuideTrackPath(
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
  loadMonitorProviderGuideTrackPath(input);
}

export function runSetMonitorProviderGuideTrack(input: {
  path: string | null;
  guideTrackQueueRef: UseMonitorProviderGuideTrackInput["guideTrackQueueRef"];
  guideTrackQueueIndexRef: UseMonitorProviderGuideTrackInput["guideTrackQueueIndexRef"];
  loadGuideTrackPath: (path: string | null) => void;
}): void {
  setMonitorProviderGuideTrack(input);
}

export function runSetMonitorProviderGuideTrackPlaylist(input: {
  paths: string[];
  guideTrackQueueRef: UseMonitorProviderGuideTrackInput["guideTrackQueueRef"];
  guideTrackQueueIndexRef: UseMonitorProviderGuideTrackInput["guideTrackQueueIndexRef"];
  loadGuideTrackPath: (path: string | null) => void;
}): void {
  setMonitorProviderGuideTrackPlaylist(input);
}

export function buildReloadPendingMonitorProviderGuideTrackAction(input: {
  guideTrackQueueRef: UseMonitorProviderGuideTrackInput["guideTrackQueueRef"];
  guideTrackQueueIndexRef: UseMonitorProviderGuideTrackInput["guideTrackQueueIndexRef"];
  guideTrackRef: UseMonitorProviderGuideTrackInput["guideTrackRef"];
  guideTrackPathRef: UseMonitorProviderGuideTrackInput["guideTrackPathRef"];
  loadGuideTrackPath: (path: string | null) => void;
  logger: UseMonitorProviderGuideTrackInput["logger"];
  reason: "session-start" | "attach-session";
}): () => void {
  return () => {
    reloadPendingMonitorProviderGuideTrack(input);
  };
}
