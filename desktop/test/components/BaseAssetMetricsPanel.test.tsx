import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BaseAssetMetricsPanel } from "../../src/features/analyzer/components/BaseAssetMetricsPanel";
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
    tags: ["drums"],
    metrics: {
      audioEntryCount: 9,
      totalSizeBytes: 2_097_152,
    },
    ...overrides,
  };
}

describe("BaseAssetMetricsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders category, counts, size and analyzer metadata", () => {
    render(<BaseAssetMetricsPanel baseAsset={createBaseAsset()} analyzerLabel="Python analyzer" />);

    expect(screen.getByText("Drum kit")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("Folder pack")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("93%")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByText("Python analyzer")).toBeInTheDocument();
  });

  it("falls back for single-use files, unknown sizes and pending checksums", () => {
    render(
      <BaseAssetMetricsPanel
        baseAsset={createBaseAsset({
          reusable: false,
          sourceKind: "file",
          checksum: null,
          metrics: { audioEntryCount: "bad-data", totalSizeBytes: null },
        })}
        analyzerLabel="Offline analyzer"
      />,
    );

    expect(screen.getByText("Single-use")).toBeInTheDocument();
    expect(screen.getByText("Single file")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Offline analyzer")).toBeInTheDocument();
  });
});
