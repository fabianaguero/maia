import { describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import {
  cleanupSessionBedAudio,
  ensureSessionBedAudio,
  loadSessionScreenEvents,
  resetSessionBedAudio,
  syncSessionBedAudio,
  type SessionBedAudioLike,
} from "../../../src/features/session/sessionScreenEffectsRuntime";

function createAudio(overrides: Partial<SessionBedAudioLike> = {}): SessionBedAudioLike {
  return {
    currentTime: 12,
    loop: false,
    pause: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    preload: "none",
    src: "",
    volume: 1,
    ...overrides,
  };
}

describe("sessionScreenEffectsRuntime", () => {
  it("creates and configures booth bed audio once", () => {
    const audio = createAudio();
    const audioRef = { current: null as SessionBedAudioLike | null };

    const first = ensureSessionBedAudio(audioRef, () => audio);
    const second = ensureSessionBedAudio(audioRef, () => createAudio());

    expect(first).toBe(audio);
    expect(second).toBe(audio);
    expect(audio.loop).toBe(true);
    expect(audio.preload).toBe("auto");
    expect(audio.volume).toBe(0.2);
  });

  it("resets and cleans up bed audio", () => {
    const audio = createAudio({ src: "file:///bed.wav" });
    const audioRef = { current: audio };

    resetSessionBedAudio(audio);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    expect(audio.src).toBe("");

    audio.src = "file:///bed.wav";
    cleanupSessionBedAudio(audioRef);
    expect(audio.pause).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe("");
    expect(audioRef.current).toBeNull();
  });

  it("syncs active bed audio and ignores play failures", async () => {
    const audio = createAudio({ src: "file:///old.wav" });

    await syncSessionBedAudio(audio, "file:///next.wav");
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe("file:///next.wav");
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(1);

    await syncSessionBedAudio(audio, null);
    expect(audio.pause).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe("");

    const failingAudio = createAudio({
      play: vi.fn().mockRejectedValue(new Error("autoplay blocked")),
      src: "file:///same.wav",
    });
    await expect(syncSessionBedAudio(failingAudio, "file:///same.wav")).resolves.toBeUndefined();
  });

  it("loads session events and falls back to empty lists", async () => {
    const events: SessionEvent[] = [
      {
        id: "evt-1",
        sessionId: "session-1",
        eventType: "started",
        payloadJson: "{}",
        createdAt: "2026-06-29T21:20:00.000Z",
      },
    ];

    await expect(
      loadSessionScreenEvents("session-1", vi.fn().mockResolvedValue(events)),
    ).resolves.toEqual(events);
    await expect(loadSessionScreenEvents(null, vi.fn())).resolves.toEqual([]);
    await expect(
      loadSessionScreenEvents("session-1", vi.fn().mockRejectedValue(new Error("boom"))),
    ).resolves.toEqual([]);
  });
});
