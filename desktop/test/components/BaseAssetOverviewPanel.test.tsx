import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BaseAssetOverviewPanel } from "../../src/features/analyzer/components/BaseAssetOverviewPanel";
import type { BaseAssetRecord } from "../../src/types/library";

function createBaseAsset(overrides: Partial<BaseAssetRecord> = {}): BaseAssetRecord {
  return {
    id: "base-asset-1",
    title: "Percussion kit",
    sourcePath: "/assets/percussion",
    storagePath: "/storage/percussion",
    sourceKind: "directory",
    importedAt: "2026-06-28T20:00:00.000Z",
    categoryId: "drum-kit",
    categoryLabel: "Drum kit",
    reusable: true,
    entryCount: 12,
    checksum: "abc123",
    confidence: 0.93,
    summary: "Layered percussion transients for live cue design.",
    analyzerStatus: "ready",
    notes: [],
    tags: ["drums", "transients"],
    metrics: {},
    ...overrides,
  };
}

describe("BaseAssetOverviewPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders summary, paths and tags for the selected base asset", () => {
    render(<BaseAssetOverviewPanel baseAsset={createBaseAsset()} />);

    expect(screen.getByText("Layered percussion transients for live cue design.")).toBeInTheDocument();
    expect(screen.getByText("/assets/percussion")).toBeInTheDocument();
    expect(screen.getByText("/storage/percussion")).toBeInTheDocument();
    expect(screen.getByText("drums")).toBeInTheDocument();
    expect(screen.getByText("transients")).toBeInTheDocument();
  });

  it("renders an empty tag strip without crashing when no tags exist", () => {
    render(<BaseAssetOverviewPanel baseAsset={createBaseAsset({ tags: [] })} />);

    expect(screen.getByText("Layered percussion transients for live cue design.")).toBeInTheDocument();
    expect(screen.queryByText("drums")).not.toBeInTheDocument();
    expect(screen.queryByText("transients")).not.toBeInTheDocument();
  });
});
