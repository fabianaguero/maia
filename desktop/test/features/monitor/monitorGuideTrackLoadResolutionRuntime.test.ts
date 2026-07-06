import { describe, expect, it, vi } from "vitest";

import {
  applyDecodedGuideTrackFailure,
  applyDecodedGuideTrackSuccess,
} from "../../../src/features/monitor/monitorGuideTrackLoadResolutionRuntime";

describe("monitorGuideTrackLoadResolutionRuntime", () => {
  it("accepts decoded guide tracks or logs when the request was superseded", () => {
    const guideTrackPathRef = { current: "/audio/a.wav" as string | null };
    const guideTrackRef = {
      current: null as { samples: Float32Array; sampleRate: number; durationSec: number } | null,
    };
    const guideTrackCursorRef = { current: { current: 12 } };
    const setGuideTrackDurationSec = vi.fn();
    const setGuideTrackReady = vi.fn();
    const logger = { info: vi.fn() };
    const pcm = {
      samples: new Float32Array([0.1, 0.2, 0.3]),
      sampleRate: 44100,
      durationSec: 3,
    };

    applyDecodedGuideTrackSuccess({
      requestedPath: "/audio/a.wav",
      pcm,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      setGuideTrackDurationSec,
      setGuideTrackReady,
      logger,
    });

    expect(guideTrackRef.current).toBe(pcm);
    expect(guideTrackCursorRef.current.current).toBe(0);
    expect(setGuideTrackDurationSec).toHaveBeenCalledWith(3);
    expect(setGuideTrackReady).toHaveBeenCalledWith(true);

    guideTrackPathRef.current = "/audio/other.wav";
    applyDecodedGuideTrackSuccess({
      requestedPath: "/audio/a.wav",
      pcm,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      setGuideTrackDurationSec,
      setGuideTrackReady,
      logger,
    });

    expect(logger.info).toHaveBeenCalledWith(
      "guide track load superseded (wanted=%s, current=%s) — ignoring",
      "/audio/a.wav",
      "/audio/other.wav",
    );
  });

  it("rejects failed decodes and only logs when the requested path is still active", () => {
    const guideTrackPathRef = { current: "/audio/a.wav" as string | null };
    const guideTrackRef = {
      current: { samples: new Float32Array([0.1]), sampleRate: 44100, durationSec: 1 },
    };
    const guideTrackCursorRef = { current: { current: 4 } };
    const guideTrackFinishedRef = { current: true };
    const setGuideTrackPathState = vi.fn();
    const setGuideTrackReady = vi.fn();
    const setGuideTrackDurationSec = vi.fn();
    const logger = { error: vi.fn() };

    applyDecodedGuideTrackFailure({
      requestedPath: "/audio/a.wav",
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      setGuideTrackPathState,
      setGuideTrackReady,
      setGuideTrackDurationSec,
      error: new Error("decode failed"),
      logger,
    });

    expect(guideTrackPathRef.current).toBeNull();
    expect(guideTrackRef.current).toBeNull();
    expect(guideTrackCursorRef.current.current).toBe(0);
    expect(guideTrackFinishedRef.current).toBe(false);
    expect(setGuideTrackPathState).toHaveBeenCalledWith(null);
    expect(setGuideTrackReady).toHaveBeenCalledWith(false);
    expect(setGuideTrackDurationSec).toHaveBeenCalledWith(null);
    expect(logger.error).toHaveBeenCalledWith("failed to decode guide track: %s", "decode failed");

    guideTrackPathRef.current = "/audio/other.wav";
    applyDecodedGuideTrackFailure({
      requestedPath: "/audio/a.wav",
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      setGuideTrackPathState,
      setGuideTrackReady,
      setGuideTrackDurationSec,
      error: new Error("ignored"),
      logger,
    });

    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
