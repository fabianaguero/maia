import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveMonitorMutationTracePanel } from "../../src/features/analyzer/components/LiveMonitorMutationTracePanel";
import type { LibraryTrack, VisualizationCuePoint } from "../../src/types/library";
import type { LiveMutationExplanation } from "../../src/utils/liveMutationExplainability";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Donna Summer - I Feel Love",
    sourcePath: "/music/donna-summer.wav",
    storagePath: null,
    importedAt: "2026-06-28T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.98,
    durationSeconds: 360,
    waveformBins: [0.1, 0.5, 0.2, 0.7],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: 126,
    repoSuggestedStatus: "matched",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: "Am",
    energyLevel: 0.8,
    danceability: 0.9,
    structuralPatterns: [],
    file: {
      sourcePath: "/music/donna-summer.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1024,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Donna Summer - I Feel Love",
      artist: "Donna Summer",
      album: null,
      genre: "House",
      year: 1977,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-28T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.98,
      durationSeconds: 360,
      waveformBins: [0.1, 0.5, 0.2, 0.7],
      beatGrid: [{ index: 1, second: 0.5 }],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "full",
      analyzerVersion: "1.0.0",
      analyzedAt: "2026-06-28T20:00:00.000Z",
      repoSuggestedBpm: 126,
      repoSuggestedStatus: "matched",
      notes: [],
      keySignature: "Am",
      energyLevel: 0.8,
      danceability: 0.9,
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

function createExplanation(
  overrides: Partial<LiveMutationExplanation> = {},
): LiveMutationExplanation {
  return {
    id: "exp-1",
    eventIndex: 14,
    replayWindowIndex: 3,
    component: "visits-service",
    level: "ERROR",
    trackId: "track-1",
    trackTitle: "Donna Summer - I Feel Love",
    trackSecond: 42.37,
    sourceExcerpt: "PUT /webhooks/log 500",
    triggerLabel: "Anomaly spike",
    triggerDetail: "PUT /webhooks/log 500",
    resultLabel: "Lead synth → Alert stem",
    resultDetail: "Breakdown · Error pressure",
    focus: "error cluster",
    waveform: "sawtooth",
    noteHz: 440,
    durationMs: 320,
    gain: 0.82,
    routeKey: "lead",
    isAnomalyDriven: true,
    ...overrides,
  };
}

describe("LiveMonitorMutationTracePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders mapped waveform and replay-linked mutation cards", () => {
    const onSelectExplanation = vi.fn();
    const explanation = createExplanation();
    const cues: VisualizationCuePoint[] = [{ second: 42.37, label: "E14", type: "anomaly" }];

    render(
      <LiveMonitorMutationTracePanel
        replayActive
        playbackEventIndex={3}
        traceWaveformTrack={createTrack()}
        traceWaveformExplanations={[explanation]}
        traceWaveformCues={cues}
        traceWaveformCurrentTime={42.37}
        recentExplanations={[explanation]}
        selectedExplanationId="exp-1"
        onSelectExplanation={onSelectExplanation}
      />,
    );

    expect(screen.getAllByText("Donna Summer - I Feel Love")).toHaveLength(2);
    expect(screen.getByText("Anomaly spike")).toBeInTheDocument();
    expect(screen.getByText("Lead synth → Alert stem")).toBeInTheDocument();
    expect(screen.getByText("42.37s")).toBeInTheDocument();
    expect(screen.getByText("440 Hz")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();

    const card = screen.getByText("Lead synth → Alert stem").closest("button");
    expect(card).not.toBeNull();
    expect(card.className).toContain("anomaly-driven");
    expect(card.className).toContain("window-active");
    expect(card.className).toContain("active");

    fireEvent.click(card as HTMLButtonElement);
    expect(onSelectExplanation).toHaveBeenCalledWith(explanation);
  });

  it("falls back to the empty trace state when no explanations exist", () => {
    render(
      <LiveMonitorMutationTracePanel
        replayActive={false}
        playbackEventIndex={null}
        traceWaveformTrack={null}
        traceWaveformExplanations={[]}
        traceWaveformCues={[]}
        traceWaveformCurrentTime={0}
        recentExplanations={[]}
        selectedExplanationId={null}
        onSelectExplanation={() => undefined}
      />,
    );

    expect(screen.queryByText("Mapped base track")).not.toBeInTheDocument();
    expect(screen.getByText("No mutation trace emitted yet.")).toBeInTheDocument();
  });
});
