import type { ClearGuideTrackStateInput } from "./monitorStartupRuntimeTypes";
import type {
  AcceptDecodedGuideTrackStateInput,
  BeginGuideTrackLoadStateInput,
  RejectDecodedGuideTrackStateInput,
} from "./monitorStartupRuntimeTypes";

export function shouldSkipGuideTrackLoadState(input: {
  currentPath: string | null;
  nextPath: string | null;
  hasGuideTrack: boolean;
  hasPendingLoad: boolean;
}): boolean {
  return input.currentPath === input.nextPath && (input.hasGuideTrack || input.hasPendingLoad);
}

export function clearGuideTrackState(input: ClearGuideTrackStateInput): void {
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

export function beginGuideTrackLoadState(input: BeginGuideTrackLoadStateInput): void {
  input.guideTrackPathRef.current = input.path;
  input.setGuideTrackPathState(input.path);
  input.setGuideTrackReady(false);
  input.guideTrackRef.current = null;
  input.guideTrackCursorRef.current.current = 0;
  input.guideTrackFinishedRef.current = false;
}

export function acceptDecodedGuideTrackState(input: AcceptDecodedGuideTrackStateInput): boolean {
  if (input.guideTrackPathRef.current !== input.requestedPath) {
    return false;
  }

  input.guideTrackRef.current = input.pcm;
  input.guideTrackCursorRef.current.current = 0;
  input.setGuideTrackDurationSec(input.pcm.durationSec);
  input.setGuideTrackReady(true);
  return true;
}

export function rejectDecodedGuideTrackState(input: RejectDecodedGuideTrackStateInput): boolean {
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
