import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CompositionOverviewPanel } from "../../src/features/analyzer/components/CompositionOverviewPanel";
import type { CompositionResultRecord } from "../../src/types/library";

function createComposition(
  overrides: Partial<CompositionResultRecord> = {},
  metricOverrides: Record<string, unknown> = {},
): CompositionResultRecord {
  return {
    id: "comp-overview",
    title: "Peak-hour overview",
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
    confidence: 0.91,
    strategy: "pattern-translation",
    summary: "Pattern translation preview",
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics: {
      arrangementPlan: [
        "Lock the intro to the base pulse",
        "Translate the service cadence into the build section",
      ],
      ...metricOverrides,
    },
    waveformBins: [0.15, 0.35, 0.6],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    ...overrides,
  };
}

describe("CompositionOverviewPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders summary metadata and arrangement steps", () => {
    render(<CompositionOverviewPanel composition={createComposition()} />);

    expect(screen.getByText("Composition overview")).toBeInTheDocument();
    expect(screen.getByText("Pattern translation preview")).toBeInTheDocument();
    expect(screen.getByText("FX Palette")).toBeInTheDocument();
    expect(screen.getByText("services")).toBeInTheDocument();
    expect(screen.getByText("pattern-translation")).toBeInTheDocument();
    expect(screen.getByText("/renders/peak-hour")).toBeInTheDocument();
    expect(screen.getByText("/renders/peak-hour/plan.json")).toBeInTheDocument();
    expect(screen.getByText("Arrangement plan")).toBeInTheDocument();
    expect(screen.getByText("Lock the intro to the base pulse")).toBeInTheDocument();
    expect(
      screen.getByText("Translate the service cadence into the build section"),
    ).toBeInTheDocument();
  });

  it("falls back to pending materialization and hides the plan when absent", () => {
    render(
      <CompositionOverviewPanel
        composition={createComposition(
          { exportPath: null },
          { arrangementPlan: undefined },
        )}
      />,
    );

    expect(screen.getByText("Pending materialization")).toBeInTheDocument();
    expect(screen.queryByText("Arrangement plan")).not.toBeInTheDocument();
  });
});
