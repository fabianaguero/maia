import { describe, expect, it, vi } from "vitest";

import {
  cleanupManagedAudioBlobState,
  resetManagedAudioBlobState,
  resolveManagedAudioBlobAvailability,
} from "../../../../src/features/analyzer/components/managedAudioPlayerBlobLifecycleRuntime";

describe("managedAudioPlayerBlobLifecycleRuntime", () => {
  it("resets blob state and revokes the previous url", () => {
    const blobUrlRef = { current: "blob:old" };
    const lastCueRequestIdRef = { current: 42 };
    const revokeObjectUrl = vi.fn();
    const setters = {
      setBlobReady: vi.fn(),
      setPlaybackState: vi.fn(),
      setPlaybackError: vi.fn(),
      setCurrentTimeSeconds: vi.fn(),
      setResolvedDurationSeconds: vi.fn(),
    };

    resetManagedAudioBlobState({
      blobUrlRef,
      lastCueRequestIdRef,
      durationSeconds: 95,
      revokeObjectUrl,
      setters,
    });

    expect(setters.setPlaybackError).toHaveBeenCalledWith(null);
    expect(setters.setCurrentTimeSeconds).toHaveBeenCalledWith(0);
    expect(setters.setBlobReady).toHaveBeenCalledWith(false);
    expect(setters.setResolvedDurationSeconds).toHaveBeenCalledWith(95);
    expect(lastCueRequestIdRef.current).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:old");
    expect(blobUrlRef.current).toBeNull();
  });

  it("resolves idle, unavailable and loadable blob states", () => {
    expect(
      resolveManagedAudioBlobAvailability({
        audioPath: null,
        audio: null,
        isDesktopRuntime: true,
      }),
    ).toBe("idle");

    expect(
      resolveManagedAudioBlobAvailability({
        audioPath: "/music/demo.wav",
        audio: null,
        isDesktopRuntime: true,
      }),
    ).toBe("unavailable");

    expect(
      resolveManagedAudioBlobAvailability({
        audioPath: "/music/demo.wav",
        audio: { pause: vi.fn(), src: "" } as unknown as HTMLAudioElement,
        isDesktopRuntime: true,
      }),
    ).toBe("loadable");
  });

  it("cleans up listeners, pauses audio and revokes blob urls", () => {
    const audio = {
      pause: vi.fn(),
      src: "blob:current",
    } as unknown as HTMLAudioElement;
    const blobUrlRef = { current: "blob:current" };
    const revokeObjectUrl = vi.fn();
    const cleanupListeners = vi.fn();

    cleanupManagedAudioBlobState({
      audio,
      blobUrlRef,
      revokeObjectUrl,
      cleanupListeners,
    });

    expect(cleanupListeners).toHaveBeenCalledTimes(1);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe("");
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:current");
    expect(blobUrlRef.current).toBeNull();
  });
});
