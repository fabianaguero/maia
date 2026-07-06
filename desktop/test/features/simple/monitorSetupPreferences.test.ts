import { describe, expect, it } from "vitest";

import {
  DEFAULT_MONITOR_SETUP_PREFERENCES,
  loadMonitorSetupPreferences,
  sanitizeMonitorSetupPreferenceValue,
  sanitizeMonitorSetupPreferences,
} from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildMonitorSetupPreferenceFieldViewModels,
  buildMonitorSetupPreferenceGroups,
  formatMonitorSetupIdleHold,
  formatMonitorSetupTailRows,
} from "../../../src/features/simple/monitorSetupPreferenceViewModelRuntime";
import { en } from "../../../src/i18n/en";

describe("monitorSetupPreferences", () => {
  it("sanitizes runtime defaults and clamps numeric values", () => {
    expect(
      sanitizeMonitorSetupPreferences({
        defaultCloudLookback: " 120m ",
        idleHoldMs: 12_000,
        tailWindowRows: 25,
      }),
    ).toEqual({
      defaultCloudLookback: "120m",
      idleHoldMs: 10_000,
      tailWindowRows: 200,
    });
  });

  it("loads defaults when persisted setup is missing or invalid", () => {
    expect(loadMonitorSetupPreferences(null)).toEqual(DEFAULT_MONITOR_SETUP_PREFERENCES);
    expect(loadMonitorSetupPreferences("{bad json")).toEqual(DEFAULT_MONITOR_SETUP_PREFERENCES);
  });

  it("formats setup values for the runtime cards", () => {
    expect(formatMonitorSetupIdleHold(900)).toBe("0.9s");
    expect(formatMonitorSetupTailRows(1200)).toBe("1200 rows");
  });

  it("sanitizes individual setup preference values", () => {
    expect(sanitizeMonitorSetupPreferenceValue("defaultCloudLookback", " 30m ")).toBe("30m");
    expect(sanitizeMonitorSetupPreferenceValue("idleHoldMs", 12_000)).toBe(10_000);
    expect(sanitizeMonitorSetupPreferenceValue("tailWindowRows", 50)).toBe(200);
  });

  it("builds runtime preference field view-models from centralized metadata", () => {
    const fields = buildMonitorSetupPreferenceFieldViewModels({
      preferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    });

    expect(fields.map((field) => field.key)).toEqual([
      "defaultCloudLookback",
      "idleHoldMs",
      "tailWindowRows",
    ]);
    expect(fields[1]).toMatchObject({
      key: "idleHoldMs",
      group: "stream-runtime",
      inputMode: "number",
      min: 250,
      max: 10_000,
      step: 100,
      valueLabel: "0.9s",
    });
  });

  it("builds grouped runtime defaults for setup racks", () => {
    const groups = buildMonitorSetupPreferenceGroups({
      preferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    });

    expect(groups.map((group) => group.key)).toEqual(["cloud-defaults", "stream-runtime"]);
    expect(groups[0]?.fields.map((field) => field.key)).toEqual(["defaultCloudLookback"]);
    expect(groups[1]?.fields.map((field) => field.key)).toEqual(["idleHoldMs", "tailWindowRows"]);
  });
});
