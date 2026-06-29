import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SongMetadataPanel } from "../../src/features/analyzer/components/SongMetadataPanel";
import type { SongMetadata } from "../../src/api/musicMetadata";
import type { LibraryTrack } from "../../src/types/library";

const { fetchSongMetadataMock } = vi.hoisted(() => ({
  fetchSongMetadataMock: vi.fn(),
}));

vi.mock("../../src/api/musicMetadata", async () => {
  const actual = await vi.importActual("../../src/api/musicMetadata");
  return {
    ...actual,
    fetchSongMetadata: fetchSongMetadataMock,
  };
});

function createTrack(overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  const importedAt = "2026-06-28T20:00:00.000Z";
  const sourcePath = "/music/Daft Punk - Around The World.wav";
  const storagePath = "/managed/tracks/around-the-world.wav";
  const beatGrid = [{ index: 0, second: 0.18 }];

  return {
    id: "track-1",
    file: {
      sourcePath,
      storagePath,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1_024_000,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title: "Around The World",
      artist: "Daft Punk",
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt,
      bpm: 126.4,
      bpmConfidence: 0.83,
      durationSeconds: 245,
      waveformBins: [0.2, 0.4, 0.6],
      beatGrid,
      bpmCurve: [{ second: 0, bpm: 126.4 }],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia-analyzer",
      analyzedAt: importedAt,
      repoSuggestedBpm: 128,
      repoSuggestedStatus: "ready",
      notes: [],
      keySignature: "A minor",
      energyLevel: 0.74,
      danceability: 0.68,
      structuralPatterns: [],
    },
    performance: {
      color: "#f59e0b",
      rating: 4,
      playCount: 7,
      lastPlayedAt: importedAt,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: 0.18,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
    title: "Around The World",
    sourcePath,
    storagePath,
    importedAt,
    bpm: 126.4,
    bpmConfidence: 0.83,
    durationSeconds: 245,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid,
    bpmCurve: [{ second: 0, bpm: 126.4 }],
    analyzerStatus: "ready",
    repoSuggestedBpm: 128,
    repoSuggestedStatus: "ready",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "librosa-dsp",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: "A minor",
    energyLevel: 0.74,
    danceability: 0.68,
    structuralPatterns: [],
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("SongMetadataPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading first and then renders fetched metadata", async () => {
    const pending = deferred<SongMetadata | null>();
    fetchSongMetadataMock.mockReturnValue(pending.promise);

    render(<SongMetadataPanel track={createTrack()} />);

    expect(await screen.findByText("Fetching metadata...")).toBeInTheDocument();
    expect(fetchSongMetadataMock).toHaveBeenCalledWith("Around The World", "Daft Punk", {
      sources: ["musicbrainz"],
    });

    pending.resolve({
      title: "Around The World",
      artist: "Daft Punk",
      album: "Homework",
      releaseYear: 1997,
      genres: ["House", "French touch"],
      spotifyUrl: "https://open.spotify.com/track/demo",
      source: "musicbrainz",
    });

    expect(await screen.findByText("Homework")).toBeInTheDocument();
    expect(screen.getByText("1997")).toBeInTheDocument();
    expect(screen.getByText("House")).toBeInTheDocument();
    expect(screen.getByText("French touch")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Spotify/i })).toHaveAttribute(
      "href",
      "https://open.spotify.com/track/demo",
    );
    expect(screen.getByText("Source: musicbrainz")).toBeInTheDocument();
  });

  it("shows a no-results message when metadata lookup resolves empty", async () => {
    fetchSongMetadataMock.mockResolvedValue(null);

    render(<SongMetadataPanel track={createTrack()} />);

    expect(await screen.findByText("No metadata found for this track")).toBeInTheDocument();
  });

  it("shows the fetch error when metadata lookup fails", async () => {
    fetchSongMetadataMock.mockRejectedValue(new Error("MusicBrainz unavailable"));

    render(<SongMetadataPanel track={createTrack()} />);

    expect(await screen.findByText("MusicBrainz unavailable")).toBeInTheDocument();
  });

  it("falls back to parsing the source filename when tags are blank", async () => {
    fetchSongMetadataMock.mockResolvedValue(null);

    render(
      <SongMetadataPanel
        track={createTrack({
          tags: {
            ...createTrack().tags,
            title: "",
            artist: "",
          },
        })}
      />,
    );

    await waitFor(() =>
      expect(fetchSongMetadataMock).toHaveBeenCalledWith(
        "Daft Punk",
        "Around The World.wav",
        { sources: ["musicbrainz"] },
      ),
    );
  });
});
