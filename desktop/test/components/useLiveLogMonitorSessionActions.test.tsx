import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorSessionActions } from "../../src/features/analyzer/components/useLiveLogMonitorSessionActions";
import { stopLiveMonitorAudioGraph } from "../../src/features/analyzer/components/liveLogMonitorAudioCleanupRuntime";

vi.mock("../../src/features/analyzer/components/liveLogMonitorAudioCleanupRuntime", () => ({
  stopLiveMonitorAudioGraph: vi.fn(),
}));

vi.mock("../../src/features/analyzer/components/wavRenderer", () => ({
  BOUNCE_WINDOW_S: 4,
  renderBounceWav: vi.fn(),
}));

import { renderBounceWav } from "../../src/features/analyzer/components/wavRenderer";

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockAudioNode {
  connect = vi.fn();
}

class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = "sine";
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

function createRepository() {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
  };
}

function createAudioContext() {
  return {
    currentTime: 24,
    destination: {},
    createOscillator: vi.fn(() => new MockOscillatorNode()),
    createGain: vi.fn(() => new MockGainNode()),
  } as unknown as AudioContext;
}

function createBaseInput() {
  const audioContext = createAudioContext();
  return {
    repository: createRepository() as never,
    adapterKind: "file" as const,
    ensureAudioReady: vi.fn(async () => audioContext),
    monitor: {
      startSession: vi.fn(async () => true),
      stopSession: vi.fn(async () => undefined),
    },
    referenceAnchorBpm: 126,
    useBeatGrid: true,
    rhythmDivision: 4,
    audioContextRef: { current: audioContext },
    beatClockRef: { current: null },
    beatLooperRef: { current: null },
    bounceCuesRef: { current: [] },
    masterVolume: 0.45,
    toMessage: (error: unknown) => String(error),
    applyStartReset: vi.fn(),
    applyStopReset: vi.fn(),
    setBeatClockBpm: vi.fn(),
    setBeatLooperActive: vi.fn(),
    setRecentWarnings: vi.fn(),
    setError: vi.fn(),
    setIsStarting: vi.fn(),
    ensureBackgroundAudio: vi.fn(async () => undefined),
    stopBackgroundDeck: vi.fn(),
    stopBeatLooper: vi.fn(),
    muteManagedBlobAudio: vi.fn(),
    backgroundGainRef: { current: null },
    backgroundDryGainRef: { current: null },
    backgroundDriveWetGainRef: { current: null },
    backgroundDriveNodeRef: { current: null },
    filterNodeRef: { current: null },
    masterGainRef: { current: null },
    analyserRef: { current: null },
  };
}

describe("useLiveLogMonitorSessionActions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("starts a live session, seeds beat timing and primes the background deck", async () => {
    const input = createBaseInput();

    const { result } = renderHook(() =>
      useLiveLogMonitorSessionActions({
        ...input,
      }),
    );

    await act(async () => {
      await result.current.handleStart();
    });

    expect(input.applyStartReset).toHaveBeenCalled();
    expect(input.ensureAudioReady).toHaveBeenCalled();
    expect(input.monitor.startSession).toHaveBeenCalled();
    expect(input.setBeatClockBpm).toHaveBeenCalledWith(126);
    expect(input.setBeatLooperActive).toHaveBeenCalledWith(true);
    expect(input.ensureBackgroundAudio).toHaveBeenCalled();
    expect(input.setRecentWarnings).not.toHaveBeenCalled();
    expect(input.setError).not.toHaveBeenCalledWith(expect.any(String));
    expect(input.setIsStarting).toHaveBeenCalledWith(false);
  });

  it("normalizes start failures into a UI error", async () => {
    const setError = vi.fn();
    const { result } = renderHook(() =>
      useLiveLogMonitorSessionActions({
        repository: createRepository() as never,
        adapterKind: "file",
        ensureAudioReady: vi.fn(async () => null),
        monitor: {
          startSession: vi.fn(async () => false),
          stopSession: vi.fn(async () => undefined),
        },
        referenceAnchorBpm: null,
        useBeatGrid: false,
        rhythmDivision: 4,
        audioContextRef: { current: null },
        beatClockRef: { current: null },
        beatLooperRef: { current: null },
        bounceCuesRef: { current: [] },
        masterVolume: 0.45,
        toMessage: (error) => String(error),
        applyStartReset: vi.fn(),
        applyStopReset: vi.fn(),
        setBeatClockBpm: vi.fn(),
        setBeatLooperActive: vi.fn(),
        setRecentWarnings: vi.fn(),
        setError,
        setIsStarting: vi.fn(),
        ensureBackgroundAudio: vi.fn(),
        stopBackgroundDeck: vi.fn(),
        stopBeatLooper: vi.fn(),
        muteManagedBlobAudio: vi.fn(),
        backgroundGainRef: { current: null },
        backgroundDryGainRef: { current: null },
        backgroundDriveWetGainRef: { current: null },
        backgroundDriveNodeRef: { current: null },
        filterNodeRef: { current: null },
        masterGainRef: { current: null },
        analyserRef: { current: null },
      }),
    );

    await act(async () => {
      await result.current.handleStart();
    });

    expect(setError).toHaveBeenCalledWith(expect.stringContaining("Maia could not start"));
  });

  it("records a start warning for process tails before starting", async () => {
    const input = createBaseInput();

    const { result } = renderHook(() =>
      useLiveLogMonitorSessionActions({
        ...input,
        repository: {
          ...createRepository(),
          sourcePath: "/tmp/visits-service.log",
        } as never,
      }),
    );

    await act(async () => {
      await result.current.handleStart();
    });

    expect(input.setRecentWarnings).toHaveBeenCalledTimes(1);
    const warningUpdater = input.setRecentWarnings.mock.calls[0]?.[0] as
      | ((current: string[]) => string[])
      | undefined;
    expect(warningUpdater?.([])[0]).toContain("/tmp/");
  });

  it("stops the session, applies reset state and tears down the audio graph", async () => {
    const input = createBaseInput();

    const { result } = renderHook(() =>
      useLiveLogMonitorSessionActions({
        ...input,
      }),
    );

    await act(async () => {
      result.current.handleStop();
    });

    expect(input.monitor.stopSession).toHaveBeenCalledTimes(1);
    expect(input.applyStopReset).toHaveBeenCalledTimes(1);
    expect(stopLiveMonitorAudioGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        stopBackgroundDeck: input.stopBackgroundDeck,
        stopBeatLooper: input.stopBeatLooper,
        muteManagedBlobAudio: input.muteManagedBlobAudio,
      }),
    );
  });

  it("exports a bounce file only when renderBounceWav returns a blob", async () => {
    const input = createBaseInput();
    input.bounceCuesRef.current = [[{ id: "cue-1" } as never]];
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:maia");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          element.click = clickSpy;
        }
        return element;
      }) as typeof document.createElement);
    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation(((callback: TimerHandler) => {
        if (typeof callback === "function") callback();
        return 1 as never;
      }) as typeof setTimeout);
    vi.mocked(renderBounceWav).mockReturnValue(new Blob(["wav"], { type: "audio/wav" }));

    const { result, rerender } = renderHook(
      ({ currentInput }) => useLiveLogMonitorSessionActions(currentInput),
      {
        initialProps: { currentInput: input },
      },
    );

    act(() => {
      result.current.handleBounce();
    });

    expect(renderBounceWav).toHaveBeenCalledWith(input.bounceCuesRef.current, 0.45);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:maia");
    expect(setTimeoutSpy).toHaveBeenCalled();

    vi.mocked(renderBounceWav).mockReturnValue(null);
    input.bounceCuesRef.current = [];
    rerender({ currentInput: input });

    act(() => {
      result.current.handleBounce();
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
