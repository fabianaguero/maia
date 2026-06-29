import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorAudioBootstrap } from "../../../../src/features/analyzer/components/useLiveLogMonitorAudioBootstrap";

function createInput(overrides: Record<string, unknown> = {}) {
  const gainNode = {
    gain: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const analyserNode = {
    fftSize: 0,
    smoothingTimeConstant: 0,
    connect: vi.fn(),
  };
  const context = {
    state: "suspended",
    destination: { id: "dest" },
    resume: vi.fn(async () => undefined),
    createGain: vi.fn(() => gainNode),
    createAnalyser: vi.fn(() => analyserNode),
  };

  return {
    monitorAudioContext: null,
    resumeSharedAudio: vi.fn(async () => undefined),
    createAudioContext: vi.fn(() => context),
    audioContextRef: { current: null },
    usingSharedAudioContextRef: { current: false },
    masterGainRef: { current: null },
    analyserRef: { current: null },
    setAudioStatus: vi.fn(),
    liveEnabled: false,
    replayActive: false,
    masterVolume: 0.45,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
    __internals: {
      context,
      gainNode,
      analyserNode,
    },
    ...overrides,
  } as never;
}

describe("useLiveLogMonitorAudioBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adopts and resumes a shared monitor audio context", async () => {
    const sharedContext = {
      state: "suspended",
      resume: vi.fn(async () => undefined),
    };
    const input = createInput({
      monitorAudioContext: sharedContext,
    });

    const { result } = renderHook(() => useLiveLogMonitorAudioBootstrap(input));

    expect(input.audioContextRef.current).toBe(sharedContext);
    expect(input.usingSharedAudioContextRef.current).toBe(true);

    await result.current.ensureAudioReady();

    expect(input.resumeSharedAudio).toHaveBeenCalled();
    expect(input.audioContextRef.current).toBe(sharedContext);
  });

  it("creates master gain/analyser nodes when live or replay mode is active", async () => {
    const input = createInput({
      liveEnabled: true,
    });
    input.__internals.context.state = "running";

    renderHook(() => useLiveLogMonitorAudioBootstrap(input));

    await Promise.resolve();

    expect(input.createAudioContext).toHaveBeenCalled();
    expect(input.setAudioStatus).toHaveBeenCalledWith("ready");
    expect(input.masterGainRef.current).toBe(input.__internals.gainNode);
    expect(input.analyserRef.current).toBe(input.__internals.analyserNode);
    expect(input.__internals.gainNode.gain.value).toBe(0.45);
    expect(input.__internals.gainNode.connect).toHaveBeenCalledWith(input.__internals.analyserNode);
    expect(input.__internals.analyserNode.connect).toHaveBeenCalledWith(
      input.__internals.context.destination,
    );
  });

  it("marks audio as unsupported or failed when bootstrap cannot produce a context", async () => {
    const unsupportedInput = createInput({
      createAudioContext: vi.fn(() => null),
    });
    const unsupported = renderHook(() => useLiveLogMonitorAudioBootstrap(unsupportedInput));

    await unsupported.result.current.ensureAudioReady();

    expect(unsupportedInput.setAudioStatus).toHaveBeenCalledWith("unsupported");

    const failingInput = createInput({
      createAudioContext: vi.fn(() => {
        throw new Error("broken audio");
      }),
    });
    const failing = renderHook(() => useLiveLogMonitorAudioBootstrap(failingInput));

    await failing.result.current.ensureAudioReady();

    expect(failingInput.logger.error).toHaveBeenCalled();
    expect(failingInput.setAudioStatus).toHaveBeenCalledWith("error");
  });
});
