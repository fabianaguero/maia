import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExportCompositionPanel } from "../../src/features/analyzer/components/ExportCompositionPanel";
import type { CompositionResultRecord } from "../../src/types/library";

const {
  pickExportSavePathMock,
  exportCompositionFileMock,
  pickStemsExportDirectoryMock,
  exportCompositionStemsMock,
} = vi.hoisted(() => ({
  pickExportSavePathMock: vi.fn(),
  exportCompositionFileMock: vi.fn(),
  pickStemsExportDirectoryMock: vi.fn(),
  exportCompositionStemsMock: vi.fn(),
}));

vi.mock("../../src/api/repositories", () => ({
  pickExportSavePath: pickExportSavePathMock,
  exportCompositionFile: exportCompositionFileMock,
  pickStemsExportDirectory: pickStemsExportDirectoryMock,
  exportCompositionStems: exportCompositionStemsMock,
}));

function createComposition(
  overrides: Partial<CompositionResultRecord> = {},
): CompositionResultRecord {
  return {
    id: "comp-export",
    title: "Peak hour / final",
    sourcePath: "/renders/peak-hour",
    exportPath: "/renders/peak-hour/plan.json",
    previewAudioPath: "/renders/peak-hour/preview.wav",
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
    metrics: {},
    waveformBins: [0.15, 0.35, 0.6],
    beatGrid: [{ index: 1, second: 0.5 }],
    bpmCurve: [{ second: 0, bpm: 126 }],
    ...overrides,
  };
}

describe("ExportCompositionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("exports the plan and stems through the managed desktop paths", async () => {
    pickExportSavePathMock.mockResolvedValue("/exports/plan.json");
    exportCompositionFileMock.mockResolvedValue("/exports/plan.json");
    pickStemsExportDirectoryMock.mockResolvedValue("/exports/stems");
    exportCompositionStemsMock.mockResolvedValue({
      status: "ok",
      stems: [
        { stemId: "a", label: "A", role: "foundation", gainDb: -6, pan: 0, path: "a.wav", format: "wav", sampleRateHz: 48000, channels: 2, durationSeconds: 10 },
        { stemId: "b", label: "B", role: "glue", gainDb: -9, pan: 0, path: "b.wav", format: "wav", sampleRateHz: 48000, channels: 2, durationSeconds: 10 },
      ],
    });

    render(<ExportCompositionPanel composition={createComposition()} />);

    fireEvent.click(screen.getByRole("button", { name: "Export plan.json" }));
    await screen.findByText("Saved to /exports/plan.json");
    expect(pickExportSavePathMock).toHaveBeenCalledWith("plan.json");
    expect(exportCompositionFileMock).toHaveBeenCalledWith(
      "/renders/peak-hour/plan.json",
      "/exports/plan.json",
    );

    fireEvent.click(screen.getByRole("button", { name: "Export stems as WAV" }));
    await screen.findByText("2 stem(s) written to /exports/stems");
    expect(pickStemsExportDirectoryMock).toHaveBeenCalled();
    expect(exportCompositionStemsMock).toHaveBeenCalledWith("comp-export", "/exports/stems");
  });

  it("downloads via browser fallback when desktop export is unavailable", async () => {
    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string): HTMLElement => {
        if (tagName.toLowerCase() === "a") {
          return {
            click: clickMock,
            set href(value: string) {
              Reflect.set(this, "_href", value);
            },
            get href() {
              return Reflect.get(this, "_href") as string;
            },
            set download(value: string) {
              Reflect.set(this, "_download", value);
            },
            get download() {
              return Reflect.get(this, "_download") as string;
            },
          } as unknown as HTMLElement;
        }
        return originalCreateElement(tagName);
      });

    pickExportSavePathMock.mockResolvedValue("/exports/plan.json");
    exportCompositionFileMock.mockRejectedValue(
      new Error("missing __TAURI_INTERNALS__ bridge"),
    );

    render(<ExportCompositionPanel composition={createComposition()} />);

    fireEvent.click(screen.getByRole("button", { name: "Export plan.json" }));

    await screen.findByText("Downloaded via browser fallback.");
    expect(clickMock).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it("resets canceled plan exports and surfaces non-tauri plan errors", async () => {
    pickExportSavePathMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("/exports/plan-error.json");
    exportCompositionFileMock.mockRejectedValueOnce(new Error("permission denied"));

    render(<ExportCompositionPanel composition={createComposition()} />);

    const planButton = screen.getByRole("button", { name: "Export plan.json" });

    fireEvent.click(planButton);
    expect(await screen.findByRole("button", { name: "Export plan.json" })).toBeEnabled();
    expect(screen.queryByText(/Saved to/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export plan.json" }));
    await screen.findByText("permission denied");
  });

  it("exports preview audio, resets canceled dialogs, and surfaces non-tauri errors", async () => {
    const clickMock = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string): HTMLElement => {
        if (tagName.toLowerCase() === "a") {
          return {
            click: clickMock,
            set href(value: string) {
              Reflect.set(this, "_href", value);
            },
            get href() {
              return Reflect.get(this, "_href") as string;
            },
            set download(value: string) {
              Reflect.set(this, "_download", value);
            },
            get download() {
              return Reflect.get(this, "_download") as string;
            },
          } as unknown as HTMLElement;
        }
        return originalCreateElement(tagName);
      });

    const composition = createComposition({
      title: "Peak hour / final",
      previewAudioPath: "/renders/peak-hour/preview.wav",
    });

    pickExportSavePathMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("/exports/audio.wav")
      .mockResolvedValueOnce("/exports/audio-browser.wav")
      .mockResolvedValueOnce("/exports/audio-error.wav");
    exportCompositionFileMock
      .mockResolvedValueOnce("/exports/audio.wav")
      .mockRejectedValueOnce(new Error("missing tauri bridge"))
      .mockRejectedValueOnce(new Error("disk full"));

    render(<ExportCompositionPanel composition={composition} />);

    const previewButton = screen.getByRole("button", { name: "Export preview WAV" });

    fireEvent.click(previewButton);
    expect(await screen.findByRole("button", { name: "Export preview WAV" })).toBeEnabled();
    expect(screen.queryByText(/Saved to/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export preview WAV" }));
    await screen.findByText("Saved to /exports/audio.wav");
    expect(pickExportSavePathMock).toHaveBeenNthCalledWith(
      2,
      "Peak_hour___final_preview.wav",
    );
    expect(exportCompositionFileMock).toHaveBeenNthCalledWith(
      1,
      "/renders/peak-hour/preview.wav",
      "/exports/audio.wav",
    );

    fireEvent.click(screen.getByRole("button", { name: "Export preview WAV" }));
    await screen.findByText("Downloaded via browser fallback.");
    expect(clickMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Export preview WAV" }));
    await screen.findByText("disk full");

    createElementSpy.mockRestore();
  });

  it("resets canceled stem exports and surfaces stem-export failures", async () => {
    pickStemsExportDirectoryMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("/exports/stems-error");
    exportCompositionStemsMock.mockRejectedValueOnce(new Error("stem render failed"));

    render(<ExportCompositionPanel composition={createComposition()} />);

    const stemsButton = screen.getByRole("button", { name: "Export stems as WAV" });

    fireEvent.click(stemsButton);
    expect(await screen.findByRole("button", { name: "Export stems as WAV" })).toBeEnabled();
    expect(screen.queryByText(/stem\(s\) written/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export stems as WAV" }));
    await screen.findByText("stem render failed");
  });

  it("hides plan and preview export actions when assets are not ready", () => {
    render(
      <ExportCompositionPanel
        composition={createComposition({ exportPath: null, previewAudioPath: null })}
      />,
    );

    expect(screen.queryByRole("button", { name: "Export plan.json" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Export preview WAV" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export stems as WAV" })).toBeInTheDocument();
  });
});
