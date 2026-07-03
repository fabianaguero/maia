import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useManagedAudioPlayerController } from "../../src/features/analyzer/components/useManagedAudioPlayerController";

const { invokeMock, isTauriMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
  isTauri: () => isTauriMock(),
}));

type ControllerProps = ComponentProps<typeof ControllerHarness>;

type ControllerState = ReturnType<typeof useManagedAudioPlayerController>;

interface AudioHarness {
  pausedRef: { current: boolean };
  currentTimeRef: { current: number };
}

function mountAudioHarness(audio: HTMLAudioElement, duration = 95): AudioHarness {
  const pausedRef = { current: true };
  const currentTimeRef = { current: 0 };

  Object.defineProperty(audio, "paused", {
    configurable: true,
    get: () => pausedRef.current,
  });

  Object.defineProperty(audio, "duration", {
    configurable: true,
    get: () => duration,
  });

  Object.defineProperty(audio, "currentTime", {
    configurable: true,
    get: () => currentTimeRef.current,
    set: (value: number) => {
      currentTimeRef.current = value;
    },
  });

  audio.play = vi.fn().mockImplementation(async () => {
    pausedRef.current = false;
    audio.dispatchEvent(new Event("play"));
  });
  audio.pause = vi.fn().mockImplementation(() => {
    pausedRef.current = true;
    audio.dispatchEvent(new Event("pause"));
  });
  audio.load = vi.fn();

  return { pausedRef, currentTimeRef };
}

function ControllerHarness(props: {
  audioPath: string | null;
  durationSeconds: number | null;
  errorNote: string;
  missingNote: string;
  browserFallbackNote: string;
  desktopOnlyNote: string;
  availableNote: string;
  onTimeUpdate?: (seconds: number) => void;
  cueRequest?: { id: number; second: number; autoplay?: boolean } | null;
  onState: (state: ControllerState) => void;
}) {
  const { onState, ...hookInput } = props;
  const state = useManagedAudioPlayerController(hookInput);
  onState(state);
  return <audio ref={state.audioRef} />;
}

describe("useManagedAudioPlayerController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTauriMock.mockReturnValue(true);
    invokeMock.mockResolvedValue("YQ==");
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:managed-audio");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads desktop audio, clamps autoplay cues, and resets from the end before replay", async () => {
    const onTimeUpdate = vi.fn();
    let latestState: ControllerState | null = null;

    const baseProps: Omit<ControllerProps, "onState"> = {
      audioPath: "/music/guide-track.wav",
      durationSeconds: 95,
      errorNote: "Playback failed",
      missingNote: "Missing audio",
      browserFallbackNote: "Browser fallback",
      desktopOnlyNote: "Desktop only",
      availableNote: "Ready to play",
      onTimeUpdate,
      cueRequest: null,
    };

    const { container, rerender } = render(
      <ControllerHarness
        {...baseProps}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    const audio = container.querySelector("audio");
    expect(audio).toBeInstanceOf(HTMLAudioElement);
    const harness = mountAudioHarness(audio as HTMLAudioElement);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith("read_audio_bytes", {
        path: "/music/guide-track.wav",
      }),
    );
    await waitFor(() => expect(audio?.getAttribute("src")).toBe("blob:managed-audio"));

    act(() => {
      fireEvent(audio as HTMLAudioElement, new Event("loadedmetadata"));
      fireEvent(audio as HTMLAudioElement, new Event("canplay"));
    });

    await waitFor(() => expect(latestState?.canPlayAudio).toBe(true));
    expect(latestState?.note).toBe("Ready to play");

    rerender(
      <ControllerHarness
        {...baseProps}
        cueRequest={{ id: 1, second: 400, autoplay: true }}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    await waitFor(() => expect(harness.currentTimeRef.current).toBe(95));
    await waitFor(() => expect(onTimeUpdate).toHaveBeenLastCalledWith(95));
    await waitFor(() => expect((audio as HTMLAudioElement).play).toHaveBeenCalledTimes(1));

    act(() => {
      harness.currentTimeRef.current = 95;
      fireEvent(audio as HTMLAudioElement, new Event("timeupdate"));
    });

    const pauseCallCountBeforeToggle = (audio as HTMLAudioElement).pause.mock.calls.length;

    await act(async () => {
      await latestState?.handleTogglePlayback();
    });
    expect((audio as HTMLAudioElement).pause.mock.calls.length).toBe(
      pauseCallCountBeforeToggle + 1,
    );
    expect(harness.pausedRef.current).toBe(true);

    await act(async () => {
      await latestState?.handleTogglePlayback();
    });

    expect(harness.currentTimeRef.current).toBe(0);
    expect((audio as HTMLAudioElement).play).toHaveBeenCalledTimes(2);
    expect(latestState?.currentTimeSeconds).toBe(0);
  });

  it("surfaces load failures and autoplay cue playback failures", async () => {
    let latestState: ControllerState | null = null;
    invokeMock.mockRejectedValueOnce(new Error("disk offline"));

    const baseProps: Omit<ControllerProps, "onState"> = {
      audioPath: "/music/broken-track.wav",
      durationSeconds: 95,
      errorNote: "Playback failed",
      missingNote: "Missing audio",
      browserFallbackNote: "Browser fallback",
      desktopOnlyNote: "Desktop only",
      availableNote: "Ready to play",
      cueRequest: null,
    };

    const { container, rerender } = render(
      <ControllerHarness
        {...baseProps}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    const audio = container.querySelector("audio");
    expect(audio).toBeInstanceOf(HTMLAudioElement);
    mountAudioHarness(audio as HTMLAudioElement);

    await waitFor(() => expect(latestState?.playbackState).toBe("error"));
    expect(latestState?.playbackError).toBe("Cannot load audio: Error: disk offline");

    invokeMock.mockResolvedValueOnce("YQ==");
    rerender(
      <ControllerHarness
        {...baseProps}
        audioPath="/music/recovered-track.wav"
        cueRequest={{ id: 9, second: 22, autoplay: false }}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith("read_audio_bytes", {
        path: "/music/recovered-track.wav",
      }),
    );

    act(() => {
      fireEvent(audio as HTMLAudioElement, new Event("canplay"));
    });

    (audio as HTMLAudioElement).play = vi.fn().mockRejectedValueOnce(new Error("play rejected"));

    rerender(
      <ControllerHarness
        {...baseProps}
        audioPath="/music/recovered-track.wav"
        cueRequest={{ id: 10, second: 22, autoplay: true }}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    await waitFor(() => expect(latestState?.playbackState).toBe("error"));
    expect(latestState?.playbackError).toBe("play rejected");
  });
});
