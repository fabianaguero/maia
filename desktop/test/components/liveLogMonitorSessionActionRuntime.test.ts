import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bounceLiveLogMonitorSessionAction,
  buildLiveLogMonitorStartWarningUpdater,
  startLiveLogMonitorSessionAction,
  stopLiveLogMonitorSessionAction,
} from "../../src/features/analyzer/components/liveLogMonitorSessionActionRuntime";
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

describe("liveLogMonitorSessionActionRuntime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("builds warning updaters and starts live monitor sessions", async () => {
    const input = createBaseInput();

    expect(buildLiveLogMonitorStartWarningUpdater("warn")(["a"])).toEqual(["warn", "a"]);

    await startLiveLogMonitorSessionAction(input);

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
    await startLiveLogMonitorSessionAction({
      repository: createRepository() as never,
      adapterKind: "file",
      ensureAudioReady: vi.fn(async () => null),
      monitor: {
        startSession: vi.fn(async () => false),
      },
      referenceAnchorBpm: null,
      useBeatGrid: false,
      rhythmDivision: 4,
      audioContextRef: { current: null },
      beatClockRef: { current: null },
      beatLooperRef: { current: null },
      toMessage: (error) => String(error),
      applyStartReset: vi.fn(),
      setBeatClockBpm: vi.fn(),
      setBeatLooperActive: vi.fn(),
      setRecentWarnings: vi.fn(),
      setError,
      setIsStarting: vi.fn(),
      ensureBackgroundAudio: vi.fn(),
      masterGainRef: { current: null },
    } as never);

    expect(setError).toHaveBeenCalledWith(expect.stringContaining("Maia could not start"));
  });

  it("records a start warning for tmp file paths before starting", async () => {
    const input = createBaseInput();

    await startLiveLogMonitorSessionAction({
      ...input,
      repository: {
        ...createRepository(),
        sourcePath: "/tmp/visits-service.log",
      } as never,
    });

    expect(input.setRecentWarnings).toHaveBeenCalledTimes(1);
    const warningUpdater = input.setRecentWarnings.mock.calls[0]?.[0] as
      | ((current: string[]) => string[])
      | undefined;
    expect(warningUpdater?.([])[0]).toContain("/tmp/");
  });

  it("stops monitor sessions and tears down the audio graph", () => {
    const input = createBaseInput();

    stopLiveLogMonitorSessionAction(input);

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

  it("exports bounce files only when rendering returns a blob", () => {
    const input = createBaseInput();
    input.bounceCuesRef.current = [[{ id: "cue-1" } as never]];
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:maia");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string,
    ) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        element.click = clickSpy;
      }
      return element;
    }) as typeof document.createElement);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((
      callback: TimerHandler,
    ) => {
      if (typeof callback === "function") callback();
      return 1 as never;
    }) as typeof setTimeout);
    vi.mocked(renderBounceWav).mockReturnValue(new Blob(["wav"], { type: "audio/wav" }));

    bounceLiveLogMonitorSessionAction(input);

    expect(renderBounceWav).toHaveBeenCalledWith(input.bounceCuesRef.current, 0.45);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:maia");
    expect(setTimeoutSpy).toHaveBeenCalled();

    vi.mocked(renderBounceWav).mockReturnValue(null);
    input.bounceCuesRef.current = [];

    bounceLiveLogMonitorSessionAction(input);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
