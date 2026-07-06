import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionEvent } from "../../../src/api/sessions";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import { useSessionScreenEffects } from "../../../src/features/session/useSessionScreenEffects";

const sessionsApiMock = vi.hoisted(() => ({
  listSessionEvents: vi.fn(),
}));

vi.mock("../../../src/api/sessions", () => sessionsApiMock);

function createAudioMock() {
  return {
    currentTime: 0,
    loop: false,
    pause: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    preload: "none",
    src: "",
    volume: 1,
  };
}

describe("useSessionScreenEffects", () => {
  const originalAudio = globalThis.Audio;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
  });

  it("resets latest update, subscribes to monitor updates, and loads session events", async () => {
    const latestUpdates: Array<LiveLogStreamUpdate | null> = [];
    const selectedEvents: SessionEvent[][] = [];
    const listeners: Array<(update: LiveLogStreamUpdate) => void> = [];
    const unsubscribe = vi.fn();
    const subscribeToMonitor = vi.fn((listener: (update: LiveLogStreamUpdate) => void) => {
      listeners.push(listener);
      return unsubscribe;
    });

    sessionsApiMock.listSessionEvents.mockResolvedValue([
      {
        id: "evt-1",
        sessionId: "session-1",
        eventType: "started",
        payloadJson: "{}",
        createdAt: "2026-06-29T21:25:00.000Z",
      },
    ]);

    const audioRef = { current: null as HTMLAudioElement | null };
    const setLatestUpdate = (update: LiveLogStreamUpdate | null) => latestUpdates.push(update);
    const setSelectedSessionEvents = (events: SessionEvent[]) => selectedEvents.push(events);

    const { rerender, unmount } = renderHook(
      (props: { monitorSessionId: string | null; selectedSessionIdForEvents: string | null }) =>
        useSessionScreenEffects({
          monitorSessionId: props.monitorSessionId,
          subscribeToMonitor,
          setLatestUpdate,
          selectedSessionIdForEvents: props.selectedSessionIdForEvents,
          setSelectedSessionEvents,
          activeBedUrl: null,
          boothBedAudioRef: audioRef,
        }),
      {
        initialProps: {
          monitorSessionId: "monitor-1",
          selectedSessionIdForEvents: "session-1",
        },
      },
    );

    await waitFor(() => {
      expect(subscribeToMonitor).toHaveBeenCalledTimes(1);
      expect(sessionsApiMock.listSessionEvents).toHaveBeenCalledWith("session-1");
      expect(selectedEvents.at(-1)).toHaveLength(1);
    });

    expect(latestUpdates[0]).toBeNull();

    act(() => {
      listeners[0]?.({
        hasData: true,
        lines: [],
        anomalies: [],
        cues: [],
        dominantLevel: "info",
        componentCounts: [],
      });
    });

    expect(latestUpdates.at(-1)).toMatchObject({ hasData: true });

    rerender({
      monitorSessionId: "monitor-2",
      selectedSessionIdForEvents: null,
    });

    await waitFor(() => {
      expect(selectedEvents.at(-1)).toEqual([]);
    });

    expect(latestUpdates.at(-1)).toBeNull();

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("manages booth bed audio lifecycle and swallows event loading failures", async () => {
    const audio = createAudioMock();
    globalThis.Audio = vi.fn(() => audio as unknown as HTMLAudioElement) as unknown as typeof Audio;
    sessionsApiMock.listSessionEvents.mockRejectedValue(new Error("events boom"));

    const audioRef = { current: null as HTMLAudioElement | null };

    const { rerender, unmount } = renderHook(
      (props: { activeBedUrl: string | null }) =>
        useSessionScreenEffects({
          monitorSessionId: "monitor-1",
          subscribeToMonitor: () => () => undefined,
          setLatestUpdate: vi.fn(),
          selectedSessionIdForEvents: "session-2",
          setSelectedSessionEvents: vi.fn(),
          activeBedUrl: props.activeBedUrl,
          boothBedAudioRef: audioRef,
        }),
      {
        initialProps: {
          activeBedUrl: "file:///bed.wav",
        },
      },
    );

    await waitFor(() => {
      expect(globalThis.Audio).toHaveBeenCalledTimes(1);
      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(audio.src).toBe("file:///bed.wav");
      expect(audio.loop).toBe(true);
      expect(audio.preload).toBe("auto");
      expect(audio.volume).toBe(0.2);
    });

    rerender({ activeBedUrl: null });

    await waitFor(() => {
      expect(audio.pause).toHaveBeenCalled();
      expect(audio.src).toBe("");
    });

    unmount();
    expect(audioRef.current).toBeNull();
  });
});
