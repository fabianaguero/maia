import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CompositionTimelinePanel } from "../../src/features/analyzer/components/CompositionTimelinePanel";
import type { CompositionResultRecord } from "../../src/types/library";

function createComposition(
  overrides: Partial<CompositionResultRecord> = {},
  metricOverrides: Record<string, unknown> = {},
): CompositionResultRecord {
  return {
    id: "comp-timeline",
    title: "Peak-hour timeline",
    sourcePath: "/renders/peak-hour",
    exportPath: "/renders/peak-hour/final.wav",
    previewAudioPath: null,
    sourceKind: "directory",
    importedAt: "2026-06-28T20:00:00.000Z",
    baseAssetId: "asset-1",
    baseAssetTitle: "FX Palette",
    baseAssetCategoryId: "fx-palette",
    baseAssetCategoryLabel: "FX Palette",
    basePlaylistId: null,
    basePlaylistName: null,
    referenceType: "repo",
    referenceAssetId: "repo-1",
    referenceTitle: "services",
    referenceSourcePath: "/repos/services",
    targetBpm: 126,
    confidence: 0.91,
    strategy: "pattern-translation",
    summary: "Pattern translation preview",
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics: {
      previewDurationSeconds: 40,
      ...metricOverrides,
    },
    waveformBins: [0.15, 0.35, 0.6],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    ...overrides,
  };
}

describe("CompositionTimelinePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders derived sections and cue points for the composition timeline", () => {
    const { container } = render(<CompositionTimelinePanel composition={createComposition()} />);

    expect(screen.getByText("Arrangement timeline")).toBeInTheDocument();
    expect(screen.getAllByText("Intro lock").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Structure translation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pattern reveal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Transition out").length).toBeGreaterThan(0);
    expect(screen.getByText("Bars 1-4")).toBeInTheDocument();
    expect(screen.getByText("Cue points")).toBeInTheDocument();
    expect(screen.getByText("Preview end")).toBeInTheDocument();
    expect(container.querySelectorAll(".composition-section-card")).toHaveLength(4);
    expect(container.querySelector(".energy-low")).toBeTruthy();
    expect(container.querySelector(".energy-rising")).toBeTruthy();
    expect(container.querySelector(".energy-high")).toBeTruthy();
    expect(container.querySelectorAll(".cue-pill")).toHaveLength(5);
  });

  it("uses persisted arrangement sections and cue points when present", () => {
    const { container } = render(
      <CompositionTimelinePanel
        composition={createComposition(
          {},
          {
            arrangementSections: [
              {
                id: "intro",
                role: "intro",
                label: "Custom intro",
                energy: "low",
                startBar: 1,
                endBar: 2,
                startSecond: 0,
                endSecond: 8,
                focus: "stabilize the loop",
              },
              {
                id: "peak",
                role: "peak",
                label: "Custom peak",
                energy: "high",
                startBar: 3,
                endBar: 6,
                startSecond: 8,
                endSecond: 24,
                focus: "drive the anomaly phrase",
              },
            ],
            cuePoints: [
              { id: "cue-a", label: "Load", role: "intro", bar: 1, second: 0.5 },
              { id: "cue-b", label: "Burst", role: "peak", bar: 3, second: 8.2 },
            ],
          },
        )}
      />,
    );

    expect(screen.getByText("Custom intro")).toBeInTheDocument();
    expect(screen.getByText("Custom peak")).toBeInTheDocument();
    expect(screen.getByText("stabilize the loop")).toBeInTheDocument();
    expect(screen.getByText("drive the anomaly phrase")).toBeInTheDocument();
    expect(screen.getByText("Load")).toBeInTheDocument();
    expect(screen.getByText("Burst")).toBeInTheDocument();
    expect(container.querySelectorAll(".composition-section-card")).toHaveLength(2);
    expect(container.querySelectorAll(".cue-pill")).toHaveLength(2);
  });
});
