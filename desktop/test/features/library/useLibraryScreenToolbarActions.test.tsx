import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLibraryScreenToolbarActions } from "../../../src/features/library/useLibraryScreenToolbarActions";
import { en } from "../../../src/i18n/en";
import type { LibraryTrack, RepositoryAnalysis } from "../../../src/types/library";

function createTrack(overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  return {
    id: overrides.id ?? "track-1",
    title: "Track",
    sourcePath: "/music/track.wav",
    storagePath: null,
    importedAt: "2026-06-29T10:00:00.000Z",
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
      sourcePath: "/music/track.wav",
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
      title: "Track",
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
      importedAt: "2026-06-29T10:00:00.000Z",
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
    ...overrides,
  };
}

function createRepository(overrides: Partial<RepositoryAnalysis> = {}): RepositoryAnalysis {
  return {
    id: overrides.id ?? "repo-1",
    title: overrides.title ?? "Repo",
    sourcePath: overrides.sourcePath ?? "/logs/repo.log",
    importedAt: "2026-06-29T10:00:00.000Z",
    sourceKind: "file",
    analysisMode: "repo",
    analyzerStatus: "ready",
    analyzerVersion: null,
    analyzedAt: null,
    metrics: {},
    generatedTrack: null,
    summary: [],
    dominantLanguage: null,
    dominantLanguageLabel: null,
    suggestedBpm: null,
    structureHints: [],
    notes: [],
    ...overrides,
  } as RepositoryAnalysis;
}

function createViewModel(overrides?: Partial<{ formToggleLabel: string }>) {
  return {
    tabs: [],
    emptyState: {
      title: "Empty",
      body: "Body",
      actionLabel: "Action",
    },
    loading: false,
    error: null,
    toolbar: {
      eyebrow: "Sounds",
      count: 2,
      title: "Toolbar",
      note: "Note",
      formToggleLabel: overrides?.formToggleLabel ?? "Import track",
      showSeedDemo: true,
      showNewPlaylist: true,
      showRelinkMissing: true,
      showCleanOrphans: true,
    },
  };
}

describe("useLibraryScreenToolbarActions", () => {
  const setShowForm = vi.fn();
  const openPlaylistEditor = vi.fn();
  const onSeedDemo = vi.fn(async () => undefined);
  const onRelinkMissingTracks = vi.fn(async () => true);
  const onDeleteTrack = vi.fn(async () => true);
  const onDeleteRepository = vi.fn(async () => true);
  const alertSpy = vi.fn();
  const confirmSpy = vi.fn();

  beforeEach(() => {
    setShowForm.mockReset();
    openPlaylistEditor.mockReset();
    onSeedDemo.mockReset();
    onRelinkMissingTracks.mockReset();
    onDeleteTrack.mockReset();
    onDeleteRepository.mockReset();
    alertSpy.mockReset();
    confirmSpy.mockReset();
    vi.stubGlobal("alert", alertSpy);
    vi.stubGlobal("confirm", confirmSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the main toolbar actions and delegates their handlers", async () => {
    const { result } = renderHook(() =>
      useLibraryScreenToolbarActions({
        t: en,
        tab: "tracks",
        showForm: false,
        setShowForm,
        viewModel: createViewModel(),
        missingTrackCount: 3,
        tracks: [createTrack()],
        repositories: [createRepository()],
        openPlaylistEditor,
        onSeedDemo,
        onRelinkMissingTracks,
        onDeleteTrack,
        onDeleteRepository,
      }),
    );

    const ids = result.current.map((action) => action.id);
    expect(ids).toEqual([
      "toggle-form",
      "seed-demo",
      "new-playlist",
      "relink-missing",
      "clean-track-orphans",
    ]);

    await act(async () => {
      result.current[0]?.onClick();
      await result.current[1]?.onClick();
      result.current[2]?.onClick();
      result.current[3]?.onClick();
    });

    expect(setShowForm).toHaveBeenCalledTimes(2);
    expect(openPlaylistEditor).toHaveBeenCalledTimes(1);
    expect(onSeedDemo).toHaveBeenCalledTimes(1);
    expect(onRelinkMissingTracks).toHaveBeenCalledTimes(1);
  });

  it("alerts or confirms before deleting orphan tracks", async () => {
    confirmSpy.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const orphanTrack = createTrack({
      id: "track-orphan",
      analysis: {
        ...createTrack().analysis,
        bpm: null,
      },
    });

    const { result, rerender } = renderHook(
      (props: { tracks: LibraryTrack[] }) =>
        useLibraryScreenToolbarActions({
          t: en,
          tab: "tracks",
          showForm: false,
          setShowForm,
          viewModel: createViewModel(),
          missingTrackCount: 0,
          tracks: props.tracks,
          repositories: [],
          openPlaylistEditor,
          onSeedDemo,
          onRelinkMissingTracks,
          onDeleteTrack,
          onDeleteRepository,
        }),
      {
        initialProps: { tracks: [createTrack()] },
      },
    );

    await act(async () => {
      await result.current.find((action) => action.id === "clean-track-orphans")?.onClick();
    });
    expect(alertSpy).toHaveBeenCalledWith(en.library.noUnanalyzedTracks);

    rerender({ tracks: [orphanTrack] });

    await act(async () => {
      await result.current.find((action) => action.id === "clean-track-orphans")?.onClick();
    });
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("1"));
    expect(onDeleteTrack).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.find((action) => action.id === "clean-track-orphans")?.onClick();
    });
    expect(onDeleteTrack).toHaveBeenCalledWith("track-orphan");
  });

  it("cleans orphan repositories only on the sources tab", async () => {
    confirmSpy.mockReturnValue(true);
    const orphanRepository = createRepository({
      id: "repo-orphan",
      analyzerStatus: "pending",
    });

    const { result } = renderHook(() =>
      useLibraryScreenToolbarActions({
        t: en,
        tab: "sources",
        showForm: true,
        setShowForm,
        viewModel: {
          ...createViewModel({ formToggleLabel: "Import source" }),
          toolbar: {
            ...createViewModel().toolbar,
            showSeedDemo: false,
            showNewPlaylist: false,
            showRelinkMissing: false,
            showCleanOrphans: true,
          },
        },
        missingTrackCount: 0,
        tracks: [],
        repositories: [orphanRepository],
        openPlaylistEditor,
        onSeedDemo,
        onRelinkMissingTracks,
        onDeleteTrack,
        onDeleteRepository,
      }),
    );

    const ids = result.current.map((action) => action.id);
    expect(ids).toEqual(["toggle-form", "clean-source-orphans"]);

    await act(async () => {
      await result.current.find((action) => action.id === "clean-source-orphans")?.onClick();
    });

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("1"));
    expect(onDeleteRepository).toHaveBeenCalledWith("repo-orphan");
  });
});
