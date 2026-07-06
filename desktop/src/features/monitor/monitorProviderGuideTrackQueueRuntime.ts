import {
  buildGuideTrackQueue,
  reloadPendingGuideTrackForMonitorState,
} from "./monitorStartupRuntime";
import {
  setMonitorGuideTrackPlaylistState,
  setMonitorGuideTrackState,
} from "./monitorProviderGuideTrackRuntime";
import type { UseMonitorProviderGuideTrackInput } from "./monitorProviderGuideTrackTypes";

export function setMonitorProviderGuideTrack(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    "guideTrackQueueRef" | "guideTrackQueueIndexRef"
  > & {
    path: string | null;
    loadGuideTrackPath: (path: string | null) => void;
  },
): void {
  setMonitorGuideTrackState({
    path: input.path,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
    loadGuideTrackPath: input.loadGuideTrackPath,
  });
}

export function setMonitorProviderGuideTrackPlaylist(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    "guideTrackQueueRef" | "guideTrackQueueIndexRef"
  > & {
    paths: string[];
    loadGuideTrackPath: (path: string | null) => void;
  },
): string[] {
  return setMonitorGuideTrackPlaylistState({
    paths: input.paths,
    buildGuideTrackQueue,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
    loadGuideTrackPath: input.loadGuideTrackPath,
  });
}

export function reloadPendingMonitorProviderGuideTrack(
  input: Pick<
    UseMonitorProviderGuideTrackInput,
    | "guideTrackQueueRef"
    | "guideTrackQueueIndexRef"
    | "guideTrackRef"
    | "guideTrackPathRef"
    | "logger"
  > & {
    loadGuideTrackPath: (path: string | null) => void;
    reason: "session-start" | "attach-session";
  },
): string | null {
  return reloadPendingGuideTrackForMonitorState({
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackPathRef: input.guideTrackPathRef,
    loadGuideTrackPath: input.loadGuideTrackPath,
    logger: input.reason === "session-start" ? input.logger : undefined,
    reason: input.reason,
  });
}
