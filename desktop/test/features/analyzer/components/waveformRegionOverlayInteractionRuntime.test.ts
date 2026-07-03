import { describe, expect, it } from "vitest";

import {
  resolveWaveformRegionNudgeSecond,
  resolveWaveformRegionPointerOffset,
  shouldSuppressWaveformRegionClick,
} from "../../../../src/features/analyzer/components/waveformRegionOverlayInteractionRuntime";

describe("waveformRegionOverlayInteractionRuntime", () => {
  it("suppresses residual clicks only when a drag moved flag is present", () => {
    expect(shouldSuppressWaveformRegionClick(true)).toBe(true);
    expect(shouldSuppressWaveformRegionClick(false)).toBe(false);
  });

  it("resolves pointer offsets against the loop start second", () => {
    expect(
      resolveWaveformRegionPointerOffset({
        clickedSecond: 9,
        regionStartSecond: 8,
      }),
    ).toBe(1);

    expect(
      resolveWaveformRegionPointerOffset({
        clickedSecond: null,
        regionStartSecond: 8,
      }),
    ).toBe(0);
  });

  it("nudges waveform region positions through the shared track nudge helper", () => {
    expect(
      resolveWaveformRegionNudgeSecond({
        second: 8,
        direction: 1,
        durationSeconds: 40,
        beatGrid: Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        })),
        coarse: false,
        freeSlip: false,
      }),
    ).toBe(8.5);
  });
});
