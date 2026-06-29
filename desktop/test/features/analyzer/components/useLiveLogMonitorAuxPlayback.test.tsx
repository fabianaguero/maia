import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorAuxPlayback } from "../../../../src/features/analyzer/components/useLiveLogMonitorAuxPlayback";

const playManagedWavBlobStateMock = vi.fn();

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorAudioRuntime", () => ({
  playManagedWavBlobState: (...args: unknown[]) => playManagedWavBlobStateMock(...args),
}));

function createInput(overrides: Record<string, unknown> = {}) {
  const source = {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    disconnect: vi.fn(),
    onended: null as null | (() => void),
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const oscillator = {
    type: "sine",
    frequency: {
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const context = {
    currentTime: 12,
    decodeAudioData: vi.fn(async () => ({ id: "decoded" })),
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gain),
    createOscillator: vi.fn(() => oscillator),
  };

  return {
    ensureAudioReady: vi.fn(async () => context),
    masterGainRef: { current: { id: "master-gain" } },
    masterVolume: 0.6,
    activeBlobAudioElements: new Set(),
    setAudioStatus: vi.fn(),
    logger: { warn: vi.fn() },
    toMessage: vi.fn((error: unknown) => String(error)),
    __internals: { context, source, gain, oscillator },
    ...overrides,
  } as never;
}

describe("useLiveLogMonitorAuxPlayback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("plays rendered blobs through WebAudio when context and destination are available", async () => {
    const input = createInput();
    const blob = {
      arrayBuffer: vi.fn(async () => new ArrayBuffer(8)),
    } as unknown as Blob;
    const { result } = renderHook(() => useLiveLogMonitorAuxPlayback(input));

    await act(async () => {
      await result.current.playRenderedBlobThroughGraph(blob, 1.4);
    });

    expect(input.ensureAudioReady).toHaveBeenCalled();
    expect(blob.arrayBuffer).toHaveBeenCalled();
    expect(input.__internals.gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 12);
    expect(input.__internals.source.connect).toHaveBeenCalledWith(input.__internals.gain);
    expect(input.__internals.gain.connect).toHaveBeenCalledWith(input.masterGainRef.current);
    expect(input.__internals.source.start).toHaveBeenCalledWith(12.01);
    expect(input.setAudioStatus).toHaveBeenCalledWith("ready");
    expect(playManagedWavBlobStateMock).not.toHaveBeenCalled();
  });

  it("falls back to managed audio and emits the panel test tone sequence", async () => {
    const fallbackInput = createInput();
    const fallbackContext = {
      ...fallbackInput.__internals.context,
      decodeAudioData: vi.fn(async () => {
        throw new Error("decode failed");
      }),
    };
    const input = createInput({
      ensureAudioReady: vi.fn(async () => fallbackContext),
      __internals: {
        ...fallbackInput.__internals,
        context: fallbackContext,
      },
    });
    const blob = new Blob(["wav"]);
    const { result } = renderHook(() => useLiveLogMonitorAuxPlayback(input));

    await act(async () => {
      await result.current.playRenderedBlobThroughGraph(blob, -0.25);
    });

    expect(input.logger.warn).toHaveBeenCalled();
    expect(playManagedWavBlobStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        blob,
        volume: 0,
        activeBlobAudioElements: input.activeBlobAudioElements,
      }),
    );

    await act(async () => {
      await result.current.playPanelTestTone();
    });

    expect(input.__internals.context.createOscillator).toHaveBeenCalledTimes(3);
    expect(input.__internals.oscillator.start).toHaveBeenCalled();
    expect(input.__internals.oscillator.stop).toHaveBeenCalled();
    expect(input.setAudioStatus).toHaveBeenCalledWith("ready");
  });
});
