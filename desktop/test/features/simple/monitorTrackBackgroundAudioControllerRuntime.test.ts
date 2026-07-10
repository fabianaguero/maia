import { describe, expect, it, vi } from "vitest";

import { applyMonitorTrackBackgroundBindingState } from "../../../src/features/simple/monitorTrackBackgroundAudioControllerRuntime";

class MockAudioElement {
  src = "";
  currentTime = 0;
  loop = false;
  volume = 1;
  muted = false;
  defaultMuted = false;
  preload = "";
  crossOrigin: string | null = null;
  play = vi.fn(async () => undefined);
  pause = vi.fn();
  load = vi.fn();
}

describe("monitorTrackBackgroundAudioControllerRuntime", () => {
  it("binds the resolved background track and attaches the graph when the context is running", async () => {
    const audio = new MockAudioElement() as unknown as HTMLAudioElement;
    const revokePreviewUrl = vi.fn();

    const result = applyMonitorTrackBackgroundBindingState({
      currentBackgroundAudio: audio,
      currentBackgroundAudioUrl: "blob:old",
      playbackUrl: "blob:new",
      createAudio: vi.fn(() => new MockAudioElement() as unknown as HTMLAudioElement),
      revokePreviewUrl,
      warn: vi.fn(),
    });

    expect(result.backgroundAudio).toBe(audio);
    expect(result.backgroundAudioUrl).toBe("blob:new");
    expect(audio.src).toBe("blob:new");
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:old");
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("creates an audio element when needed and reports playback failures", async () => {
    const audio = new MockAudioElement();
    audio.play = vi.fn(async () => {
      throw new Error("blocked");
    });
    const warn = vi.fn();

    const result = applyMonitorTrackBackgroundBindingState({
      currentBackgroundAudio: null,
      currentBackgroundAudioUrl: null,
      playbackUrl: "blob:new",
      createAudio: vi.fn(() => audio as unknown as HTMLAudioElement),
      revokePreviewUrl: vi.fn(),
      warn,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.backgroundAudio).toBe(audio);
    expect(result.backgroundAudioUrl).toBe("blob:new");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Simple monitor background playback failed"),
      expect.any(Error),
    );
  });
});
