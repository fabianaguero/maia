import { describe, expect, it } from "vitest";

import {
  buildWaveformPerformanceDragCommit,
  buildWaveformPerformanceDragMoveState,
} from "../../../../src/features/analyzer/components/waveformPerformanceDragRuntime";

describe("waveformPerformanceDragRuntime", () => {
  it("builds drag move state from pointer input and beat-grid snapping", () => {
    const moveState = buildWaveformPerformanceDragMoveState({
      clientX: 60,
      dragStartClientX: 20,
      resolveSecondFromClientX: (clientX) => clientX / 5,
      dragTarget: {
        type: "cue",
        cue: {
          id: "cue-1",
          second: 8,
          label: "Drop",
          kind: "hot",
        },
      },
      durationSeconds: 40,
      beatGrid: Array.from({ length: 65 }, (_, index) => ({
        index,
        second: index * 0.5,
      })),
    });

    expect(moveState).toEqual({
      nextSecond: 12,
      moved: true,
    });
  });

  it("builds drag commit payloads for cue, loop boundary, loop, and noop", () => {
    expect(
      buildWaveformPerformanceDragCommit({
        dragTarget: {
          type: "cue",
          cue: {
            id: "cue-1",
            second: 8,
            label: "Drop",
            kind: "hot",
          },
        },
        nextSecond: 12,
        dragMoved: true,
      }),
    ).toEqual({
      kind: "cue",
      cue: {
        id: "cue-1",
        second: 8,
        label: "Drop",
        kind: "hot",
      },
      second: 12,
    });

    expect(
      buildWaveformPerformanceDragCommit({
        dragTarget: {
          type: "loop-boundary",
          loopId: "loop-1",
          boundary: "end",
        },
        nextSecond: 16,
        dragMoved: true,
      }),
    ).toEqual({
      kind: "loop-boundary",
      loopId: "loop-1",
      boundary: "end",
      second: 16,
    });

    expect(
      buildWaveformPerformanceDragCommit({
        dragTarget: {
          type: "loop",
          loopId: "loop-1",
          startSecond: 8,
          endSecond: 12,
          pointerOffsetSecond: 0.5,
        },
        nextSecond: 14,
        dragMoved: true,
      }),
    ).toEqual({
      kind: "loop",
      loopId: "loop-1",
      second: 14,
    });

    expect(
      buildWaveformPerformanceDragCommit({
        dragTarget: {
          type: "loop",
          loopId: "loop-1",
          startSecond: 8,
          endSecond: 12,
          pointerOffsetSecond: 0.5,
        },
        nextSecond: null,
        dragMoved: false,
      }),
    ).toEqual({
      kind: "noop",
    });
  });
});
