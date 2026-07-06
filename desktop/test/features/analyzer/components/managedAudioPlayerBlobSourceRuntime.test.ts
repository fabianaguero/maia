import { describe, expect, it, vi } from "vitest";

import {
  bindManagedAudioBlobElement,
  createManagedAudioBlobUrl,
  loadManagedAudioBlobElement,
} from "../../../../src/features/analyzer/components/managedAudioPlayerBlobSourceRuntime";

function createAudioMock() {
  const listeners = new Map<string, () => void>();
  return {
    duration: 95,
    paused: true,
    currentTime: 0,
    volume: 0,
    src: "",
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn((type: string, listener: () => void) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type);
    }),
    emit(type: string) {
      listeners.get(type)?.();
    },
  };
}

describe("managedAudioPlayerBlobSourceRuntime", () => {
  it("creates blob urls and primes the audio element", () => {
    const createObjectUrl = vi.fn(() => "blob:managed-audio");
    const url = createManagedAudioBlobUrl({
      audioPath: "/music/demo.wav",
      base64: "YQ==",
      createObjectUrl,
    });

    expect(url).toBe("blob:managed-audio");
    expect(createObjectUrl).toHaveBeenCalledTimes(1);

    const audio = createAudioMock();
    loadManagedAudioBlobElement({
      audio,
      url,
      volume: 0.8,
    });

    expect(audio.pause).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(audio.volume).toBe(0.8);
    expect(audio.src).toBe("blob:managed-audio");
    expect(audio.load).toHaveBeenCalled();
  });

  it("binds audio listeners and reports metadata, time updates and errors", () => {
    const audio = createAudioMock();
    const setResolvedDurationSeconds = vi.fn();
    const setPlaybackState = vi.fn();
    const setPlaybackError = vi.fn();
    const setCurrentTimeSeconds = vi.fn();
    const onTimeUpdate = vi.fn();

    const cleanup = bindManagedAudioBlobElement({
      audio,
      errorNote: "Playback failed",
      onTimeUpdate,
      setResolvedDurationSeconds,
      setPlaybackState,
      setPlaybackError,
      setCurrentTimeSeconds,
    });

    audio.emit("loadedmetadata");
    audio.emit("canplay");
    audio.currentTime = 22;
    audio.emit("timeupdate");
    audio.paused = false;
    audio.emit("play");
    audio.paused = true;
    audio.emit("pause");
    audio.emit("ended");
    audio.emit("error");

    expect(setResolvedDurationSeconds).toHaveBeenCalledWith(95);
    expect(setPlaybackState).toHaveBeenCalledWith("ready");
    expect(setCurrentTimeSeconds).toHaveBeenCalledWith(22);
    expect(onTimeUpdate).toHaveBeenCalledWith(22);
    expect(setPlaybackState).toHaveBeenCalledWith("playing");
    expect(setCurrentTimeSeconds).toHaveBeenCalledWith(95);
    expect(setPlaybackError).toHaveBeenCalledWith("Playback failed");

    cleanup();
    expect(audio.removeEventListener).toHaveBeenCalledTimes(7);
  });
});
