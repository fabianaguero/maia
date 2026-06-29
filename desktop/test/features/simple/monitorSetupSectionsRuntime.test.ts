import { describe, expect, it } from "vitest";

import {
  coerceMonitorSetupPreferenceInputValue,
  resolveMonitorSetupRuntimeDefaultGroups,
} from "../../../src/features/simple/monitorSetupSectionsRuntime";
import type {
  MonitorSetupPreferenceFieldViewModel,
  MonitorSetupPreferenceGroupViewModel,
} from "../../../src/features/simple/monitorSetupPreferenceViewModelRuntime";

const streamField: MonitorSetupPreferenceFieldViewModel = {
  key: "idleHoldMs",
  group: "stream-runtime",
  label: "Idle hold",
  help: "Keep the deck calm while the tail idles.",
  valueLabel: "0.9s",
  inputMode: "number",
  min: 250,
  max: 10_000,
  step: 100,
};

describe("monitorSetupSectionsRuntime", () => {
  it("falls back to a default runtime group when explicit groups are absent", () => {
    expect(
      resolveMonitorSetupRuntimeDefaultGroups({
        runtimeDefaultFields: [streamField],
      }),
    ).toEqual([
      {
        key: "stream-runtime",
        label: "",
        hint: "",
        fields: [streamField],
      },
    ]);
  });

  it("preserves explicit runtime groups when provided", () => {
    const explicitGroup: MonitorSetupPreferenceGroupViewModel = {
      key: "cloud-defaults",
      label: "Cloud defaults",
      hint: "Applied when no per-session override exists.",
      fields: [
        {
          key: "defaultCloudLookback",
          group: "cloud-defaults",
          label: "Lookback",
          help: "How far back the first cloud tail should start.",
          valueLabel: "10m",
          inputMode: "text",
        },
      ],
    };

    expect(
      resolveMonitorSetupRuntimeDefaultGroups({
        runtimeDefaultFields: [streamField],
        runtimeDefaultGroups: [explicitGroup],
      }),
    ).toEqual([explicitGroup]);
  });

  it("sanitizes numeric and text input values before they hit setup state", () => {
    expect(coerceMonitorSetupPreferenceInputValue("idleHoldMs", "number", "")).toBe(250);
    expect(coerceMonitorSetupPreferenceInputValue("tailWindowRows", "number", "9000")).toBe(5000);
    expect(
      coerceMonitorSetupPreferenceInputValue("defaultCloudLookback", "text", "   25m   "),
    ).toBe("25m");
  });
});
