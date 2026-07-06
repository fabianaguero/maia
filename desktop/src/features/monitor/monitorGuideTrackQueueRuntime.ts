import type { MutableRefObject } from "react";

import type { GuideTrackPCM } from "./monitorAudioRuntimeTypes";
import type { MonitorStartupRuntimeLogger } from "./monitorStartupRuntimeTypes";

export function getPendingGuideTrackPath(input: {
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
}): string | null {
  return input.guideTrackQueueRef.current[input.guideTrackQueueIndexRef.current] ?? null;
}

export function buildGuideTrackQueue(paths: string[]): string[] {
  return paths
    .map((path) => path.trim())
    .filter((path, index, all) => path.length > 0 && all.indexOf(path) === index);
}

export function advanceGuideTrackQueueState(input: {
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
  loadGuideTrackPath: (path: string | null) => void;
}): boolean {
  const queue = input.guideTrackQueueRef.current;
  if (queue.length === 0) {
    return false;
  }

  const nextIndex =
    queue.length === 1 ? 0 : (input.guideTrackQueueIndexRef.current + 1) % queue.length;
  input.guideTrackQueueIndexRef.current = nextIndex;
  input.loadGuideTrackPath(queue[nextIndex] ?? null);
  return Boolean(queue[nextIndex]);
}

export function reloadPendingGuideTrackForMonitorState(input: {
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackPathRef: MutableRefObject<string | null>;
  loadGuideTrackPath: (path: string | null) => void;
  logger?: MonitorStartupRuntimeLogger;
  reason?: "session-start" | "attach-session";
}): string | null {
  const pendingPath = getPendingGuideTrackPath({
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackQueueIndexRef: input.guideTrackQueueIndexRef,
  });

  if (!pendingPath || input.guideTrackRef.current) {
    return pendingPath;
  }

  if (input.reason === "session-start" && input.logger) {
    input.logger.info(
      "[MAIA:Audio] guide track pending on session start, forcing reload: %s",
      pendingPath,
    );
  }
  input.guideTrackPathRef.current = null;
  input.loadGuideTrackPath(pendingPath);
  return pendingPath;
}

export function shouldAwaitGuideTrackForPlayback(input: {
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
}): boolean {
  return (
    (Boolean(input.guideTrackPathRef.current) || input.guideTrackQueueRef.current.length > 0) &&
    !input.guideTrackRef.current &&
    Boolean(input.guideTrackLoadPromiseRef.current)
  );
}
