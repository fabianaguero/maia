import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CompositionMetricsPanel } from "../../src/features/analyzer/components/CompositionMetricsPanel";
import type { CompositionResultRecord } from "../../src/types/library";

function createComposition(
  overrides: Partial<CompositionResultRecord> = {},
  metricOverrides: Record<string, unknown> = {},
): CompositionResultRecord {
  return {
    id: "comp-metrics",
    title: "Peak-hour metrics",
    sourcePath: "/renders/peak-hour",
    exportPath: "/renders/peak-hour/plan.json",
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
    confidence: 0.914,
    strategy: "pattern-translation",
    summary: "Pattern translation preview",
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics: {
      intensityBand: "high",
      recommendedLayerCount: 5,
      previewDurationSeconds: 186.4,
      arrangementSections: [{ id: "intro" }, { id: "build" }],
      renderPreview: {
        stems: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
        headroomDb: -7.5,
      },
      ...metricOverrides,
    },
    waveformBins: [0.15, 0.35, 0.6],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    ...overrides,
  };
}

describe("CompositionMetricsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders derived and nested composition metrics", () => {
    render(
      <CompositionMetricsPanel composition={createComposition()} analyzerLabel="Python analyzer" />,
    );

    expect(screen.getByText("Composition metrics")).toBeInTheDocument();
    expect(screen.getByText("126")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("186.4s")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("-7.5 dB")).toBeInTheDocument();
    expect(screen.getByText("Python analyzer")).toBeInTheDocument();
  });

  it("uses default placeholders when metrics are missing", () => {
    render(
      <CompositionMetricsPanel
        composition={createComposition(
          {},
          {
            intensityBand: null,
            recommendedLayerCount: null,
            previewDurationSeconds: null,
            arrangementSections: undefined,
            renderPreview: {},
          },
        )}
        analyzerLabel="Offline analyzer"
      />,
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("-6.0 dB")).toBeInTheDocument();
    expect(screen.getByText("Offline analyzer")).toBeInTheDocument();
  });
});
