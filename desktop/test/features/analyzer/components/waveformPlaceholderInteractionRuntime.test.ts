import { describe, expect, it } from "vitest";

import {
  resolveWaveformClickAction,
  resolveWaveformDragEditSecond,
  resolveWaveformSecondFromClientX,
  shouldFlagWaveformDragMoved,
} from "../../../../src/features/analyzer/components/waveformPlaceholderInteractionRuntime";

describe("waveformPlaceholderInteractionRuntime", () => {
  it("resolves waveform seconds from client coordinates", () => {
    expect(
      resolveWaveformSecondFromClientX({
        clientX: 100,
        stageRect: { left: 0, width: 200 },
        durationSeconds: 120,
      }),
    ).toBe(60);

    expect(
      resolveWaveformSecondFromClientX({
        clientX: 100,
        stageRect: null,
        durationSeconds: 120,
      }),
    ).toBeNull();
  });

  it("resolves click actions for seek, downbeat and phrase capture", () => {
    expect(
      resolveWaveformClickAction({
        clientX: 100,
        stageRect: { left: 0, width: 200 },
        durationSeconds: 100,
        gridClickArmed: false,
        phraseSelectArmed: false,
        beatGrid: [{ index: 0, second: 0 }],
        phraseBeatCount: 16,
      }),
    ).toEqual({ action: "seek", second: 50 });

    expect(
      resolveWaveformClickAction({
        clientX: 100,
        stageRect: { left: 0, width: 200 },
        durationSeconds: 100,
        gridClickArmed: true,
        phraseSelectArmed: false,
        beatGrid: [{ index: 0, second: 0 }],
        phraseBeatCount: 16,
      }),
    ).toEqual({ action: "downbeat", second: 50 });

    expect(
      resolveWaveformClickAction({
        clientX: 20,
        stageRect: { left: 0, width: 200 },
        durationSeconds: 40,
        gridClickArmed: false,
        phraseSelectArmed: true,
        beatGrid: Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        })),
        phraseBeatCount: 16,
      }),
    ).toEqual({
      action: "phrase",
      range: {
        startSecond: 0,
        endSecond: 8,
        startBeatIndex: 0,
        endBeatIndex: 16,
        beatCount: 16,
        label: "Phrase 1",
      },
    });
  });

  it("resolves drag movement and performance drag placement", () => {
    expect(shouldFlagWaveformDragMoved(null, 12)).toBe(false);
    expect(shouldFlagWaveformDragMoved(10, 12)).toBe(false);
    expect(shouldFlagWaveformDragMoved(10, 14)).toBe(true);

    expect(
      resolveWaveformDragEditSecond({
        rawSecond: 12,
        dragTarget: {
          type: "cue",
          cue: { id: "cue-1", second: 8, label: "Drop", kind: "hot" },
        },
        durationSeconds: 40,
        beatGrid: Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        })),
      }),
    ).toBe(12);

    expect(
      resolveWaveformDragEditSecond({
        rawSecond: 12,
        dragTarget: {
          type: "loop",
          loopId: "loop-1",
          startSecond: 8,
          endSecond: 12,
          pointerOffsetSecond: 2,
        },
        durationSeconds: 40,
        beatGrid: Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        })),
      }),
    ).toBe(10);
  });
});
