import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  buildMonitorDeckControlGroups,
  coerceMonitorDeckControlValue,
} from "../../../src/features/simple/monitorDeckControlPanelRuntime";

describe("monitorDeckControlPanelRuntime", () => {
  it("builds deck control groups with the expected field structure", () => {
    const groups = buildMonitorDeckControlGroups({
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      t: en,
    });

    expect(groups.map((group) => group.key)).toEqual(["wave-timing", "response", "output"]);
    expect(groups[0]?.fields.map((field) => field.key)).toEqual([
      "waveformScale",
      "beatSnapSubdivision",
      "cueCooldownMs",
    ]);
    expect(groups[1]?.fields.map((field) => field.key)).toEqual([
      "reactivity",
      "anomalyEmphasis",
      "duckingIntensity",
      "recoveryRelease",
    ]);
    expect(groups[2]?.fields.map((field) => field.key)).toEqual([
      "masterVolume",
      "idleMotion",
      "alertShape",
    ]);
    expect(groups[0]?.fields[1]).toEqual(
      expect.objectContaining({
        inputKind: "select",
        compact: true,
        valueLabel: en.simpleMode.deckSetup.beatQuarter,
      }),
    );
    expect(groups[2]?.fields[2]).toEqual(
      expect.objectContaining({
        inputKind: "select",
        valueLabel: en.simpleMode.deckSetup.alertShapeTight,
        options: [
          { value: "soft", label: en.simpleMode.deckSetup.alertShapeSoft },
          { value: "tight", label: en.simpleMode.deckSetup.alertShapeTight },
          { value: "aggressive", label: en.simpleMode.deckSetup.alertShapeAggressive },
        ],
      }),
    );
  });

  it("coerces control values according to each field kind", () => {
    expect(coerceMonitorDeckControlValue("alertShape", "aggressive")).toBe("aggressive");
    expect(coerceMonitorDeckControlValue("beatSnapSubdivision", "0.125")).toBe(0.125);
    expect(coerceMonitorDeckControlValue("waveformScale", "1.7")).toBe(1.7);
    expect(coerceMonitorDeckControlValue("masterVolume", "0.42")).toBe(0.42);
    expect(coerceMonitorDeckControlValue("cueCooldownMs", "2400")).toBe(2400);
    expect(coerceMonitorDeckControlValue("reactivity", "81")).toBe(81);
  });
});
