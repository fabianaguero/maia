import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import { useSimpleModeLibraryPreview } from "../../../src/features/simple/useSimpleModeLibraryPreview";

const state = vi.hoisted(() => ({
  resolvePreviewAudioUrl: vi.fn(async () => "blob:test-preview"),
  revokePreviewAudioUrl: vi.fn(),
  audioPlay: vi.fn(async () => undefined),
  audioPause: vi.fn(),
  listeners: new Map<string, EventListener>(),
}));

vi.mock("../../../src/utils/audioPreview", () => ({
  resolvePreviewAudioUrl: state.resolvePreviewAudioUrl,
  revokePreviewAudioUrl: state.revokePreviewAudioUrl,
}));

class MockAudio {
  volume = 1;
  preload = "none";
  currentTime = 0;
  src: string;

  constructor(src: string) {
    this.src = src;
  }

  play = state.audioPlay;
  pause = state.audioPause;
  addEventListener(type: string, listener: EventListener) {
    state.listeners.set(type, listener);
  }
}

const globalWithAudio = globalThis as typeof globalThis & {
  Audio: typeof MockAudio;
};

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Track 1",
    sourcePath: "/music/track-1.wav",
    storagePath: null,
    importedAt: "2026-06-25T10:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 180,
    waveformBins: [],
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
      sourcePath: "/music/track-1.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Track 1",
      artist: null,
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-25T10:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 180,
      waveformBins: [],
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

function createUnavailableTrack(): LibraryTrack {
  const track = createTrack();
  return {
    ...track,
    id: "track-unavailable",
    sourcePath: null,
    storagePath: null,
    file: {
      ...track.file,
      sourcePath: null,
      storagePath: null,
      availabilityState: "missing",
    },
  };
}

describe("useSimpleModeLibraryPreview", () => {
  beforeEach(() => {
    globalWithAudio.Audio = MockAudio;
    state.resolvePreviewAudioUrl.mockClear();
    state.revokePreviewAudioUrl.mockClear();
    state.audioPlay.mockClear();
    state.audioPause.mockClear();
    state.listeners.clear();
  });

  it("toggles preview playback and cleanup", async () => {
    const track = createTrack();
    const { result, unmount } = renderHook(() => useSimpleModeLibraryPreview());

    await act(async () => {
      await result.current.toggleTrackPreview(track);
    });

    await waitFor(() => {
      expect(result.current.previewTrackId).toBe("track-1");
      expect(state.resolvePreviewAudioUrl).toHaveBeenCalledWith("/music/track-1.wav");
      expect(state.audioPlay).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.toggleTrackPreview(track);
    });

    await waitFor(() => {
      expect(result.current.previewTrackId).toBeNull();
      expect(state.audioPause).toHaveBeenCalled();
      expect(state.revokePreviewAudioUrl).toHaveBeenCalledWith("blob:test-preview");
    });

    unmount();
  });

  it("ignores tracks without a playable path", async () => {
    const { result } = renderHook(() => useSimpleModeLibraryPreview());

    await act(async () => {
      await result.current.toggleTrackPreview(createUnavailableTrack());
    });

    expect(result.current.previewTrackId).toBeNull();
    expect(state.resolvePreviewAudioUrl).not.toHaveBeenCalled();
    expect(state.audioPlay).not.toHaveBeenCalled();
  });

  it("stops the previous preview when switching tracks", async () => {
    const firstTrack = createTrack();
    const secondTrack = {
      ...createTrack(),
      id: "track-2",
      title: "Track 2",
      sourcePath: "/music/track-2.wav",
      file: {
        ...createTrack().file,
        sourcePath: "/music/track-2.wav",
      },
      tags: {
        ...createTrack().tags,
        title: "Track 2",
      },
    };
    state.resolvePreviewAudioUrl
      .mockResolvedValueOnce("blob:first-preview")
      .mockResolvedValueOnce("blob:second-preview");

    const { result } = renderHook(() => useSimpleModeLibraryPreview());

    await act(async () => {
      await result.current.toggleTrackPreview(firstTrack);
      await result.current.toggleTrackPreview(secondTrack);
    });

    await waitFor(() => {
      expect(result.current.previewTrackId).toBe("track-2");
    });

    expect(state.audioPause).toHaveBeenCalledTimes(1);
    expect(state.revokePreviewAudioUrl).toHaveBeenCalledWith("blob:first-preview");
    expect(state.resolvePreviewAudioUrl).toHaveBeenNthCalledWith(2, "/music/track-2.wav");
  });

  it("cleans up after ended playback", async () => {
    const track = createTrack();
    const { result } = renderHook(() => useSimpleModeLibraryPreview());

    await act(async () => {
      await result.current.toggleTrackPreview(track);
    });

    await waitFor(() => {
      expect(result.current.previewTrackId).toBe("track-1");
    });

    await act(async () => {
      state.listeners.get("ended")?.(new Event("ended"));
    });

    expect(result.current.previewTrackId).toBeNull();
    expect(state.revokePreviewAudioUrl).toHaveBeenCalledWith("blob:test-preview");
  });

  it("resets state when play fails", async () => {
    state.audioPlay.mockRejectedValueOnce(new Error("play blocked"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { result } = renderHook(() => useSimpleModeLibraryPreview());

    await act(async () => {
      await result.current.toggleTrackPreview(createTrack());
    });

    expect(result.current.previewTrackId).toBeNull();
    expect(state.revokePreviewAudioUrl).toHaveBeenCalledWith("blob:test-preview");
    expect(warnSpy).toHaveBeenCalledWith("Library track preview failed", expect.any(Error));

    warnSpy.mockRestore();
  });
});
