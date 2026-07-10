import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import { useMonitorTrackAudio } from "../../../src/features/simple/useMonitorTrackAudio";

const resolvePreviewAudioUrlMock = vi.fn<(path: string) => Promise<string>>();
const revokePreviewAudioUrlMock = vi.fn<(url: string | null | undefined) => void>();

vi.mock("../../../src/utils/audioPreview", () => ({
  resolvePreviewAudioUrl: (path: string) => resolvePreviewAudioUrlMock(path),
  revokePreviewAudioUrl: (url: string | null | undefined) => revokePreviewAudioUrlMock(url),
}));

vi.mock("../../../src/utils/track", () => ({
  resolvePlayableTrackPath: (track: LibraryTrack) =>
    track.file.storagePath ?? track.file.sourcePath,
}));

class MockAudioElement {
  src: string;
  currentTime = 0;
  duration = 240;
  loop = false;
  volume = 1;
  muted = false;
  defaultMuted = false;
  preload = "auto";
  crossOrigin: string | null = null;
  play = vi.fn(async () => undefined);
  pause = vi.fn();
  load = vi.fn();
  private listeners = new Map<string, Array<() => void>>();

  constructor(src = "") {
    this.src = src;
  }

  addEventListener(type: string, listener: () => void) {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }
}

function createTrack(id = "track-1"): LibraryTrack {
  return {
    id,
    title: "Deck Track",
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-25T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.2, 0.6],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "wav",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Deck Track",
      artist: "Maia",
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-25T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.6],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
  };
}

describe("useMonitorTrackAudio", () => {
  let audioInstances: MockAudioElement[];
  let animationFrameCallback: FrameRequestCallback | null;
  let originalAudio: typeof Audio;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;

  beforeEach(() => {
    audioInstances = [];
    animationFrameCallback = null;
    originalAudio = globalThis.Audio;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    globalThis.Audio = vi.fn((src?: string) => {
      const audio = new MockAudioElement(src);
      audioInstances.push(audio);
      return audio as unknown as HTMLAudioElement;
    }) as unknown as typeof Audio;
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      animationFrameCallback = callback;
      return 1;
    });
    window.cancelAnimationFrame = vi.fn();
    resolvePreviewAudioUrlMock.mockImplementation(async (path) => `blob:${path}`);
    revokePreviewAudioUrlMock.mockReset();
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    vi.restoreAllMocks();
  });

  it("toggles preview playback for the selected track", async () => {
    const { result } = renderHook(() =>
      useMonitorTrackAudio({
        audioContext: null,
        isListening: false,
        safeRuntime: false,
        activeTrack: null,
        ensureBackgroundGraph: vi.fn(),
        setTrackWaveProgress: vi.fn(),
        setTrackElapsedSeconds: vi.fn(),
        setTrackDurationSeconds: vi.fn(),
      }),
    );

    const track = createTrack("preview-track");
    await act(async () => {
      await result.current.toggleTrackPreview(track);
    });

    expect(result.current.previewTrackId).toBe("preview-track");
    expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1);
    expect(resolvePreviewAudioUrlMock).toHaveBeenCalledWith("/music/preview-track.wav");

    await act(async () => {
      await result.current.toggleTrackPreview(track);
    });

    expect(result.current.previewTrackId).toBeNull();
    expect(audioInstances[0]?.pause).toHaveBeenCalled();
    expect(revokePreviewAudioUrlMock).toHaveBeenCalledWith("blob:/music/preview-track.wav");
  });

  it("binds the background track, updates progress, and resets state when monitoring stops", async () => {
    const ensureBackgroundGraph = vi.fn();
    const setTrackWaveProgress = vi.fn();
    const setTrackElapsedSeconds = vi.fn();
    const setTrackDurationSeconds = vi.fn();
    const audioContext = { state: "running" } as AudioContext;
    const activeTrack = createTrack("background-track");

    const { result, rerender } = renderHook(
      (props: { isListening: boolean; activeTrack: LibraryTrack | null }) =>
        useMonitorTrackAudio({
          audioContext,
          isListening: props.isListening,
          safeRuntime: false,
          activeTrack: props.activeTrack,
          ensureBackgroundGraph,
          setTrackWaveProgress,
          setTrackElapsedSeconds,
          setTrackDurationSeconds,
        }),
      {
        initialProps: {
          isListening: true,
          activeTrack,
        },
      },
    );

    await waitFor(() => {
      expect(audioInstances[0]?.play).toHaveBeenCalledTimes(1);
    });

    expect(ensureBackgroundGraph).not.toHaveBeenCalled();
    expect(result.current.backgroundAudioRef.current).toBe(
      audioInstances[0] as unknown as HTMLAudioElement,
    );

    audioInstances[0]!.currentTime = 30;
    audioInstances[0]!.duration = 120;
    act(() => {
      animationFrameCallback?.(0);
    });

    expect(setTrackWaveProgress).toHaveBeenCalledWith(0.25);
    expect(setTrackElapsedSeconds).toHaveBeenCalledWith(30);
    expect(setTrackDurationSeconds).toHaveBeenCalledWith(120);

    rerender({ isListening: false, activeTrack });

    expect(audioInstances[0]?.pause).toHaveBeenCalled();
    expect(setTrackWaveProgress).toHaveBeenCalledWith(0);
    expect(setTrackElapsedSeconds).toHaveBeenCalledWith(0);
    expect(setTrackDurationSeconds).toHaveBeenCalledWith(null);
  });

  it("clears preview state when playback ends or preview playback fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { result } = renderHook(() =>
      useMonitorTrackAudio({
        audioContext: null,
        isListening: false,
        safeRuntime: false,
        activeTrack: null,
        ensureBackgroundGraph: vi.fn(),
        setTrackWaveProgress: vi.fn(),
        setTrackElapsedSeconds: vi.fn(),
        setTrackDurationSeconds: vi.fn(),
      }),
    );

    const endedTrack = createTrack("ended-track");
    await act(async () => {
      await result.current.toggleTrackPreview(endedTrack);
    });
    act(() => {
      audioInstances[0]?.emit("ended");
    });
    expect(result.current.previewTrackId).toBeNull();

    const failedTrack = createTrack("failed-track");
    audioInstances.length = 0;
    globalThis.Audio = vi.fn((src?: string) => {
      const audio = new MockAudioElement(src);
      audio.play = vi.fn(async () => {
        throw new Error("preview failed");
      });
      audioInstances.push(audio);
      return audio as unknown as HTMLAudioElement;
    }) as unknown as typeof Audio;

    await act(async () => {
      await result.current.toggleTrackPreview(failedTrack);
    });

    expect(result.current.previewTrackId).toBeNull();
    expect(revokePreviewAudioUrlMock).toHaveBeenCalledWith("blob:/music/failed-track.wav");
    warnSpy.mockRestore();
  });
});
