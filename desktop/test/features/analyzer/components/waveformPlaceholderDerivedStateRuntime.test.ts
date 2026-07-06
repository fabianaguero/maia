import { describe, expect, it, vi } from "vitest";

import { buildWaveformPlaceholderDerivedState } from "../../../../src/features/analyzer/components/waveformPlaceholderDerivedStateRuntime";

describe("waveformPlaceholderDerivedStateRuntime", () => {
  it("builds display bins, visible beats, anchor state and summary flags", () => {
    const state = buildWaveformPlaceholderDerivedState({
      bins: [0.1, 0.5, 0.9],
      beatGrid: Array.from({ length: 5 }, (_, index) => ({ index, second: index })),
      durationSeconds: 8,
      regions: [{ id: "loop-1", startSecond: 2, endSecond: 4, label: "Loop", type: "loop" }],
      selectedPhraseRange: null,
      onSelectPhraseRange: vi.fn(),
      interactions: {
        gridClickArmed: false,
        phraseSelectArmed: false,
        gridAnchorDragging: false,
        dragAnchorSecond: 3,
        dragTarget: null,
        dragEditSecond: null,
      },
    });

    expect(state.displayBins).toHaveLength(128);
    expect(state.visibleBeats).toHaveLength(5);
    expect(state.anchorSecond).toBe(3);
    expect(state.anchorPosition).toBe(37.5);
    expect(state.showRegionSummary).toBe(true);
    expect(state.showPhraseSummary).toBe(true);
  });
});
