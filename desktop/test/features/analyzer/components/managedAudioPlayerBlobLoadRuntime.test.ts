import { describe, expect, it, vi } from "vitest";

import { startManagedAudioBlobLoad } from "../../../../src/features/analyzer/components/managedAudioPlayerBlobLoadRuntime";

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

function createSetters() {
  return {
    setBlobReady: vi.fn(),
    setPlaybackState: vi.fn(),
    setPlaybackError: vi.fn(),
    setCurrentTimeSeconds: vi.fn(),
    setResolvedDurationSeconds: vi.fn(),
  };
}

describe("managedAudioPlayerBlobLoadRuntime", () => {
  it("loads the blob and stores cleanup listeners", async () => {
    const audio = createAudioMock();
    const blobUrlRef = { current: null };
    const setCleanupListeners = vi.fn();
    const setters = createSetters();

    startManagedAudioBlobLoad({
      audioPath: "/music/demo.wav",
      audio,
      blobUrlRef: blobUrlRef as never,
      errorNote: "Playback failed",
      volume: 0.8,
      isCancelled: () => false,
      setCleanupListeners,
      readAudioBytes: async () => "YQ==",
      createObjectUrl: () => "blob:managed-audio",
      ...setters,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(blobUrlRef.current).toBe("blob:managed-audio");
    expect(audio.src).toBe("blob:managed-audio");
    expect(setCleanupListeners).toHaveBeenCalledWith(expect.any(Function));
  });

  it("normalizes load failures", async () => {
    const setters = createSetters();

    startManagedAudioBlobLoad({
      audioPath: "/music/demo.wav",
      audio: createAudioMock(),
      blobUrlRef: { current: null } as never,
      errorNote: "Playback failed",
      volume: 0.8,
      isCancelled: () => false,
      setCleanupListeners: vi.fn(),
      readAudioBytes: async () => {
        throw new Error("disk offline");
      },
      ...setters,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setters.setPlaybackState).toHaveBeenCalledWith("error");
    expect(setters.setPlaybackError).toHaveBeenCalledWith("Cannot load audio: Error: disk offline");
  });

  it("does not publish cleanup listeners if the load resolves after cancellation", async () => {
    const setters = createSetters();
    let cancelled = false;
    const setCleanupListeners = vi.fn();

    startManagedAudioBlobLoad({
      audioPath: "/music/demo.wav",
      audio: createAudioMock(),
      blobUrlRef: { current: null } as never,
      errorNote: "Playback failed",
      volume: 0.8,
      isCancelled: () => cancelled,
      setCleanupListeners,
      readAudioBytes: async () => "YQ==",
      createObjectUrl: () => "blob:managed-audio",
      ...setters,
    });

    cancelled = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCleanupListeners).not.toHaveBeenCalled();
  });
});
