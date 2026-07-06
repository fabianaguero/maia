import { describe, expect, it } from "vitest";

import { en } from "../../../../src/i18n/en";
import {
  buildWaveformRegionOverlayPhrase,
  buildWaveformRegionOverlayRegions,
} from "../../../../src/features/analyzer/components/waveformRegionOverlayRuntime";

describe("waveformRegionOverlayRuntime", () => {
  it("builds region props with positions, width, and interaction flags", () => {
    const regions = buildWaveformRegionOverlayRegions({
      renderedRegions: [
        {
          id: "loop-1",
          startSecond: 8,
          endSecond: 12,
          label: "Loop A",
          type: "loop",
          color: null,
          excerpt: "Slot 1 · Editable",
          editableLoop: {
            id: "loop-1",
            slot: 1,
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            color: null,
            locked: false,
          },
        },
      ],
      durationSeconds: 40,
      canEditPerformance: true,
      onSeek: () => undefined,
      t: en,
    });

    expect(regions).toEqual([
      expect.objectContaining({
        id: "loop-1",
        startPosition: 20,
        widthPercent: 10,
        ariaDisabled: false,
        tabIndex: 0,
      }),
    ]);
  });

  it("builds phrase overlay props only when duration and selection exist", () => {
    expect(
      buildWaveformRegionOverlayPhrase({
        selectedPhraseRange: {
          startSecond: 4,
          endSecond: 12,
          startBeatIndex: 8,
          endBeatIndex: 24,
          beatCount: 16,
          label: "Phrase 2",
        },
        durationSeconds: 20,
        onSeek: () => undefined,
        t: en,
      }),
    ).toEqual(
      expect.objectContaining({
        label: "Phrase 2",
        startPosition: 20,
        widthPercent: 40,
        ariaDisabled: false,
      }),
    );

    expect(
      buildWaveformRegionOverlayPhrase({
        selectedPhraseRange: null,
        durationSeconds: 20,
        onSeek: () => undefined,
        t: en,
      }),
    ).toBeNull();
  });
});
