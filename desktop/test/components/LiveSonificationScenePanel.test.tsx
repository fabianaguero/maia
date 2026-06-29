import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveSonificationScenePanel } from "../../src/features/analyzer/components/LiveSonificationScenePanel";
import { resolveLiveSonificationScene } from "../../src/features/analyzer/components/liveSonificationScene";
import type { BaseAssetRecord, CompositionResultRecord } from "../../src/types/library";

function createBaseAsset(overrides: Partial<BaseAssetRecord> = {}): BaseAssetRecord {
  return {
    id: "asset-1",
    title: "Managed kit",
    sourcePath: "/packs/managed-kit",
    storagePath: "/packs/managed-kit",
    sourceKind: "directory",
    importedAt: "2026-06-28T20:00:00.000Z",
    categoryId: "drum-kit",
    categoryLabel: "Drum Kit",
    reusable: true,
    entryCount: 3,
    checksum: null,
    confidence: 0.92,
    summary: "Managed drum kit",
    analyzerStatus: "ready",
    notes: [],
    tags: ["drums"],
    metrics: {
      playableAudioEntries: ["kick.wav", "snare.wav", "hat.ogg"],
    },
    ...overrides,
  };
}

function createComposition(overrides: Partial<CompositionResultRecord> = {}): CompositionResultRecord {
  return {
    id: "comp-1",
    title: "Night Drive Overlay",
    sourcePath: "/renders/night-drive",
    exportPath: "/renders/night-drive/final.wav",
    previewAudioPath: "/renders/night-drive/preview.wav",
    sourceKind: "directory",
    importedAt: "2026-06-28T20:00:00.000Z",
    baseAssetId: "asset-1",
    baseAssetTitle: "Managed kit",
    baseAssetCategoryId: "drum-kit",
    baseAssetCategoryLabel: "Drum Kit",
    basePlaylistId: null,
    basePlaylistName: null,
    referenceType: "repo",
    referenceAssetId: "repo-1",
    referenceTitle: "visits-service",
    referenceSourcePath: "/repos/visits-service",
    targetBpm: 126,
    confidence: 0.88,
    strategy: "pattern-translation",
    summary: "Pattern translation overlay",
    analyzerStatus: "ready",
    notes: [],
    tags: [],
    metrics: {},
    waveformBins: [0.2, 0.4, 0.7],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    ...overrides,
  };
}

describe("LiveSonificationScenePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders synth fallback state when no managed scene sources exist", () => {
    const onSceneBaseAssetIdChange = vi.fn();
    const onSceneCompositionIdChange = vi.fn();
    const scene = resolveLiveSonificationScene(null, null, "steady-house", "balanced", null);

    render(
      <LiveSonificationScenePanel
        availableBaseAssets={[]}
        availableCompositions={[]}
        sceneBaseAssetId=""
        sceneCompositionId=""
        onSceneBaseAssetIdChange={onSceneBaseAssetIdChange}
        onSceneCompositionIdChange={onSceneCompositionIdChange}
        scene={scene}
      />,
    );

    expect(screen.getByText("Sonification scene")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /base asset vocabulary/i })).toBeDisabled();
    expect(screen.getByText("Runtime only")).toBeInTheDocument();
    expect(screen.getByText("Internal synth")).toBeInTheDocument();
    expect(screen.getByText("Generic routing")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("No playable managed audio found; live cues stay on internal synthesis.")).toBeInTheDocument();
    expect(screen.getAllByText("Synth fallback").length).toBeGreaterThan(0);
  });

  it("renders full routing details and forwards scene selector changes", () => {
    const onSceneBaseAssetIdChange = vi.fn();
    const onSceneCompositionIdChange = vi.fn();
    const baseAsset = createBaseAsset();
    const composition = createComposition();
    const scene = resolveLiveSonificationScene(baseAsset, composition, "alert-techno", "volatile", {
      trackId: "track-1",
      trackTitle: "Donna Summer - I Feel Love",
      musicStyleId: "techno",
      bpm: 126,
      energyLevel: 0.81,
      suggestedPresetId: "beat-locked",
    });

    render(
      <LiveSonificationScenePanel
        availableBaseAssets={[baseAsset]}
        availableCompositions={[composition]}
        sceneBaseAssetId={baseAsset.id}
        sceneCompositionId={composition.id}
        onSceneBaseAssetIdChange={onSceneBaseAssetIdChange}
        onSceneCompositionIdChange={onSceneCompositionIdChange}
        scene={scene}
      />,
    );

    expect(screen.getByText("Alert Techno")).toBeInTheDocument();
    expect(screen.getByText("Volatile")).toBeInTheDocument();
    expect(screen.getByText("Multi-sample")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Donna Summer - I Feel Love")).toBeInTheDocument();
    expect(screen.getByText("126 BPM")).toBeInTheDocument();
    expect(screen.getByText("81 %")).toBeInTheDocument();
    expect(screen.getByText("pattern-translation")).toBeInTheDocument();
    expect(screen.getByText("visits-service")).toBeInTheDocument();
    expect(screen.getByText("Managed kit")).toBeInTheDocument();
    expect(screen.getByText("Night Drive Overlay")).toBeInTheDocument();
    expect(screen.getByText("Live routing")).toBeInTheDocument();
    expect(screen.getByText("sub cleanup")).toBeInTheDocument();
    expect(screen.getByText("structural glue compression")).toBeInTheDocument();
    expect(screen.getByText("soft clip guard")).toBeInTheDocument();
    expect(screen.getAllByText(/kick\.wav|snare\.wav|hat\.ogg/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pan [RLC]/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("combobox", { name: /base asset vocabulary/i }), {
      target: { value: "asset-1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /composition overlay/i }), {
      target: { value: "comp-1" },
    });

    expect(onSceneBaseAssetIdChange).toHaveBeenCalledWith("asset-1");
    expect(onSceneCompositionIdChange).toHaveBeenCalledWith("comp-1");
  });
});
