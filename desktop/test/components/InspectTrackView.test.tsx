import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { InspectTrackView } from "../../src/features/inspect/InspectTrackView";
import type { LibraryTrack } from "../../src/types/library";

const seekGuideTrack = vi.fn();

vi.mock("../../src/features/monitor/MonitorContext", () => ({
  useMonitor: () => ({
    seekGuideTrack,
    playbackProgress: 0.25,
  }),
}));

vi.mock("../../src/features/analyzer/components/WaveformPlaceholder", () => ({
  WaveformPlaceholder: () => <div data-testid="waveform-placeholder">waveform</div>,
}));

vi.mock("../../src/features/analyzer/components/TrackOriginalComparePanel", () => ({
  TrackOriginalComparePanel: () => <div data-testid="compare-panel">compare</div>,
}));

vi.mock("../../src/features/analyzer/components/TrackPlaybackPanel", () => ({
  TrackPlaybackPanel: () => <div data-testid="playback-panel">playback</div>,
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
  BeatGridEditorPanel: () => <div data-testid="beat-grid-editor">grid</div>,
}));

vi.mock("../../src/features/analyzer/components/TrackPerformancePanel", () => ({
  TrackPerformancePanel: () => <div data-testid="track-performance-panel">performance</div>,
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

function renderInspectTrackView() {
  return render(
    <I18nContext.Provider value={en}>
      <InspectTrackView
        track={createTrack()}
        analyzerLabel="Maia Analyzer"
        trackMutating={false}
        contextBar={<div data-testid="context-bar">context</div>}
        onGoCompose={vi.fn()}
        onUpdateTrackPerformance={vi.fn().mockResolvedValue(undefined)}
        onUpdateTrackAnalysis={vi.fn().mockResolvedValue(undefined)}
      />
    </I18nContext.Provider>,
  );
}

describe("InspectTrackView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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
});
