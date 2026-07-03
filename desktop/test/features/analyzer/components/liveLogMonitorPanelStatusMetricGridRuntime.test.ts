import { describe, expect, it } from "vitest";

import { en } from "../../../../src/i18n/en";
import { buildLiveLogMonitorPanelStatusMetricGridItems } from "../../../../src/features/analyzer/components/liveLogMonitorPanelStatusMetricGridRuntime";

describe("liveLogMonitorPanelStatusMetricGridRuntime", () => {
  it("builds the primary panel metric grid", () => {
    const items = buildLiveLogMonitorPanelStatusMetricGridItems({
      t: en,
      replayActive: false,
      activeAdapterLabel: "File tail",
      audioStateLabel: en.inspect.audioOn,
      selectedStyleProfileLabel: "Nightfall",
      selectedMutationProfileLabel: "Balanced",
      cueEngineStateLabel: en.inspect.cueEngineBaseSamplePack,
      playbackWindowLabel: null,
      metrics: {
        windowCount: 4,
        processedLines: 120,
        totalAnomalies: 3,
      },
      emittedCueCount: 18,
      emittedVoiceCount: 11,
      beatClockBpm: 126,
      beatLooperActive: true,
    });

    expect(items.length).toBeGreaterThan(0);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: en.inspect.mode, value: "File tail" }),
        expect.objectContaining({
          label: en.inspect.cueEngineLabel,
          value: en.inspect.cueEngineBaseSamplePack,
        }),
      ]),
    );
  });
});
