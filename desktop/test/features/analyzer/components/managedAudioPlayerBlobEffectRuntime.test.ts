import { describe, expect, it, vi } from "vitest";

import {
  applyManagedAudioBlobLoadFailure,
  loadManagedAudioBlobEffectState,
} from "../../../../src/features/analyzer/components/managedAudioPlayerBlobEffectRuntime";

function createAudioMock() {
  return {
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    currentTime: 0,
    volume: 0,
    src: "",
    duration: 90,
    paused: true,
  } as unknown as HTMLAudioElement;
}

describe("managedAudioPlayerBlobEffectRuntime", () => {
  it("loads the blob source, binds listeners and primes the audio element", async () => {
    const audio = createAudioMock();
    const blobUrlRef = { current: null };
    const setBlobReady = vi.fn();
    const setPlaybackState = vi.fn();
    const setPlaybackError = vi.fn();
    const setCurrentTimeSeconds = vi.fn();
    const setResolvedDurationSeconds = vi.fn();
    const cleanup = await loadManagedAudioBlobEffectState({
      audioPath: "/music/demo.wav",
      audio,
      errorNote: "Playback failed",
      volume: 0.8,
      blobUrlRef: blobUrlRef as never,
      setBlobReady,
      setPlaybackState,
      setPlaybackError,
      setCurrentTimeSeconds,
      setResolvedDurationSeconds,
      readAudioBytes: async () => "YQ==",
      createObjectUrl: () => "blob:managed-audio",
    });

    expect(blobUrlRef.current).toBe("blob:managed-audio");
    expect(audio.src).toBe("blob:managed-audio");
    expect(audio.volume).toBe(0.8);
    expect(audio.load).toHaveBeenCalled();
    expect(setBlobReady).toHaveBeenCalledWith(true);
    expect(typeof cleanup).toBe("function");
  });

  it("normalizes load failures", () => {
    const setPlaybackState = vi.fn();
    const setPlaybackError = vi.fn();

    applyManagedAudioBlobLoadFailure({
      error: new Error("decode failed"),
      setPlaybackState,
      setPlaybackError,
    });

    expect(setPlaybackState).toHaveBeenCalledWith("error");
    expect(setPlaybackError).toHaveBeenCalledWith("Cannot load audio: Error: decode failed");
  });
});
