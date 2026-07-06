import { describe, expect, it, vi } from "vitest";

import {
  clearMonitorAudioState,
  finalizeLiveMonitorStartupState,
  resumeMonitorAudioContextState,
} from "../../../src/features/monitor/monitorLiveAudioLifecycleRuntime";

describe("monitorLiveAudioLifecycleRuntime", () => {
  it("finalizes live startup by resuming audio, probing, reloading guide tracks and polling", async () => {
    const context = {
      state: "running",
      sampleRate: 44100,
    } as AudioContext;
    const ensureAudioContext = vi.fn(async () => context);
    const emitProbe = vi.fn();
    const reloadPendingGuideTrack = vi.fn();
    const doPoll = vi.fn();
    const logger = { info: vi.fn() };

    await finalizeLiveMonitorStartupState({
      ensureAudioContext,
      emitProbe,
      reloadPendingGuideTrack,
      doPoll,
      logger,
      logLabel: "startSession",
    });

    expect(ensureAudioContext).toHaveBeenCalledTimes(1);
    expect(emitProbe).toHaveBeenCalledWith(context);
    expect(reloadPendingGuideTrack).toHaveBeenCalledTimes(1);
    expect(doPoll).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      "[MAIA:Audio] startSession ctx state=running sampleRate=44100",
    );
  });

  it("clears monitor audio state and suspends active contexts", () => {
    const stopAllMonitorAudio = vi.fn();
    const suspend = vi.fn(async () => undefined);
    const currentSegmentRef = { current: { id: "segment" } };
    const audioContextRef = {
      current: {
        state: "running",
        suspend,
      } as unknown as AudioContext,
    };

    clearMonitorAudioState({
      stopAllMonitorAudio,
      currentSegmentRef,
      audioContextRef,
    });

    expect(stopAllMonitorAudio).toHaveBeenCalledTimes(1);
    expect(currentSegmentRef.current).toBeNull();
    expect(suspend).toHaveBeenCalledTimes(1);
  });

  it("resumes monitor audio contexts and emits probes only when the context is running", async () => {
    const emitProbe = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() };

    const runningCtx = {
      state: "running",
      sampleRate: 44100,
    } as AudioContext;

    await expect(
      resumeMonitorAudioContextState({
        ensureAudioContext: vi.fn(async () => runningCtx),
        emitProbe,
        logger,
      }),
    ).resolves.toBe(runningCtx);

    expect(emitProbe).toHaveBeenCalledWith(runningCtx);
    expect(logger.info).toHaveBeenCalled();

    emitProbe.mockClear();

    await resumeMonitorAudioContextState({
      ensureAudioContext: vi.fn(async () => null),
      emitProbe,
      logger,
    });

    expect(emitProbe).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
