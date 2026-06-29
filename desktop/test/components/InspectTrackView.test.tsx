import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { InspectTrackView } from "../../src/features/inspect/InspectTrackView";
import type { LibraryTrack } from "../../src/types/library";

const seekGuideTrack = vi.fn();
const state = vi.hoisted(() => ({
  lastCueRequest: null as { id: number; second: number; autoplay: boolean } | null,
  lastAuditionLabel: null as string | null,
}));

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => ({
    seekGuideTrack,
    playbackProgress: 0.25,
  }),
}));

vi.mock("../../src/features/analyzer/components/WaveformPlaceholder", () => ({
  WaveformPlaceholder: (props: {
    onSetDownbeatAtSecond?: (second: number) => void;
    onMoveCue?: (
      cue: { id: string; second: number; label: string; kind: "main" | "hot" | "memory" },
      second: number,
    ) => void;
  }) => (
    <div data-testid="waveform-placeholder">
      waveform
      <button type="button" onClick={() => props.onSetDownbeatAtSecond?.(8)}>
        set-downbeat
      </button>
      <button
        type="button"
        onClick={() =>
          props.onMoveCue?.({ id: "main-cue", second: 12.5, label: "Main", kind: "main" }, 16)
        }
      >
        move-main-cue
      </button>
      <button
        type="button"
        onClick={() =>
          props.onMoveCue?.({ id: "hot-1", second: 24.25, label: "Drop", kind: "hot" }, 32)
        }
      >
        move-hot-cue
      </button>
    </div>
  ),
}));

vi.mock("../../src/features/analyzer/components/TrackOriginalComparePanel", () => ({
  TrackOriginalComparePanel: (props: {
    onAudition?: (point: { id: string; label: string; second: number }) => void;
    activeAuditionId?: string | null;
  }) => (
    <div data-testid="compare-panel">
      compare:{props.activeAuditionId ?? "none"}
      <button
        type="button"
        onClick={() => props.onAudition?.({ id: "compare-1", label: "Intro", second: 32 })}
      >
        audition-compare
      </button>
    </div>
  ),
}));

vi.mock("../../src/features/analyzer/components/TrackPlaybackPanel", () => ({
  TrackPlaybackPanel: (props: {
    onTimeUpdate: (second: number) => void;
    cueRequest?: { id: number; second: number; autoplay: boolean } | null;
    auditionLabel?: string | null;
  }) => {
    state.lastCueRequest = props.cueRequest ?? null;
    state.lastAuditionLabel = props.auditionLabel ?? null;
    return (
      <div data-testid="playback-panel">
        playback
        <button type="button" onClick={() => props.onTimeUpdate(48)}>
          set-current-time
        </button>
        <span data-testid="cue-second">{props.cueRequest?.second ?? "none"}</span>
        <span data-testid="audition-label">{props.auditionLabel ?? "none"}</span>
      </div>
    );
  },
}));

vi.mock("../../src/features/analyzer/components/BpmCurvePanel", () => ({
  BpmCurvePanel: () => <div data-testid="bpm-curve-panel">curve</div>,
}));

vi.mock("../../src/features/analyzer/components/BpmPanel", () => ({
  BpmPanel: () => <div data-testid="bpm-panel">bpm</div>,
}));

vi.mock("../../src/features/analyzer/components/RepoStatusPanel", () => ({
  RepoStatusPanel: () => <div data-testid="repo-status-panel">repo</div>,
}));

vi.mock("../../src/features/analyzer/components/BeatGridEditorPanel", () => ({
  BeatGridEditorPanel: (props: { onUpdateAnalysis: (input: { bpm: number }) => void }) => (
    <div data-testid="beat-grid-editor">
      grid
      <button type="button" onClick={() => props.onUpdateAnalysis({ bpm: 128 })}>
        update-grid
      </button>
    </div>
  ),
}));

vi.mock("../../src/features/analyzer/components/TrackPerformancePanel", () => ({
  TrackPerformancePanel: (props: { onUpdatePerformance: (input: { rating: number }) => void }) => (
    <div data-testid="track-performance-panel">
      performance
      <button type="button" onClick={() => props.onUpdatePerformance({ rating: 5 })}>
        update-performance
      </button>
    </div>
  ),
}));

vi.mock("../../src/features/analyzer/components/SongMetadataPanel", () => ({
  SongMetadataPanel: () => <div data-testid="song-metadata-panel">metadata</div>,
}));

function createTrack(): LibraryTrack {
  const importedAt = "2026-04-08T12:00:00.000Z";

  return {
    id: "track-1",
    file: {
      sourcePath: "/music/source.wav",
      storagePath: "/managed/source.wav",
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1234,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title: "System Pulse",
      artist: "Maia",
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
      bpm: 126,
      bpmConfidence: 0.82,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4, 0.6],
      beatGrid: [
        { index: 0, second: 0 },
        { index: 1, second: 0.5 },
      ],
      bpmCurve: [{ second: 0, bpm: 126 }],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia-analyzer",
      analyzedAt: importedAt,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
      notes: ["Detected stable groove"],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: "#f59e0b",
      rating: 4,
      playCount: 7,
      lastPlayedAt: null,
      bpmLock: true,
      gridLock: false,
      mainCueSecond: 12.5,
      hotCues: [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop",
          kind: "hot",
          color: null,
        },
      ],
      memoryCues: [
        {
          id: "memory-1",
          slot: null,
          second: 48,
          label: "Breakdown",
          kind: "memory",
          color: null,
        },
      ],
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop A",
          color: null,
          locked: false,
        },
      ],
    },
    title: "Legacy Title",
    sourcePath: "/music/source.wav",
    storagePath: "/managed/source.wav",
    importedAt,
    bpm: 100,
    bpmConfidence: 0.1,
    durationSeconds: 100,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "pending",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".mp3",
    analysisMode: "legacy",
    musicStyleId: "legacy",
    musicStyleLabel: "Legacy",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    visualization: {
      waveform: [],
      beatGrid: [],
      hotCues: [],
    },
  };
}

function renderInspectTrackView(overrides?: {
  track?: LibraryTrack;
  trackMutating?: boolean;
  onGoCompose?: ReturnType<typeof vi.fn>;
  onUpdateTrackPerformance?: ReturnType<typeof vi.fn>;
  onUpdateTrackAnalysis?: ReturnType<typeof vi.fn>;
}) {
  const onGoCompose = overrides?.onGoCompose ?? vi.fn();
  const onUpdateTrackPerformance =
    overrides?.onUpdateTrackPerformance ?? vi.fn().mockResolvedValue(undefined);
  const onUpdateTrackAnalysis =
    overrides?.onUpdateTrackAnalysis ?? vi.fn().mockResolvedValue(undefined);

  return render(
    <I18nContext.Provider value={en}>
      <InspectTrackView
        track={overrides?.track ?? createTrack()}
        analyzerLabel="Maia Analyzer"
        trackMutating={overrides?.trackMutating ?? false}
        contextBar={<div data-testid="context-bar">context</div>}
        onGoCompose={onGoCompose}
        onUpdateTrackPerformance={onUpdateTrackPerformance}
        onUpdateTrackAnalysis={onUpdateTrackAnalysis}
      />
    </I18nContext.Provider>,
  );
}

describe("InspectTrackView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    state.lastCueRequest = null;
    state.lastAuditionLabel = null;
  });

  it("renders the track deck with extracted context", () => {
    renderInspectTrackView();

    expect(screen.getByText("System Pulse")).toBeInTheDocument();
    expect(screen.getByTestId("context-bar")).toBeInTheDocument();
    expect(screen.getByTestId("waveform-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("compare-panel")).toBeInTheDocument();
    expect(screen.getByTestId("playback-panel")).toBeInTheDocument();
    expect(screen.getByTestId("bpm-curve-panel")).toBeInTheDocument();
    expect(screen.getByTestId("bpm-panel")).toBeInTheDocument();
    expect(screen.getByTestId("repo-status-panel")).toBeInTheDocument();
  });

  it("switches tabs without losing the extracted panel structure", () => {
    renderInspectTrackView();

    fireEvent.click(screen.getByRole("tab", { name: "Beat Grid" }));
    expect(screen.getByTestId("beat-grid-editor")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Performance" }));
    expect(screen.getByTestId("track-performance-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByTestId("song-metadata-panel")).toBeInTheDocument();
  });

  it("wires compare audition, compose CTA, and update callbacks", () => {
    const onGoCompose = vi.fn();
    const onUpdateTrackPerformance = vi.fn().mockResolvedValue(undefined);
    const onUpdateTrackAnalysis = vi.fn().mockResolvedValue(undefined);

    renderInspectTrackView({
      onGoCompose,
      onUpdateTrackPerformance,
      onUpdateTrackAnalysis,
    });

    fireEvent.click(screen.getByRole("button", { name: "audition-compare" }));
    fireEvent.click(screen.getByRole("button", { name: "set-current-time" }));
    fireEvent.click(screen.getByRole("button", { name: "set-downbeat" }));
    fireEvent.click(screen.getByRole("button", { name: "move-main-cue" }));
    fireEvent.click(screen.getByRole("button", { name: "move-hot-cue" }));
    fireEvent.click(screen.getByRole("tab", { name: "Beat Grid" }));
    fireEvent.click(screen.getByRole("button", { name: "update-grid" }));
    fireEvent.click(screen.getByRole("tab", { name: "Performance" }));
    fireEvent.click(screen.getByRole("button", { name: "update-performance" }));
    fireEvent.click(screen.getByRole("button", { name: en.inspect.composeCta }));

    expect(seekGuideTrack).toHaveBeenCalledWith(32);
    expect(screen.getByTestId("cue-second")).toHaveTextContent("32");
    expect(screen.getByTestId("audition-label")).toHaveTextContent("Intro");
    expect(onUpdateTrackAnalysis).toHaveBeenCalledWith(
      "track-1",
      expect.objectContaining({
        bpm: 126,
      }),
    );
    expect(onUpdateTrackAnalysis).toHaveBeenCalledWith("track-1", { bpm: 128 });
    expect(onUpdateTrackPerformance).toHaveBeenCalledWith(
      "track-1",
      expect.objectContaining({ mainCueSecond: expect.any(Number) }),
    );
    expect(onUpdateTrackPerformance).toHaveBeenCalledWith(
      "track-1",
      expect.objectContaining({ hotCues: expect.any(Array) }),
    );
    expect(onUpdateTrackPerformance).toHaveBeenCalledWith("track-1", { rating: 5 });
    expect(onGoCompose).toHaveBeenCalledTimes(1);
  });

  it("resets compare state when the active track changes and renders metadata details", () => {
    const track = createTrack();
    const nextTrack = {
      ...createTrack(),
      id: "track-2",
      tags: {
        ...createTrack().tags,
        title: "Night Driver",
      },
      analysis: {
        ...createTrack().analysis,
        notes: [],
        analysisMode: "manual-grid",
      },
      file: {
        ...createTrack().file,
        storagePath: null,
      },
      storagePath: null,
    };

    const { rerender } = renderInspectTrackView({ track });

    fireEvent.click(screen.getByRole("button", { name: "audition-compare" }));
    expect(screen.getByTestId("cue-second")).toHaveTextContent("32");
    expect(screen.getByTestId("audition-label")).toHaveTextContent("Intro");

    fireEvent.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByText("Notes & analysis")).toBeInTheDocument();
    expect(screen.getByText("Librosa Dsp")).toBeInTheDocument();
    expect(screen.getByText("/music/source.wav")).toBeInTheDocument();
    expect(screen.getByText("/managed/source.wav")).toBeInTheDocument();

    rerender(
      <I18nContext.Provider value={en}>
        <InspectTrackView
          track={nextTrack}
          analyzerLabel="Maia Analyzer"
          trackMutating={false}
          contextBar={<div data-testid="context-bar">context</div>}
          onGoCompose={vi.fn()}
          onUpdateTrackPerformance={vi.fn().mockResolvedValue(undefined)}
          onUpdateTrackAnalysis={vi.fn().mockResolvedValue(undefined)}
        />
      </I18nContext.Provider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByText("Manual Grid")).toBeInTheDocument();
    expect(screen.getByText(en.inspect.noSnapshot)).toBeInTheDocument();
    expect(screen.getByTestId("cue-second")).toHaveTextContent("none");
    expect(screen.getByTestId("audition-label")).toHaveTextContent("none");
  });
});
