import { describe, expect, it, vi } from "vitest";

import {
  disposeMonitorAudio,
  prepareBackgroundMonitorAudio,
  readMonitorTrackAudioSnapshot,
  stopMonitorAudio,
} from "../../../src/features/simple/monitorTrackAudioRuntime";

function createAudio(overrides: Partial<HTMLAudioElement> = {}): HTMLAudioElement {
  return {
    pause: vi.fn(),
    currentTime: 24,
    duration: 120,
    src: "",
    load: vi.fn(),
    loop: false,
    volume: 0,
    muted: true,
    defaultMuted: true,
    preload: "none",
    crossOrigin: null,
    ...overrides,
  } as unknown as HTMLAudioElement;
}

describe("monitorTrackAudioRuntime", () => {
  it("stops and disposes managed audio safely", () => {
    const audio = createAudio();
    const revoke = vi.fn();

    stopMonitorAudio(audio);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);

    const disposed = disposeMonitorAudio(audio, "blob:track", revoke);
    expect(disposed).toBeNull();
    expect(revoke).toHaveBeenCalledWith("blob:track");
  });

  it("disposes null audio while still revoking the managed url", () => {
    const revoke = vi.fn();

    const disposed = disposeMonitorAudio(null, "blob:track", revoke);

    expect(disposed).toBeNull();
    expect(revoke).toHaveBeenCalledWith("blob:track");
  });

  it("reads normalized progress snapshots only when duration is valid", () => {
    expect(readMonitorTrackAudioSnapshot(null)).toBeNull();
    expect(readMonitorTrackAudioSnapshot(createAudio({ duration: Number.NaN }))).toBeNull();
    expect(readMonitorTrackAudioSnapshot(createAudio({ duration: 0 }))).toBeNull();
    expect(
      readMonitorTrackAudioSnapshot(createAudio({ duration: Number.POSITIVE_INFINITY })),
    ).toBeNull();

    expect(readMonitorTrackAudioSnapshot(createAudio({ currentTime: 30, duration: 120 }))).toEqual({
      progress: 0.25,
      elapsedSeconds: 30,
      durationSeconds: 120,
    });

    expect(readMonitorTrackAudioSnapshot(createAudio({ currentTime: 300, duration: 120 }))).toEqual(
      {
        progress: 1,
        elapsedSeconds: 300,
        durationSeconds: 120,
      },
    );

    expect(readMonitorTrackAudioSnapshot(createAudio({ currentTime: -30, duration: 120 }))).toEqual(
      {
        progress: 0,
        elapsedSeconds: -30,
        durationSeconds: 120,
      },
    );
  });

  it("configures background track playback and swaps sources deterministically", () => {
    const audio = createAudio({ src: "blob:old" });
    const revoke = vi.fn();

    const nextUrl = prepareBackgroundMonitorAudio(audio, "blob:new", "blob:old", revoke);
    expect(nextUrl).toBe("blob:new");
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith("blob:old");
    expect(audio.src).toBe("blob:new");
    expect(audio.currentTime).toBe(0);
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(1);
    expect(audio.crossOrigin).toBe("anonymous");

    vi.clearAllMocks();

    const stableUrl = prepareBackgroundMonitorAudio(audio, "blob:new", "blob:new", revoke);
    expect(stableUrl).toBe("blob:new");
    expect(audio.pause).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    expect(audio.load).not.toHaveBeenCalled();
  });

  it("reuses the playback url when the same source is already bound without a cached url", () => {
    const audio = createAudio({ src: "blob:stable" });
    const revoke = vi.fn();

    const stableUrl = prepareBackgroundMonitorAudio(audio, "blob:stable", null, revoke);

    expect(stableUrl).toBe("blob:stable");
    expect(audio.pause).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    expect(audio.load).not.toHaveBeenCalled();
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(1);
    expect(audio.muted).toBe(false);
    expect(audio.defaultMuted).toBe(false);
    expect(audio.preload).toBe("auto");
    expect(audio.crossOrigin).toBe("anonymous");
  });
});
