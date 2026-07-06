import { describe, expect, it } from "vitest";

import { en } from "../../../../src/i18n/en";
import {
  buildWaveformCueOverlayMarkers,
  resolveWaveformCueOverlayNudgeSecond,
} from "../../../../src/features/analyzer/components/waveformCueOverlayRuntime";

describe("waveformCueOverlayRuntime", () => {
  it("builds marker props with positions and dragging state", () => {
    const markers = buildWaveformCueOverlayMarkers({
      renderedCueMarkers: [
        {
          key: "hot-1",
          second: 10,
          label: "Drop",
          type: "hot",
          excerpt: "Slot 1",
          interactiveCue: {
            id: "hot-1",
            second: 10,
            label: "Drop",
            kind: "hot",
          },
        },
      ],
      dragTarget: {
        type: "cue",
        cue: {
          id: "hot-1",
          second: 10,
          label: "Drop",
          kind: "hot",
        },
        originSecond: 10,
      },
      durationSeconds: 40,
      onSeek: () => undefined,
      t: en,
    });

    expect(markers).toEqual([
      expect.objectContaining({
        key: "hot-1",
        typeClassName: "hot",
        dragging: true,
        position: 25,
        disabled: false,
      }),
    ]);
  });

  it("resolves cue nudge positions with beat-grid aware stepping", () => {
    expect(
      resolveWaveformCueOverlayNudgeSecond({
        cueSecond: 4,
        direction: 1,
        durationSeconds: 40,
        beatGrid: Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        })),
        coarse: false,
        freeSlip: false,
      }),
    ).toBe(4.5);
  });
});
