import { describe, expect, it, vi } from "vitest";

import { buildWaveformPlaceholderViewModel } from "../../../../src/features/analyzer/components/waveformPlaceholderViewModelRuntime";
import { en } from "../../../../src/i18n/en";

describe("waveformPlaceholderViewModelRuntime", () => {
  it("builds a derived waveform view model from interaction and stage state", () => {
    const viewModel = buildWaveformPlaceholderViewModel({
      t: en,
      bins: [0.1, 0.4, 0.9],
      beatGrid: Array.from({ length: 17 }, (_, index) => ({
        index,
        second: index * 0.5,
      })),
      durationSeconds: 16,
      hotCues: [
        {
          second: 4,
          label: "Drop",
          type: "hot",
        },
      ],
      regions: [
        {
          id: "loop-1",
          startSecond: 8,
          endSecond: 12,
          label: "Loop A",
          type: "loop",
        },
      ],
      editableCues: [
        {
          id: "cue-1",
          second: 4,
          label: "Drop",
          kind: "hot",
        },
      ],
      editableLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 8,
          endSecond: 12,
          label: "Loop A",
          color: null,
          locked: false,
        },
      ],
      currentTime: 6,
      analysisProgress: 0.75,
      canEditBeatGrid: true,
      canSelectPhrase: true,
      selectedPhraseRange: {
        startSecond: 0,
        endSecond: 8,
        startBeatIndex: 0,
        endBeatIndex: 16,
        beatCount: 16,
        label: "Phrase 1",
      },
      onSeek: vi.fn(),
      onSelectPhraseRange: vi.fn(),
      phraseBeatCount: 16,
      interactions: {
        gridClickArmed: false,
        phraseSelectArmed: true,
        gridAnchorDragging: false,
        dragAnchorSecond: null,
        dragTarget: null,
        dragEditSecond: null,
      },
    });

    expect(viewModel.displayBins).toHaveLength(128);
    expect(viewModel.visibleBeats).toHaveLength(17);
    expect(viewModel.anchorSecond).toBe(0);
    expect(viewModel.anchorPosition).toBe(0);
    expect(viewModel.showRegionSummary).toBe(true);
    expect(viewModel.showPhraseSummary).toBe(true);
    expect(viewModel.renderedCueMarkers[0]).toMatchObject({
      label: "Drop",
      second: 4,
    });
    expect(viewModel.renderedRegions[0]).toMatchObject({
      id: "loop-1",
      startSecond: 8,
      endSecond: 12,
    });
    expect(viewModel.interactionHints.phraseHint).toBe(
      en.inspect.clickCapturePhrase.replace("{count}", "16"),
    );
    expect(viewModel.playheadOverlay.progressPercent).toBe(37.5);
    expect(viewModel.playheadOverlay.analysisEndPercent).toBe(75);
    expect(viewModel.summaryPills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "visible-beats" }),
        expect.objectContaining({ key: "regions" }),
        expect.objectContaining({ key: "phrase" }),
      ]),
    );
    expect(viewModel.cursor).toBe("cell");
  });
});
