import { describe, expect, it, vi } from "vitest";

import {
  applyManagedAudioBlobAvailabilityState,
  readManagedAudioBlobBytes,
} from "../../../../src/features/analyzer/components/managedAudioPlayerBlobHookRuntime";

const { invokeOrFallbackMock } = vi.hoisted(() => ({
  invokeOrFallbackMock: vi.fn(),
}));

vi.mock("../../../../src/api/tauri", () => ({
  invokeOrFallback: (...args: unknown[]) => invokeOrFallbackMock(...args),
}));

describe("managedAudioPlayerBlobHookRuntime", () => {
  it("handles idle and unavailable availability states", () => {
    const audio = {
      pause: vi.fn(),
      src: "blob:old",
    } as unknown as HTMLAudioElement;
    const setPlaybackState = vi.fn();

    expect(
      applyManagedAudioBlobAvailabilityState({
        availability: "idle",
        audio,
        setPlaybackState,
      }),
    ).toBe(false);
    expect(setPlaybackState).toHaveBeenCalledWith("idle");
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe("");

    expect(
      applyManagedAudioBlobAvailabilityState({
        availability: "unavailable",
        audio,
        setPlaybackState,
      }),
    ).toBe(false);
    expect(setPlaybackState).toHaveBeenCalledWith("unavailable");
  });

  it("returns loadable state as active loading", () => {
    const setPlaybackState = vi.fn();

    expect(
      applyManagedAudioBlobAvailabilityState({
        availability: "loadable",
        audio: null,
        setPlaybackState,
      }),
    ).toBe(true);
    expect(setPlaybackState).toHaveBeenCalledWith("loading");
  });

  it("delegates blob byte reads through the tauri API bridge", async () => {
    invokeOrFallbackMock.mockResolvedValue("YQ==");

    await expect(readManagedAudioBlobBytes("/music/demo.wav")).resolves.toBe("YQ==");
    expect(invokeOrFallbackMock).toHaveBeenCalledWith(
      "read_audio_bytes",
      { path: "/music/demo.wav" },
      expect.any(Function),
    );
  });
});
