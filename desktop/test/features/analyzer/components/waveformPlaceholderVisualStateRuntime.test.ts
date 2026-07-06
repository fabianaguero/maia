import { describe, expect, it, vi } from "vitest";

import { en } from "../../../../src/i18n/en";
import { buildWaveformPlaceholderVisualState } from "../../../../src/features/analyzer/components/waveformPlaceholderVisualStateRuntime";

describe("waveformPlaceholderVisualStateRuntime", () => {
  it("builds rendered overlays, hints, summary pills and cursor", () => {
    const state = buildWaveformPlaceholderVisualState({
      t: en,
      hotCues: [{ second: 4, label: "Drop", type: "hot" }],
      regions: [{ id: "loop-1", startSecond: 8, endSecond: 12, label: "Loop", type: "loop" }],
      editableCues: [{ id: "cue-1", second: 4, label: "Drop", kind: "hot" }],
      editableLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 8,
          endSecond: 12,
          label: "Loop",
          color: null,
          locked: false,
        },
      ],
      currentTime: 6,
      durationSeconds: 16,
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
      phraseBeatCount: 16,
      interactions: {
        gridClickArmed: false,
        phraseSelectArmed: true,
        gridAnchorDragging: false,
        dragAnchorSecond: null,
        dragTarget: null,
        dragEditSecond: null,
      },
      displayBins: Array.from({ length: 128 }, () => 0.4),
      visibleBeats: Array.from({ length: 17 }, (_, index) => ({
        second: index * 0.5,
        index,
        major: index % 4 === 0,
        barNumber: Math.floor(index / 4) + 1,
      })),
      showRegionSummary: true,
      showPhraseSummary: true,
    });

    expect(state.renderedCueMarkers[0]).toMatchObject({ label: "Drop", second: 4 });
    expect(state.renderedRegions[0]).toMatchObject({ id: "loop-1", startSecond: 8, endSecond: 12 });
    expect(state.interactionHints.phraseHint).toBe(
      en.inspect.clickCapturePhrase.replace("{count}", "16"),
    );
    expect(state.playheadOverlay.progressPercent).toBe(37.5);
    expect(state.summaryPills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "visible-beats" }),
        expect.objectContaining({ key: "regions" }),
        expect.objectContaining({ key: "phrase" }),
      ]),
    );
    expect(state.cursor).toBe("cell");
  });
});
