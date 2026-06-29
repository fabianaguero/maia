import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import { ManagedAudioPlayer, type ManagedAudioCueRequest } from "../../src/features/analyzer/components/ManagedAudioPlayer";

const { invokeMock, isTauriMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
  isTauri: () => isTauriMock(),
}));

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

function renderPlayer(props: Partial<ComponentProps<typeof ManagedAudioPlayer>> = {}) {
  return render(
    <ManagedAudioPlayer
      title="Guide track"
      description="Desktop playback"
      audioPath={null}
      durationSeconds={95}
      playLabel="Play"
      pauseLabel="Pause"
      missingNote="Missing audio"
      browserFallbackNote="Browser fallback"
      desktopOnlyNote="Desktop only"
      availableNote="Ready to play"
      errorNote="Playback failed"
      {...props}
    />,
  );
}

describe("ManagedAudioPlayer", () => {
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

  it("shows browser fallback note and disables desktop transport", () => {
    renderPlayer({
      audioPath: "browser-fallback://preview.mp3",
      durationSeconds: 120,
    });

    expect(screen.getByText("Browser fallback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByLabelText("Guide track scrubber")).toBeDisabled();
  });

  it("loads desktop audio, updates transport state, and reacts to cue jumps", async () => {
    const onTimeUpdate = vi.fn();
    const cueRequest: ManagedAudioCueRequest = { id: 1, second: 12.5, autoplay: true };
    const { rerender, container } = renderPlayer({
      audioPath: "/music/guide-track.wav",
      durationSeconds: 95,
      onTimeUpdate,
    });

    const audio = container.querySelector("audio");
    expect(audio).toBeInstanceOf(HTMLAudioElement);
    const harness = mountAudioHarness(audio as HTMLAudioElement);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith("read_audio_bytes", { path: "/music/guide-track.wav" }),
    );
    await waitFor(() => expect(audio?.getAttribute("src")).toBe("blob:managed-audio"));

    fireEvent(audio as HTMLAudioElement, new Event("loadedmetadata"));
    fireEvent(audio as HTMLAudioElement, new Event("canplay"));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(audio?.getAttribute("src")).toBe("blob:managed-audio");
    expect(screen.getByText("Ready to play")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Guide track volume"), {
      target: { value: "0.43" },
    });
    expect((audio as HTMLAudioElement).volume).toBeCloseTo(0.43, 2);

    fireEvent.change(screen.getByLabelText("Guide track scrubber"), {
      target: { value: "18.75" },
    });
    expect(harness.currentTimeRef.current).toBeCloseTo(18.75, 2);

    harness.currentTimeRef.current = 18.75;
    fireEvent(audio as HTMLAudioElement, new Event("timeupdate"));
    expect(screen.getByText("0:19 / 1:35")).toBeInTheDocument();

    rerender(
      <ManagedAudioPlayer
        title="Guide track"
        description="Desktop playback"
        audioPath="/music/guide-track.wav"
        durationSeconds={95}
        playLabel="Play"
        pauseLabel="Pause"
        missingNote="Missing audio"
        browserFallbackNote="Browser fallback"
        desktopOnlyNote="Desktop only"
        availableNote="Ready to play"
        errorNote="Playback failed"
        onTimeUpdate={onTimeUpdate}
        cueRequest={cueRequest}
      />,
    );

    await waitFor(() =>
      expect(harness.currentTimeRef.current).toBeCloseTo(12.5, 2),
    );
    expect(onTimeUpdate).toHaveBeenLastCalledWith(12.5);
    await waitFor(() =>
      expect((audio as HTMLAudioElement).play).toHaveBeenCalled(),
    );
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    fireEvent(audio as HTMLAudioElement, new Event("ended"));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("surfaces native load failures and playback jump failures", async () => {
    invokeMock.mockRejectedValueOnce(new Error("disk offline"));
    const { rerender, container } = renderPlayer({
      audioPath: "/music/failing-track.wav",
    });

    expect(await screen.findByText("Cannot load audio: Error: disk offline")).toBeInTheDocument();

    invokeMock.mockResolvedValueOnce("YQ==");
    rerender(
      <ManagedAudioPlayer
        title="Guide track"
        description="Desktop playback"
        audioPath="/music/recovered-track.wav"
        durationSeconds={95}
        playLabel="Play"
        pauseLabel="Pause"
        missingNote="Missing audio"
        browserFallbackNote="Browser fallback"
        desktopOnlyNote="Desktop only"
        availableNote="Ready to play"
        errorNote="Playback failed"
        cueRequest={{ id: 9, second: 22, autoplay: true }}
      />,
    );

    const audio = container.querySelector("audio");
    expect(audio).toBeInstanceOf(HTMLAudioElement);
    mountAudioHarness(audio as HTMLAudioElement);

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith("read_audio_bytes", { path: "/music/recovered-track.wav" }),
    );

    fireEvent(audio as HTMLAudioElement, new Event("canplay"));
    (audio as HTMLAudioElement).play = vi.fn().mockRejectedValueOnce(new Error("play rejected"));

    rerender(
      <ManagedAudioPlayer
        title="Guide track"
        description="Desktop playback"
        audioPath="/music/recovered-track.wav"
        durationSeconds={95}
        playLabel="Play"
        pauseLabel="Pause"
        missingNote="Missing audio"
        browserFallbackNote="Browser fallback"
        desktopOnlyNote="Desktop only"
        availableNote="Ready to play"
        errorNote="Playback failed"
        cueRequest={{ id: 10, second: 22, autoplay: true }}
      />,
    );

    expect(
      await screen.findByText("play rejected"),
    ).toBeInTheDocument();
  });
});
