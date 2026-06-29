import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorSetupSection } from "../../src/features/analyzer/components/LiveLogMonitorSetupSection";
import { en } from "../../src/i18n/en";
import type { BaseTrackPlaylist, LibraryTrack } from "../../src/types/library";

function createTrack(id: string): LibraryTrack {
  return {
    id,
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: null,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: id,
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
      importedAt: "2026-06-26T00:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 120,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
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
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt: "2026-06-26T00:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 120,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "librosa-dsp",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
  };
}

describe("LiveLogMonitorSetupSection", () => {
  it("renders extracted setup content", () => {
    const playlist: BaseTrackPlaylist = {
      id: "playlist-1",
      name: "Monitoring",
      trackIds: ["track-1"],
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    };

    render(
      <LiveLogMonitorSetupSection
        visible
        t={en}
        adapterKind="file"
        adapterDescription="Passive tail"
        adapterTarget="/logs/orders.log"
        selectedStyleProfileId="detroit-techno"
        selectedMutationProfileId="balanced"
        selectedStyleProfile={{
          id: "detroit-techno",
          label: "Detroit Techno",
          description: "Mechanical pulse.",
        }}
        selectedMutationProfile={{
          id: "balanced",
          label: "Balanced",
          description: "Measured reactions.",
        }}
        forcedLiveMutationState="auto"
        hasBaseListeningBed
        baseTrackCount={1}
        adapterConfigured
        cueEnginePreviewLabel="Ready"
        liveMutationStateLabel="Auto"
        error={null}
        isStarting={false}
        pendingAddTrackId=""
        pendingLoadPlaylistId=""
        basePlaylist={playlist}
        basePlaylistTrackOptions={[{ id: "track-1", label: "track-1" }]}
        savedPlaylistOptions={[{ id: "playlist-1", label: "Monitoring · 1 tracks" }]}
        basePlaylistEditorItems={[
          {
            id: "track-1",
            label: "track-1",
            lostTitle: null,
            canMoveUp: false,
            canMoveDown: false,
          },
        ]}
        availablePlaylists={[playlist]}
        availableTracks={[createTrack("track-1")]}
        setBasePlaylist={vi.fn()}
        setPendingAddTrackId={vi.fn()}
        setPendingLoadPlaylistId={vi.fn()}
        setAdapterKind={vi.fn()}
        setSelectedStyleProfileId={vi.fn()}
        setSelectedMutationProfileId={vi.fn()}
        setForcedLiveMutationState={vi.fn()}
        onStart={vi.fn()}
      />,
    );

    expect(screen.getByText(en.inspect.baseListeningBedTitle)).toBeInTheDocument();
    expect(screen.getByText(en.inspect.sceneLaunchTitle)).toBeInTheDocument();
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Detroit Techno · Balanced")).toBeInTheDocument();
  });
});
