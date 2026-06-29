import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CompositionRenderPreviewPanel } from "../../src/features/analyzer/components/CompositionRenderPreviewPanel";
import type { CompositionResultRecord } from "../../src/types/library";

function createComposition(
  overrides: Partial<CompositionResultRecord> = {},
  metricOverrides: Record<string, unknown> = {},
): CompositionResultRecord {
  return {
    id: "comp-1",
    title: "Peak-hour with error motifs",
    sourcePath: "/renders/peak-hour",
    exportPath: "/renders/peak-hour/final.wav",
    previewAudioPath: "browser-fallback://peak-hour-preview.wav",
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
      previewAudioFormat: "wav",
      previewAudioSampleRateHz: 48000,
      previewAudioChannels: 2,
      previewAudioDurationSeconds: 186.4,
      ...metricOverrides,
    },
    waveformBins: [0.15, 0.35, 0.6],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    ...overrides,
  };
}

describe("CompositionRenderPreviewPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders derived render preview metrics, stems, automation and targets", () => {
    render(<CompositionRenderPreviewPanel composition={createComposition()} />);

    expect(screen.getByText("Render preview")).toBeInTheDocument();
    expect(screen.getByText("deterministic-stem-preview")).toBeInTheDocument();
    expect(screen.getByText("-7.5 dB")).toBeInTheDocument();
    expect(screen.getByText("WAV")).toBeInTheDocument();
    expect(screen.getByText("48000 Hz")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("browser-fallback://peak-hour-preview.wav")).toBeInTheDocument();

    expect(screen.getByText("Transition motion")).toBeInTheDocument();
    expect(screen.getByText("Structural glue")).toBeInTheDocument();
    expect(screen.getByText(/riser emphasis/i)).toBeInTheDocument();
    expect(screen.getByText(/bars 5-8/i)).toBeInTheDocument();
    expect(screen.getByText("sub cleanup")).toBeInTheDocument();
    expect(screen.getByText("structural glue compression")).toBeInTheDocument();
    expect(screen.getByText("transition tame limiter")).toBeInTheDocument();
    expect(screen.getByText("preview-loop")).toBeInTheDocument();
    expect(screen.getByText("stem-balance-pass")).toBeInTheDocument();
    expect(screen.getByText("arrangement-audit")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Browser fallback simulates the preview path. Open the Tauri desktop shell to audition the managed preview audio.",
      ),
    ).toBeInTheDocument();
  });

  it("shows pending and missing states when preview metadata is absent", () => {
    render(
      <CompositionRenderPreviewPanel
        composition={createComposition(
          { previewAudioPath: null },
          {
            previewAudioFormat: "mp3",
            previewAudioSampleRateHz: null,
            previewAudioChannels: null,
            previewAudioDurationSeconds: null,
          },
        )}
      />,
    );

    expect(screen.getByText("MP3")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("Preview audio not rendered yet")).toBeInTheDocument();
    expect(screen.getByText("Preview audio not rendered yet.")).toBeInTheDocument();
  });
});
