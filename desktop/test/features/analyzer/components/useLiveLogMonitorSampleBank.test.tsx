import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorSampleBank } from "../../../../src/features/analyzer/components/useLiveLogMonitorSampleBank";

const state = vi.hoisted(() => ({
  isTauri: vi.fn(() => false),
  resolveResolvableManagedSampleSources: vi.fn(() => []),
  fetchAndDecodeManagedSampleSources: vi.fn(async () => []),
}));

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: state.isTauri,
}));

vi.mock("../../../../src/features/analyzer/components/liveLogMonitorSampleRuntime", () => ({
  resolveResolvableManagedSampleSources: state.resolveResolvableManagedSampleSources,
  fetchAndDecodeManagedSampleSources: state.fetchAndDecodeManagedSampleSources,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createInput() {
  return {
    sampleSources: [{ path: "/samples/kick.wav", label: "Kick" }],
    audioContextRef: { current: null as AudioContext | null },
    sampleBuffersRef: { current: new Map<string, AudioBuffer>() },
    setSampleStatus: vi.fn(),
    createAudioContext: vi.fn(() => ({ id: "ctx" }) as unknown as AudioContext),
    onLoadError: vi.fn(),
  };
}

describe("useLiveLogMonitorSampleBank", () => {
  it("marks the bank unavailable when no resolvable sources exist", () => {
    const input = createInput();
    input.sampleBuffersRef.current = new Map([["stale", {} as AudioBuffer]]);
    state.resolveResolvableManagedSampleSources.mockReturnValueOnce([]);

    renderHook(() => useLiveLogMonitorSampleBank(input));

    expect(state.resolveResolvableManagedSampleSources).toHaveBeenCalledWith(
      input.sampleSources,
      false,
    );
    expect(input.sampleBuffersRef.current.size).toBe(0);
    expect(input.setSampleStatus).toHaveBeenCalledWith("unavailable");
    expect(state.fetchAndDecodeManagedSampleSources).not.toHaveBeenCalled();
  });

  it("marks the bank unavailable when audio context creation fails", async () => {
    const input = createInput();
    input.createAudioContext.mockReturnValueOnce(null);
    state.resolveResolvableManagedSampleSources.mockReturnValueOnce([
      { path: "/samples/kick.wav", label: "Kick", url: "asset://kick.wav" },
    ]);

    renderHook(() => useLiveLogMonitorSampleBank(input));

    await waitFor(() => {
      expect(input.setSampleStatus).toHaveBeenCalledWith("loading");
      expect(input.setSampleStatus).toHaveBeenCalledWith("unavailable");
    });

    expect(state.fetchAndDecodeManagedSampleSources).not.toHaveBeenCalled();
  });

  it("loads decoded buffers and marks the bank ready", async () => {
    const input = createInput();
    const buffer = { id: "buffer-1" } as unknown as AudioBuffer;
    state.resolveResolvableManagedSampleSources.mockReturnValueOnce([
      { path: "/samples/kick.wav", label: "Kick", url: "asset://kick.wav" },
    ]);
    state.fetchAndDecodeManagedSampleSources.mockResolvedValueOnce([
      ["/samples/kick.wav", buffer] as const,
    ]);

    renderHook(() => useLiveLogMonitorSampleBank(input));

    await waitFor(() => {
      expect(input.setSampleStatus).toHaveBeenCalledWith("ready");
    });

    expect(input.createAudioContext).toHaveBeenCalledTimes(1);
    expect(state.fetchAndDecodeManagedSampleSources).toHaveBeenCalledWith(
      input.audioContextRef.current,
      [{ path: "/samples/kick.wav", label: "Kick", url: "asset://kick.wav" }],
    );
    expect(input.sampleBuffersRef.current.get("/samples/kick.wav")).toBe(buffer);
  });

  it("reports load errors and ignores late results after unmount", async () => {
    const load = deferred<ReadonlyArray<readonly [string, AudioBuffer]>>();
    const input = createInput();
    state.resolveResolvableManagedSampleSources.mockReturnValue([
      { path: "/samples/kick.wav", label: "Kick", url: "asset://kick.wav" },
    ]);
    state.fetchAndDecodeManagedSampleSources.mockReturnValueOnce(load.promise);

    const { unmount } = renderHook(() => useLiveLogMonitorSampleBank(input));

    await waitFor(() => {
      expect(input.setSampleStatus).toHaveBeenCalledWith("loading");
    });

    unmount();

    await act(async () => {
      load.reject(new Error("decode boom"));
      try {
        await load.promise;
      } catch {
        // expected
      }
    });

    expect(input.setSampleStatus).not.toHaveBeenCalledWith("error");
    expect(input.onLoadError).not.toHaveBeenCalled();

    const failingInput = createInput();
    state.resolveResolvableManagedSampleSources.mockReturnValueOnce([
      { path: "/samples/kick.wav", label: "Kick", url: "asset://kick.wav" },
    ]);
    state.fetchAndDecodeManagedSampleSources.mockRejectedValueOnce(new Error("decode boom"));

    renderHook(() => useLiveLogMonitorSampleBank(failingInput));

    await waitFor(() => {
      expect(failingInput.setSampleStatus).toHaveBeenCalledWith("error");
    });
    expect(failingInput.sampleBuffersRef.current.size).toBe(0);
    expect(failingInput.onLoadError).toHaveBeenCalledWith("decode boom");
  });
});
