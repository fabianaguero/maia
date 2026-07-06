import { describe, expect, it } from "vitest";

import { applyAppV0SetupPreferenceUpdate } from "../../src/hooks/appV0PreferencesStateRuntime";

describe("appV0PreferencesStateRuntime", () => {
  it("sanitizes setup preference updates before persisting them in state", () => {
    expect(
      applyAppV0SetupPreferenceUpdate(
        {
          defaultCloudLookback: "30m",
          idleHoldMs: 1400,
          tailWindowRows: 900,
        },
        "tailWindowRows",
        50,
      ),
    ).toEqual({
      defaultCloudLookback: "30m",
      idleHoldMs: 1400,
      tailWindowRows: 200,
    });
  });
});
