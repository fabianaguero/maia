import { describe, expect, it } from "vitest";

import {
  buildRenderedCueMarkers,
  buildRenderedRegions,
  resolveAnchorPosition,
  resolveDisplayBins,
  resolveWaveformSummaryFlags,
  resolveWaveformCursor,
} from "../../src/features/analyzer/components/waveformPlaceholderRuntime";

describe("waveformPlaceholderRuntime", () => {
  it("builds fallback display bins when no waveform bins are present", () => {
    const bins = resolveDisplayBins([]);

    expect(bins).toHaveLength(128);
    expect(Math.max(...bins)).toBeGreaterThan(0.5);
  });

  it("projects the anchor position from the dragged second or first visible beat", () => {
    expect(
      resolveAnchorPosition({
        dragAnchorSecond: null,
        durationSeconds: 100,
        visibleBeats: [{ second: 25 }],
      }),
    ).toEqual({
      anchorSecond: 25,
      anchorPosition: 25,
    });

    expect(
      resolveAnchorPosition({
        dragAnchorSecond: 60,
        durationSeconds: 120,
        visibleBeats: [{ second: 25 }],
      }),
    ).toEqual({
      anchorSecond: 60,
      anchorPosition: 50,
    });
  });

  it("renders editable cue markers using the drag preview second", () => {
    const markers = buildRenderedCueMarkers({
      editableCues: [
        {
          id: "cue-1",
          second: 4,
          label: "Drop",
          kind: "hot",
        },
      ],
      hotCues: [],
      dragTarget: {
        type: "cue",
        cue: {
          id: "cue-1",
          second: 4,
          label: "Drop",
          kind: "hot",
        },
      },
      dragEditSecond: 12,
    });

    expect(markers[0]).toMatchObject({
      key: "cue-1",
      second: 12,
      interactiveCue: {
        id: "cue-1",
      },
    });
  });

  it("renders loop previews while dragging a full loop", () => {
    const regions = buildRenderedRegions({
      regions: [
        {
          id: "loop-1",
          startSecond: 10,
          endSecond: 14,
          label: "Loop A",
          type: "loop",
        },
      ],
      editableLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 10,
          endSecond: 14,
          label: "Loop A",
          color: null,
          locked: false,
        },
      ],
      dragTarget: {
        type: "loop",
        loopId: "loop-1",
        startSecond: 10,
        endSecond: 14,
        pointerOffsetSecond: 0.5,
      },
      dragEditSecond: 30,
      durationSeconds: 40,
    });

    expect(regions[0]).toMatchObject({
      startSecond: 30,
      endSecond: 34,
    });
  });

  it("renders loop previews without duration clamping and supports boundary drags", () => {
    const previewRegions = buildRenderedRegions({
      regions: [
        {
          id: "loop-1",
          startSecond: 10,
          endSecond: 14,
          label: "Loop A",
          type: "loop",
        },
      ],
      editableLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 10,
          endSecond: 14,
          label: "Loop A",
          color: null,
          locked: false,
        },
      ],
      dragTarget: {
        type: "loop",
        loopId: "loop-1",
        startSecond: 10,
        endSecond: 14,
        pointerOffsetSecond: 0.5,
      },
      dragEditSecond: 12,
      durationSeconds: null,
    });

    expect(previewRegions[0]).toMatchObject({
      startSecond: 12,
      endSecond: 16,
    });

    const boundaryRegions = buildRenderedRegions({
      regions: [
        {
          id: "loop-1",
          startSecond: 10,
          endSecond: 14,
          label: "Loop A",
          type: "loop",
        },
      ],
      editableLoops: [],
      dragTarget: {
        type: "loop-boundary",
        loopId: "loop-1",
        boundary: "start",
      },
      dragEditSecond: 13,
      durationSeconds: 20,
    });

    expect(boundaryRegions[0]).toMatchObject({
      startSecond: 13,
      endSecond: 14,
    });
  });

  it("derives region and phrase summaries from visible state", () => {
    expect(resolveWaveformSummaryFlags([], null)).toEqual({
      showRegionSummary: false,
      showPhraseSummary: false,
    });

    expect(
      resolveWaveformSummaryFlags(
        [{ id: "loop-1", startSecond: 0, endSecond: 4, label: "Loop A", type: "loop" }],
        { startSecond: 0, endSecond: 8, startBeatIndex: 0, endBeatIndex: 16, beatCount: 16, label: "Phrase 1" },
      ),
    ).toEqual({
      showRegionSummary: true,
      showPhraseSummary: true,
    });
  });

  it("resolves the waveform cursor from the active interaction mode", () => {
    expect(
      resolveWaveformCursor({
        gridAnchorDragging: false,
        dragTarget: null,
        phraseSelectArmed: false,
        canSelectPhrase: true,
        gridClickArmed: false,
        canEditBeatGrid: true,
      }),
    ).toBe("default");

    expect(
      resolveWaveformCursor({
        gridAnchorDragging: false,
        dragTarget: null,
        phraseSelectArmed: true,
        canSelectPhrase: true,
        gridClickArmed: false,
        canEditBeatGrid: true,
      }),
    ).toBe("cell");

    expect(
      resolveWaveformCursor({
        gridAnchorDragging: true,
        dragTarget: null,
        phraseSelectArmed: false,
        canSelectPhrase: true,
        gridClickArmed: false,
        canEditBeatGrid: true,
      }),
    ).toBe("grabbing");
  });
});
