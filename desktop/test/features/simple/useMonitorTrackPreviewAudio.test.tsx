import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import { useMonitorTrackPreviewAudio } from "../../../src/features/simple/useMonitorTrackPreviewAudio";

const resolvePreviewAudioUrl = vi.fn();

vi.mock("../../../src/utils/audioPreview", () => ({
  resolvePreviewAudioUrl: (...args: unknown[]) => resolvePreviewAudioUrl(...args),
}));

class FakeAudio {
  static instances: FakeAudio[] = [];
  static nextPlayError: Error | null = null;

  volume = 1;
  preload = "";
  play = vi.fn(async () => {
    if (FakeAudio.nextPlayError) {
      const error = FakeAudio.nextPlayError;
      FakeAudio.nextPlayError = null;
      throw error;
    }
  });
  pause = vi.fn();
  currentTime = 0;
  src: string;
  private listeners = new Map<string, Array<() => void>>();

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  addEventListener(event: string, listener: () => void) {
    const current = this.listeners.get(event) ?? [];
    current.push(listener);
    this.listeners.set(event, current);
  }

  removeEventListener() {
    return undefined;
  }

  dispatch(event: string) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener();
    }
  }
}

function createTrack(input?: { id?: string; path?: string }): LibraryTrack {
  const id = input?.id ?? "track-1";
  const path = input?.path ?? `/music/${id}.wav`;
  return {
    id,
    file: {
      sourcePath: path,
      storagePath: path,
      playbackSource: "source_file",
      availabilityState: "available",
      sizeBytes: null,
      checksum: null,
    },
    tags: {
      title: id,
      artist: "MAIA",
      album: null,
      genre: "House",
      musicStyleId: "house",
      bpm: 126,
      key: null,
      durationSec: 180,
    },
    analysis: {
      bpm: 126,
      energy: 0.5,
      waveformBins: [0.2, 0.4],
      beatGrid: [],
      key: null,
      loudnessDb: -8,
      durationSec: 180,
    },
    performance: {
      rating: null,
      color: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
      playedCount: 0,
      lastPlayedAt: null,
    },
    title: id,
    sourcePath: path,
    storagePath: path,
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: [0.2, 0.4],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: "wav",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: 0.5,
    danceability: 0.7,
    structuralPatterns: [],
  };
}

describe("useMonitorTrackPreviewAudio", () => {
  const revokePreviewUrl = vi.fn();
  const originalAudio = globalThis.Audio;
  const originalWarn = console.warn;

  beforeEach(() => {
    FakeAudio.instances = [];
    FakeAudio.nextPlayError = null;
    resolvePreviewAudioUrl.mockResolvedValue("blob:preview");
    revokePreviewUrl.mockReset();
    console.warn = vi.fn();
    globalThis.Audio = FakeAudio as unknown as typeof Audio;
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
    console.warn = originalWarn;
    vi.clearAllMocks();
  });

  it("skips tracks without a playable path and can stop the current preview", async () => {
    const { result } = renderHook(() =>
      useMonitorTrackPreviewAudio({
        safeRuntime: true,
        revokePreviewUrl,
      }),
    );
    const missingTrack = createTrack({ path: "" });
    const playableTrack = createTrack({ id: "track-play" });

    await act(async () => {
      await result.current.toggleTrackPreview(missingTrack);
    });

    expect(resolvePreviewAudioUrl).not.toHaveBeenCalled();
    expect(result.current.previewTrackId).toBeNull();

    await act(async () => {
      await result.current.toggleTrackPreview(playableTrack);
    });
    expect(result.current.previewTrackId).toBe("track-play");

    await act(async () => {
      await result.current.toggleTrackPreview(playableTrack);
    });

    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview");
    expect(result.current.previewTrackId).toBeNull();
  });

  it("replaces previews, reacts to ended events and cleans up failed play attempts", async () => {
    const { result } = renderHook(() =>
      useMonitorTrackPreviewAudio({
        safeRuntime: true,
        revokePreviewUrl,
      }),
    );
    const firstTrack = createTrack({ id: "track-a" });
    const secondTrack = createTrack({ id: "track-b" });

    await act(async () => {
      await result.current.toggleTrackPreview(firstTrack);
    });

    const firstAudio = FakeAudio.instances[0];
    expect(firstAudio?.src).toBe("blob:preview");

    resolvePreviewAudioUrl.mockResolvedValueOnce("blob:preview-2");
    await act(async () => {
      await result.current.toggleTrackPreview(secondTrack);
    });

    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview");
    expect(result.current.previewTrackId).toBe("track-b");

    const secondAudio = FakeAudio.instances[1];
    act(() => {
      secondAudio?.dispatch("ended");
    });

    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview-2");
    expect(result.current.previewTrackId).toBeNull();

    resolvePreviewAudioUrl.mockResolvedValueOnce("blob:preview-3");
    await act(async () => {
      await result.current.toggleTrackPreview(firstTrack);
    });

    FakeAudio.nextPlayError = new Error("autoplay blocked");
    resolvePreviewAudioUrl.mockResolvedValueOnce("blob:preview-4");
    await act(async () => {
      await result.current.toggleTrackPreview(secondTrack);
    });

    expect(console.warn).toHaveBeenCalledWith("Track preview playback failed", expect.any(Error));
    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview-4");
    expect(result.current.previewTrackId).toBeNull();
  });

  it("ignores stale ended events after a preview replacement", async () => {
    const { result } = renderHook(() =>
      useMonitorTrackPreviewAudio({
        safeRuntime: true,
        revokePreviewUrl,
      }),
    );
    const firstTrack = createTrack({ id: "track-a" });
    const secondTrack = createTrack({ id: "track-b" });

    resolvePreviewAudioUrl.mockResolvedValueOnce("blob:preview-a");
    await act(async () => {
      await result.current.toggleTrackPreview(firstTrack);
    });

    const firstAudio = FakeAudio.instances[0];

    resolvePreviewAudioUrl.mockResolvedValueOnce("blob:preview-b");
    await act(async () => {
      await result.current.toggleTrackPreview(secondTrack);
    });

    act(() => {
      firstAudio?.dispatch("ended");
    });

    expect(result.current.previewTrackId).toBe("track-b");
    expect(revokePreviewUrl).not.toHaveBeenCalledWith("blob:preview-b");
  });

  it("disposes the preview audio on unmount when runtime cleanup is enabled", async () => {
    const { result, unmount } = renderHook(() =>
      useMonitorTrackPreviewAudio({
        safeRuntime: false,
        revokePreviewUrl,
      }),
    );

    await act(async () => {
      await result.current.toggleTrackPreview(createTrack({ id: "track-cleanup" }));
    });

    const audio = FakeAudio.instances[0];
    unmount();

    expect(audio?.pause).toHaveBeenCalledTimes(1);
    expect(audio?.currentTime).toBe(0);
    expect(revokePreviewUrl).toHaveBeenCalledWith("blob:preview");
  });
});
