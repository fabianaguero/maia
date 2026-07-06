import { describe, expect, it, vi } from "vitest";

import { resolveSourceTemplate } from "../../../src/config/sourceTemplates";
import {
  acceptDecodedGuideTrackState,
  advanceGuideTrackQueueState,
  applyMonitorSourceTemplateState,
  beginGuideTrackLoadState,
  buildGuideTrackQueue,
  clearGuideTrackState,
  getPendingGuideTrackPath,
  loadGuideTrackPathState,
  rejectDecodedGuideTrackState,
  reloadPendingGuideTrackForMonitorState,
  shouldSkipGuideTrackLoadState,
  shouldAwaitGuideTrackForPlayback,
} from "../../../src/features/monitor/monitorStartupRuntime";

describe("monitorStartupRuntime", () => {
  it("applies the selected monitor source template to ref and state", () => {
    const activeTemplateRef = { current: resolveSourceTemplate(null) };
    const setActiveTemplateState = vi.fn();

    const resolved = applyMonitorSourceTemplateState({
      sourceTemplateId: "tech-house",
      activeTemplateRef,
      setActiveTemplateState,
    });

    expect(activeTemplateRef.current.id).toBe("tech-house");
    expect(setActiveTemplateState).toHaveBeenCalledWith(activeTemplateRef.current);
    expect(resolved.id).toBe("tech-house");
  });

  it("resolves pending guide track paths and reloads when needed", () => {
    const guideTrackQueueRef = { current: ["/audio/a.wav", "/audio/b.wav"] };
    const guideTrackQueueIndexRef = { current: 1 };
    const guideTrackRef = { current: null };
    const guideTrackPathRef = { current: "/audio/a.wav" as string | null };
    const loadGuideTrackPath = vi.fn();
    const logger = { info: vi.fn() };

    expect(
      getPendingGuideTrackPath({
        guideTrackQueueRef,
        guideTrackQueueIndexRef,
      }),
    ).toBe("/audio/b.wav");

    const reloaded = reloadPendingGuideTrackForMonitorState({
      guideTrackQueueRef,
      guideTrackQueueIndexRef,
      guideTrackRef,
      guideTrackPathRef,
      loadGuideTrackPath,
      logger,
      reason: "session-start",
    });

    expect(reloaded).toBe("/audio/b.wav");
    expect(guideTrackPathRef.current).toBeNull();
    expect(loadGuideTrackPath).toHaveBeenCalledWith("/audio/b.wav");
    expect(logger.info).toHaveBeenCalled();

    expect(
      reloadPendingGuideTrackForMonitorState({
        guideTrackQueueRef,
        guideTrackQueueIndexRef,
        guideTrackRef: {
          current: { samples: new Float32Array([0.1]), sampleRate: 44100, durationSec: 1 },
        },
        guideTrackPathRef,
        loadGuideTrackPath,
        logger,
        reason: "attach-session",
      }),
    ).toBe("/audio/b.wav");
  });

  it("manages guide track lifecycle state transitions", () => {
    expect(
      shouldSkipGuideTrackLoadState({
        currentPath: "/audio/a.wav",
        nextPath: "/audio/a.wav",
        hasGuideTrack: true,
        hasPendingLoad: false,
      }),
    ).toBe(true);

    const guideTrackPathRef = { current: null as string | null };
    const guideTrackRef = {
      current: null as { samples: Float32Array; sampleRate: number; durationSec: number } | null,
    };
    const guideTrackCursorRef = { current: { current: 99 } };
    const guideTrackFinishedRef = { current: true };
    const setGuideTrackPathState = vi.fn();
    const setGuideTrackReady = vi.fn();
    const setGuideTrackDurationSec = vi.fn();

    beginGuideTrackLoadState({
      path: "/audio/a.wav",
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      setGuideTrackPathState,
      setGuideTrackReady,
    });

    expect(guideTrackPathRef.current).toBe("/audio/a.wav");
    expect(guideTrackCursorRef.current.current).toBe(0);
    expect(guideTrackFinishedRef.current).toBe(false);

    const pcm = {
      samples: new Float32Array([0.1, 0.2]),
      sampleRate: 44100,
      durationSec: 12,
    };

    expect(
      acceptDecodedGuideTrackState({
        requestedPath: "/audio/a.wav",
        guideTrackPathRef,
        pcm,
        guideTrackRef,
        guideTrackCursorRef,
        setGuideTrackDurationSec,
        setGuideTrackReady,
      }),
    ).toBe(true);
    expect(guideTrackRef.current).toBe(pcm);
    expect(setGuideTrackDurationSec).toHaveBeenCalledWith(12);
    expect(setGuideTrackReady).toHaveBeenCalledWith(true);

    expect(
      rejectDecodedGuideTrackState({
        requestedPath: "/audio/a.wav",
        guideTrackPathRef,
        guideTrackRef,
        guideTrackCursorRef,
        guideTrackFinishedRef,
        setGuideTrackPathState,
        setGuideTrackReady,
        setGuideTrackDurationSec,
      }),
    ).toBe(true);
    expect(guideTrackPathRef.current).toBeNull();
    expect(guideTrackRef.current).toBeNull();
    expect(setGuideTrackPathState).toHaveBeenCalledWith(null);
  });

  it("clears active guide tracks and normalizes playlist queues", () => {
    const audioContextRef = {
      current: {
        state: "running",
        currentTime: 1,
      } as AudioContext,
    };
    const currentSegmentRef = {
      current: {
        gainNode: {
          gain: {
            linearRampToValueAtTime: vi.fn(),
          },
        },
      } as unknown as {
        gainNode: { gain: { linearRampToValueAtTime: ReturnType<typeof vi.fn> } };
      },
    };
    const guideTrackPathRef = { current: "/audio/a.wav" as string | null };
    const guideTrackRef = {
      current: {
        samples: new Float32Array([0.1]),
        sampleRate: 44100,
        durationSec: 1,
      },
    };
    const guideTrackCursorRef = { current: { current: 14 } };
    const guideTrackFinishedRef = { current: true };
    const guideTrackLoadPromiseRef = { current: Promise.resolve() as Promise<void> | null };
    const setGuideTrackReady = vi.fn();
    const setGuideTrackPathState = vi.fn();
    const setGuideTrackDurationSec = vi.fn();

    clearGuideTrackState({
      audioContextRef,
      currentSegmentRef: currentSegmentRef as never,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
    });

    expect(guideTrackPathRef.current).toBeNull();
    expect(guideTrackRef.current).toBeNull();
    expect(guideTrackCursorRef.current.current).toBe(0);
    expect(guideTrackFinishedRef.current).toBe(false);
    expect(guideTrackLoadPromiseRef.current).toBeNull();
    expect(setGuideTrackReady).toHaveBeenCalledWith(false);

    expect(buildGuideTrackQueue([" /audio/a.wav ", "/audio/b.wav", "/audio/a.wav", ""])).toEqual([
      "/audio/a.wav",
      "/audio/b.wav",
    ]);

    const guideTrackQueueRef = { current: ["/audio/a.wav", "/audio/b.wav"] };
    const guideTrackQueueIndexRef = { current: 0 };
    const loadGuideTrackPath = vi.fn();
    expect(
      advanceGuideTrackQueueState({
        guideTrackQueueRef,
        guideTrackQueueIndexRef,
        loadGuideTrackPath,
      }),
    ).toBe(true);
    expect(guideTrackQueueIndexRef.current).toBe(1);
    expect(loadGuideTrackPath).toHaveBeenCalledWith("/audio/b.wav");

    const singleQueueIndexRef = { current: 0 };
    expect(
      advanceGuideTrackQueueState({
        guideTrackQueueRef: { current: ["/audio/solo.wav"] },
        guideTrackQueueIndexRef: singleQueueIndexRef,
        loadGuideTrackPath,
      }),
    ).toBe(true);
    expect(singleQueueIndexRef.current).toBe(0);

    expect(
      advanceGuideTrackQueueState({
        guideTrackQueueRef: { current: [] },
        guideTrackQueueIndexRef: { current: 0 },
        loadGuideTrackPath,
      }),
    ).toBe(false);
  });

  it("loads, clears, and guards guide track decode state transitions", async () => {
    const audioContextRef = { current: null as AudioContext | null };
    const currentSegmentRef = { current: null as never };
    const guideTrackPathRef = { current: null as string | null };
    const guideTrackRef = {
      current: null as { samples: Float32Array; sampleRate: number; durationSec: number } | null,
    };
    const guideTrackCursorRef = { current: { current: 0 } };
    const guideTrackFinishedRef = { current: false };
    const guideTrackLoadPromiseRef = { current: null as Promise<void> | null };
    const setGuideTrackReady = vi.fn();
    const setGuideTrackPathState = vi.fn();
    const setGuideTrackDurationSec = vi.fn();
    const logger = { info: vi.fn(), error: vi.fn() };
    const pcm = {
      samples: new Float32Array([0.1, 0.2, 0.3]),
      sampleRate: 44100,
      durationSec: 3,
    };

    loadGuideTrackPathState({
      path: "/audio/a.wav",
      currentPath: null,
      hasGuideTrack: false,
      hasPendingLoad: false,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: async () => pcm,
      logger,
    });

    await guideTrackLoadPromiseRef.current;
    expect(guideTrackPathRef.current).toBe("/audio/a.wav");
    expect(guideTrackRef.current).toBe(pcm);
    expect(setGuideTrackDurationSec).toHaveBeenCalledWith(3);
    expect(setGuideTrackReady).toHaveBeenCalledWith(true);
    expect(logger.info).toHaveBeenCalled();

    loadGuideTrackPathState({
      path: "/audio/a.wav",
      currentPath: null,
      hasGuideTrack: false,
      hasPendingLoad: false,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: async () => {
        guideTrackPathRef.current = "/audio/other.wav";
        return pcm;
      },
      logger,
    });

    await guideTrackLoadPromiseRef.current;
    expect(logger.info).toHaveBeenCalledWith(
      "guide track load superseded (wanted=%s, current=%s) — ignoring",
      "/audio/a.wav",
      "/audio/other.wav",
    );

    loadGuideTrackPathState({
      path: "/audio/a.wav",
      currentPath: null,
      hasGuideTrack: false,
      hasPendingLoad: false,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: async () => {
        guideTrackPathRef.current = "/audio/other.wav";
        throw new Error("decode boom");
      },
      logger,
    });

    await guideTrackLoadPromiseRef.current;
    expect(logger.error).not.toHaveBeenCalledWith(
      "failed to decode guide track: %s",
      "decode boom",
    );

    guideTrackPathRef.current = null;
    guideTrackRef.current = null;

    loadGuideTrackPathState({
      path: "/audio/a.wav",
      currentPath: null,
      hasGuideTrack: false,
      hasPendingLoad: false,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: async () => {
        throw new Error("decode hard fail");
      },
      logger,
    });

    await guideTrackLoadPromiseRef.current;
    expect(logger.error).toHaveBeenCalledWith(
      "failed to decode guide track: %s",
      "decode hard fail",
    );

    loadGuideTrackPathState({
      path: "/audio/a.wav",
      currentPath: "/audio/a.wav",
      hasGuideTrack: true,
      hasPendingLoad: false,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: vi.fn(async () => pcm),
      logger,
    });

    loadGuideTrackPathState({
      path: null,
      currentPath: "/audio/a.wav",
      hasGuideTrack: true,
      hasPendingLoad: false,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: vi.fn(async () => pcm),
      logger,
    });

    expect(guideTrackPathRef.current).toBeNull();
    expect(guideTrackRef.current).toBeNull();
  });

  it("detects when playback should await guide track decode", () => {
    expect(
      shouldAwaitGuideTrackForPlayback({
        guideTrackPathRef: { current: "/audio/a.wav" },
        guideTrackQueueRef: { current: [] },
        guideTrackRef: { current: null },
        guideTrackLoadPromiseRef: { current: Promise.resolve() },
      }),
    ).toBe(true);

    expect(
      shouldAwaitGuideTrackForPlayback({
        guideTrackPathRef: { current: null },
        guideTrackQueueRef: { current: ["/audio/a.wav"] },
        guideTrackRef: { current: null },
        guideTrackLoadPromiseRef: { current: null },
      }),
    ).toBe(false);

    expect(
      shouldAwaitGuideTrackForPlayback({
        guideTrackPathRef: { current: null },
        guideTrackQueueRef: { current: [] },
        guideTrackRef: {
          current: { samples: new Float32Array(0), sampleRate: 44100, durationSec: 0 },
        },
        guideTrackLoadPromiseRef: { current: null },
      }),
    ).toBe(false);
  });
});
