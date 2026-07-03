import { describe, expect, it } from "vitest";

import {
  getMonitorSynthesisScale,
  quantizeMonitorFrequency,
} from "../../../src/features/monitor/monitorAudioSynthesisScaleRuntime";

describe("monitorAudioSynthesisScaleRuntime", () => {
  it("exposes a stable monitor scale and quantizes to the nearest tone", () => {
    expect(getMonitorSynthesisScale()).toEqual([
      220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33, 698.46, 783.99,
    ]);
    expect(quantizeMonitorFrequency(438)).toBe(440);
    expect(quantizeMonitorFrequency(350)).toBe(349.23);
  });
});
