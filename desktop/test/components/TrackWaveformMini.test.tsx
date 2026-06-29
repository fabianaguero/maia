import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TrackWaveformMini } from "../../src/components/TrackWaveformMini";
import { sampleTrackWaveformMiniBins } from "../../src/components/trackWaveformMiniViewModel";

afterEach(() => {
  cleanup();
});

describe("TrackWaveformMini", () => {
  it("builds a fallback waveform when bins are missing", () => {
    const samples = sampleTrackWaveformMiniBins(null, 8);
    expect(samples).toHaveLength(8);
    expect(samples.every((value) => value > 0)).toBe(true);
  });

  it("normalizes sampled bins to the expected range", () => {
    expect(sampleTrackWaveformMiniBins([0, 2, 4, 8], 4)).toEqual([0.04, 0.25, 0.5, 1]);
  });

  it("renders mini bars and active state", () => {
    const { container } = render(<TrackWaveformMini bins={[1, 3, 6]} active={true} />);
    const root = container.querySelector(".track-waveform-mini");
    const bars = container.querySelectorAll(".track-waveform-mini__bar");

    expect(root).not.toBeNull();
    expect(root?.className).toContain("active");
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(bars).toHaveLength(56);
    expect(bars[0]?.getAttribute("style")).toContain("height");
  });
});
