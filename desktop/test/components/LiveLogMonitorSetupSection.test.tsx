import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => {
    cleanup();
  });

  const playlist: BaseTrackPlaylist = {
    id: "playlist-1",
    name: "Monitoring",
    trackIds: ["track-1"],
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
  };

  function renderSetup(overrides: Partial<ComponentProps<typeof LiveLogMonitorSetupSection>> = {}) {
    const setBasePlaylist = vi.fn();
    const setPendingAddTrackId = vi.fn();
    const setPendingLoadPlaylistId = vi.fn();
    const setAdapterKind = vi.fn();
    const setSelectedStyleProfileId = vi.fn();
    const setSelectedMutationProfileId = vi.fn();
    const setForcedLiveMutationState = vi.fn();
    const onStart = vi.fn();

    render(
      <LiveLogMonitorSetupSection
        visible
        t={en}
        adapterKind="file"
        adapterDescription="Passive tail"
        adapterTarget="/logs/orders.log"
        selectedStyleProfileId="alert-techno"
        selectedMutationProfileId="balanced"
        selectedStyleProfile={{
          id: "alert-techno",
          label: "Alert Techno",
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
        setBasePlaylist={setBasePlaylist}
        setPendingAddTrackId={setPendingAddTrackId}
        setPendingLoadPlaylistId={setPendingLoadPlaylistId}
        setAdapterKind={setAdapterKind}
        setSelectedStyleProfileId={setSelectedStyleProfileId}
        setSelectedMutationProfileId={setSelectedMutationProfileId}
        setForcedLiveMutationState={setForcedLiveMutationState}
        onStart={onStart}
        {...overrides}
      />,
    );

    return {
      setBasePlaylist,
      setPendingAddTrackId,
      setPendingLoadPlaylistId,
      setAdapterKind,
      setSelectedStyleProfileId,
      setSelectedMutationProfileId,
      setForcedLiveMutationState,
      onStart,
    };
  }

  it("renders extracted setup content", () => {
    renderSetup();

    expect(screen.getByText(en.inspect.baseListeningBedTitle)).toBeInTheDocument();
    expect(screen.getByText(en.inspect.sceneLaunchTitle)).toBeInTheDocument();
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Alert Techno · Balanced")).toBeInTheDocument();
  });

  it("wires playlist editing and scene controls through the extracted deck props", () => {
    const {
      setBasePlaylist,
      setPendingAddTrackId,
      setSelectedStyleProfileId,
      setSelectedMutationProfileId,
      setForcedLiveMutationState,
      onStart,
    } = renderSetup({
      pendingAddTrackId: "track-1",
      pendingLoadPlaylistId: "playlist-1",
      basePlaylistEditorItems: [
        {
          id: "track-1",
          label: "track-1",
          lostTitle: "Missing from disk",
          canMoveUp: true,
          canMoveDown: true,
        },
      ],
    });

    fireEvent.change(screen.getByRole("textbox", { name: en.inspect.baseListeningBedTitle }), {
      target: { value: "Night ride" },
    });
    fireEvent.click(screen.getByRole("button", { name: en.inspect.addAction }));
    fireEvent.click(screen.getByRole("button", { name: en.inspect.loadAction }));
    fireEvent.click(
      screen.getByRole("button", { name: en.inspect.moveUp.replace("{name}", "track-1") }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: en.inspect.moveDown.replace("{name}", "track-1") }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: en.inspect.removeFromPlaylist.replace("{name}", "track-1"),
      }),
    );

    fireEvent.change(screen.getByTitle(en.inspect.styleProfileTitle), {
      target: { value: "steady-house" },
    });
    fireEvent.change(screen.getByTitle(en.inspect.mutationProfileTitle), {
      target: { value: "reactive" },
    });
    fireEvent.change(screen.getByTitle(en.inspect.auditionOverrideTitle), {
      target: { value: "critical" },
    });
    fireEvent.click(screen.getByRole("button", { name: en.inspect.startMonitor }));

    expect(screen.getByText(en.library.lost.toUpperCase())).toBeInTheDocument();
    expect(setPendingAddTrackId).toHaveBeenCalledWith("");
    expect(setSelectedStyleProfileId).toHaveBeenCalledWith("steady-house");
    expect(setSelectedMutationProfileId).toHaveBeenCalledWith("reactive");
    expect(setForcedLiveMutationState).toHaveBeenCalledWith("critical");
    expect(onStart).toHaveBeenCalledTimes(1);

    const renameUpdater = setBasePlaylist.mock.calls[0]?.[0] as (
      value: BaseTrackPlaylist | null,
    ) => BaseTrackPlaylist | null;
    expect(renameUpdater(playlist)?.name).toBe("Night ride");

    const addUpdater = setBasePlaylist.mock.calls[1]?.[0] as (
      value: BaseTrackPlaylist | null,
    ) => BaseTrackPlaylist | null;
    expect(addUpdater(playlist)?.trackIds).toEqual(["track-1"]);

    expect(setBasePlaylist.mock.calls[2]?.[0]).toMatchObject({
      id: "playlist-1",
      name: "Monitoring",
      trackIds: ["track-1"],
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    });
  });

  it("hides the setup deck when the extracted section is not visible", () => {
    const { onStart } = renderSetup({
      visible: false,
    });

    expect(screen.queryByText(en.inspect.baseListeningBedTitle)).not.toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });

  it("renders empty and not-ready launch states", () => {
    renderSetup({
      hasBaseListeningBed: false,
      baseTrackCount: 0,
      adapterConfigured: false,
      forcedLiveMutationState: "warning",
      liveMutationStateLabel: "Warning",
      isStarting: true,
      error: "boom",
      basePlaylist: null,
      basePlaylistTrackOptions: [],
      savedPlaylistOptions: [],
      basePlaylistEditorItems: [],
    });

    expect(screen.getByText(en.inspect.intendedListeningBedHint)).toBeInTheDocument();
    expect(screen.getByText(en.inspect.synthOnlyHint)).toBeInTheDocument();
    expect(screen.getByText(en.inspect.forcedStateWarning)).toBeInTheDocument();
    expect(screen.getByText(en.inspect.configureFeedBeforeStart)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(en.inspect.starting, "i") }),
    ).toBeDisabled();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });
});
