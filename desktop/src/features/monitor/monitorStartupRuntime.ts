import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import { resolveSourceTemplate, type SourceTemplate } from "../../config/sourceTemplates";
import type { CrossfadeHandle, GuideTrackPCM } from "./monitorContextRuntime";

export interface MonitorStartupRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  error?: (message: string, ...args: unknown[]) => void;
}

type SetSourceTemplateState = (value: SourceTemplate) => void;
type SetBooleanState = Dispatch<SetStateAction<boolean>>;
type SetNullableStringState = Dispatch<SetStateAction<string | null>>;
type SetNullableNumberState = Dispatch<SetStateAction<number | null>>;

export function applyMonitorSourceTemplateState(input: {
  sourceTemplateId?: string | null;
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setActiveTemplateState: SetSourceTemplateState;
}): SourceTemplate {
  const resolved = resolveSourceTemplate(input.sourceTemplateId ?? null);
  input.activeTemplateRef.current = resolved;
  input.setActiveTemplateState(resolved);
  return resolved;
}

export function getPendingGuideTrackPath(input: {
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackQueueIndexRef: MutableRefObject<number>;
}): string | null {
  return input.guideTrackQueueRef.current[input.guideTrackQueueIndexRef.current] ?? null;
}

export function shouldSkipGuideTrackLoadState(input: {
  currentPath: string | null;
  nextPath: string | null;
  hasGuideTrack: boolean;
  hasPendingLoad: boolean;
}): boolean {
  return (
    input.currentPath === input.nextPath &&
    (input.hasGuideTrack || input.hasPendingLoad)
  );
}

export function clearGuideTrackState(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  setGuideTrackReady: SetBooleanState;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackDurationSec: SetNullableNumberState;
}): void {
  const ctx = input.audioContextRef.current;
  const outgoing = input.currentSegmentRef.current;
  if (outgoing && ctx && ctx.state === "running") {
    outgoing.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
  }

  input.currentSegmentRef.current = null;
  input.guideTrackPathRef.current = null;
  input.guideTrackRef.current = null;
  input.guideTrackCursorRef.current.current = 0;
  input.guideTrackFinishedRef.current = false;
  input.guideTrackLoadPromiseRef.current = null;
  input.setGuideTrackReady(false);
  input.setGuideTrackPathState(null);
  input.setGuideTrackDurationSec(null);
}

export function loadGuideTrackPathState(input: {
  path: string | null;
  currentPath: string | null;
  hasGuideTrack: boolean;
  hasPendingLoad: boolean;
  audioContextRef: MutableRefObject<AudioContext | null>;
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  setGuideTrackReady: SetBooleanState;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackDurationSec: SetNullableNumberState;
  decodeGuideTrack: (path: string) => Promise<GuideTrackPCM>;
  logger?: MonitorStartupRuntimeLogger;
}): void {
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
    clearGuideTrackState({
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
    });
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
  const loadPromise = input.decodeGuideTrack(requestedPath)
    .then((pcm) => {
      if (
        !acceptDecodedGuideTrackState({
          requestedPath,
          guideTrackPathRef: input.guideTrackPathRef,
          pcm,
          guideTrackRef: input.guideTrackRef,
          guideTrackCursorRef: input.guideTrackCursorRef,
          setGuideTrackDurationSec: input.setGuideTrackDurationSec,
          setGuideTrackReady: input.setGuideTrackReady,
        })
      ) {
        input.logger?.info?.(
          "guide track load superseded (wanted=%s, current=%s) — ignoring",
          requestedPath,
          input.guideTrackPathRef.current,
        );
        return;
      }

      input.logger?.info?.(
        "guide track ready: %ss, %d samples",
        pcm.durationSec.toFixed(2),
        pcm.samples.length,
      );
    })
    .catch((error) => {
      if (
        !rejectDecodedGuideTrackState({
          requestedPath,
          guideTrackPathRef: input.guideTrackPathRef,
          guideTrackRef: input.guideTrackRef,
          guideTrackCursorRef: input.guideTrackCursorRef,
          guideTrackFinishedRef: input.guideTrackFinishedRef,
          setGuideTrackPathState: input.setGuideTrackPathState,
          setGuideTrackReady: input.setGuideTrackReady,
          setGuideTrackDurationSec: input.setGuideTrackDurationSec,
        })
      ) {
        return;
      }

      input.logger?.error?.(
        "failed to decode guide track: %s",
        error instanceof Error ? error.message : String(error),
      );
    });

  input.guideTrackLoadPromiseRef.current = loadPromise;
}

export function beginGuideTrackLoadState(input: {
  path: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackReady: SetBooleanState;
}): void {
  input.guideTrackPathRef.current = input.path;
  input.setGuideTrackPathState(input.path);
  input.setGuideTrackReady(false);
  input.guideTrackRef.current = null;
  input.guideTrackCursorRef.current.current = 0;
  input.guideTrackFinishedRef.current = false;
}

export function acceptDecodedGuideTrackState(input: {
  requestedPath: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  pcm: GuideTrackPCM;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  setGuideTrackDurationSec: SetNullableNumberState;
  setGuideTrackReady: SetBooleanState;
}): boolean {
  if (input.guideTrackPathRef.current !== input.requestedPath) {
    return false;
  }

  input.guideTrackRef.current = input.pcm;
  input.guideTrackCursorRef.current.current = 0;
  input.setGuideTrackDurationSec(input.pcm.durationSec);
  input.setGuideTrackReady(true);
  return true;
}

export function rejectDecodedGuideTrackState(input: {
  requestedPath: string;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  setGuideTrackPathState: SetNullableStringState;
  setGuideTrackReady: SetBooleanState;
  setGuideTrackDurationSec: SetNullableNumberState;
}): boolean {
  if (input.guideTrackPathRef.current !== input.requestedPath) {
    return false;
  }

  input.guideTrackPathRef.current = null;
  input.guideTrackRef.current = null;
  input.guideTrackCursorRef.current.current = 0;
  input.guideTrackFinishedRef.current = false;
  input.setGuideTrackPathState(null);
  input.setGuideTrackReady(false);
  input.setGuideTrackDurationSec(null);
  return true;
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
