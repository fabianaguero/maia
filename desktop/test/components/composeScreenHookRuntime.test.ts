import { describe, expect, it, vi } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildComposeScreenBpmCurveInput,
  buildComposeScreenFormInput,
  buildComposeScreenPickerInput,
  buildComposeScreenRenderPreviewInput,
  buildComposeScreenSummaryState,
  buildComposeScreenTabButtonState,
  buildComposeScreenViewModelInput,
  buildComposeScreenWaveformInput,
} from "../../src/features/compose/composeScreenHookRuntime";

describe("composeScreenHookRuntime", () => {
  it("builds view-model, summary, form and picker inputs from compose state", () => {
    const composition = {
      id: "composition-1",
      targetBpm: 126,
      referenceTitle: "Night run",
      waveformBins: [0.2],
      beatGrid: [],
      metrics: { previewDurationSeconds: 96 },
      visualization: { hotCues: [] },
      bpmCurve: [],
    } as never;
    const viewModel = {
      showSummary: true,
      compositionsCount: 1,
      targetBpmLabel: "126",
      timingSourceLabel: "Night run",
      compositionOptions: [{ id: "composition-1", label: "Night composition" }],
      tabOptions: [{ id: "preview", label: "Preview", isActive: true }],
    } as never;

    const viewModelInput = buildComposeScreenViewModelInput({
      t: en,
      tab: "preview",
      composition,
      compositions: [composition],
      baseAssets: [],
      tracks: [],
      playlists: [],
    });
    const summary = buildComposeScreenSummaryState({ composition, viewModel });
    const formInput = buildComposeScreenFormInput({
      busy: false,
      baseAssets: [],
      tracks: [],
      playlists: [],
      repositories: [],
      onImportComposition: vi.fn(async () => true),
    });
    const pickerInput = buildComposeScreenPickerInput({
      composition,
      compositionOptions: viewModel.compositionOptions,
      onSelectComposition: vi.fn(),
    });

    expect(viewModelInput.t).toBe(en);
    expect(summary.showSummary).toBe(true);
    expect(summary.targetBpmLabel).toBe("126");
    expect(formInput.onImportComposition).toBeTypeOf("function");
    expect(pickerInput.composition?.id).toBe("composition-1");
  });

  it("builds waveform, bpm, tab and render-preview inputs without mutation", () => {
    const composition = {
      waveformBins: [0.2],
      beatGrid: [],
      metrics: { previewDurationSeconds: 96 },
      visualization: { hotCues: [] },
      bpmCurve: [{ second: 0, bpm: 126 }],
      targetBpm: 126,
    } as never;

    const waveformInput = buildComposeScreenWaveformInput({
      composition,
      currentTime: 12,
      onSeek: vi.fn(),
      analysisProgress: 0.42,
    });
    const bpmInput = buildComposeScreenBpmCurveInput({ composition });
    const tabInput = buildComposeScreenTabButtonState({
      tabOptions: [{ id: "preview", label: "Preview", isActive: true }],
      setTab: vi.fn(),
    });
    const renderInput = buildComposeScreenRenderPreviewInput({
      composition,
      onTimeUpdate: vi.fn(),
    });

    expect(waveformInput.currentTime).toBe(12);
    expect(waveformInput.durationSeconds).toBe(96);
    expect(bpmInput.fallbackBpm).toBe(126);
    expect(tabInput.tabOptions).toHaveLength(1);
    expect(renderInput.composition).toBe(composition);
  });
});
