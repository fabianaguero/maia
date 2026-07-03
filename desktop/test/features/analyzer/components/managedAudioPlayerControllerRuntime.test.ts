import { describe, expect, it, vi } from "vitest";

import {
  buildManagedAudioPlayerControllerViewState,
  seekManagedAudioPlayback,
  toggleManagedAudioPlayback,
} from "../../../../src/features/analyzer/components/managedAudioPlayerControllerRuntime";

describe("managedAudioPlayerControllerRuntime", () => {
  it("toggles playback with end-reset and surfaces toggle failures", async () => {
    const audio = {
      paused: true,
      currentTime: 95,
      play: vi.fn(async () => undefined),
      pause: vi.fn(),
    } as unknown as HTMLAudioElement;
    const setCurrentTimeSeconds = vi.fn();
    const setPlaybackState = vi.fn();
    const setPlaybackError = vi.fn();

    await toggleManagedAudioPlayback({
      audio,
      blobReady: true,
      resolvedDurationSeconds: 95,
      currentTimeSeconds: 95,
      setCurrentTimeSeconds,
      setPlaybackState,
      setPlaybackError,
    });

    expect(audio.currentTime).toBe(0);
    expect(setCurrentTimeSeconds).toHaveBeenCalledWith(0);
    expect(setPlaybackState).toHaveBeenCalledWith("loading");
    expect(audio.play).toHaveBeenCalled();

    const failingAudio = {
      paused: true,
      currentTime: 22,
      play: vi.fn(async () => {
        throw new Error("play rejected");
      }),
      pause: vi.fn(),
    } as unknown as HTMLAudioElement;

    await toggleManagedAudioPlayback({
      audio: failingAudio,
      blobReady: true,
      resolvedDurationSeconds: 95,
      currentTimeSeconds: 22,
      setCurrentTimeSeconds,
      setPlaybackState,
      setPlaybackError,
    });

    expect(setPlaybackState).toHaveBeenCalledWith("error");
    expect(setPlaybackError).toHaveBeenCalledWith("play rejected");
  });

  it("seeks deterministically and derives scrubber/note view state", () => {
    const audio = { currentTime: 0 } as HTMLAudioElement;
    const setCurrentTimeSeconds = vi.fn();

    seekManagedAudioPlayback({
      audio,
      nextTime: 22,
      setCurrentTimeSeconds,
    });

    expect(audio.currentTime).toBe(22);
    expect(setCurrentTimeSeconds).toHaveBeenCalledWith(22);

    expect(
      buildManagedAudioPlayerControllerViewState({
        resolvedDurationSeconds: 95,
        durationSeconds: 95,
        currentTimeSeconds: 22,
        audioPath: "/music/demo.wav",
        blobReady: true,
        playbackState: "ready",
        missingNote: "Missing audio",
        browserFallbackNote: "Browser fallback",
        desktopOnlyNote: "Desktop only",
        availableNote: "Ready to play",
      }),
    ).toMatchObject({
      shownDurationSeconds: 95,
      scrubberRange: { max: 95, value: 22 },
      note: "Ready to play",
    });
  });
});
