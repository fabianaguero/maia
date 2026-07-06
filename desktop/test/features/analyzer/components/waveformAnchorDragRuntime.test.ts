import { describe, expect, it } from "vitest";

import {
  buildWaveformAnchorDragCommit,
  resolveWaveformAnchorDragSecond,
} from "../../../../src/features/analyzer/components/waveformAnchorDragRuntime";

describe("waveformAnchorDragRuntime", () => {
  it("resolves anchor drag seconds and commit state", () => {
    expect(
      resolveWaveformAnchorDragSecond({
        clientX: 120,
        resolveSecondFromClientX: (clientX) => clientX / 2,
      }),
    ).toBe(60);

    expect(
      buildWaveformAnchorDragCommit({
        dragAnchorSecond: 72,
      }),
    ).toEqual({
      shouldCommit: true,
      second: 72,
    });

    expect(
      buildWaveformAnchorDragCommit({
        dragAnchorSecond: null,
      }),
    ).toEqual({
      shouldCommit: false,
      second: null,
    });
  });
});
