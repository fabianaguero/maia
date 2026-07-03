import { describe, expect, it } from "vitest";

import { buildMonitorDeckFocusBarState } from "../../../src/features/simple/monitorDeckHeaderRuntime";

describe("monitorDeckHeaderRuntime", () => {
  it("builds critical focus-bar state when all anomaly fields exist", () => {
    expect(
      buildMonitorDeckFocusBarState({
        focusBadgeLabel: "Alert",
        focusBadgeTone: "critical",
        focusTimestamp: "00:45",
        focusMessage: "Error spike",
        focusCueCode: "anomaly-42",
      }),
    ).toMatchObject({
      shouldRender: true,
      containerClassName: "monitor-deck-focusbar critical",
      badgeClassName: "monitor-deck-focusbar__badge critical",
      cueLabel: expect.stringMatching(/^A-\d{4}$/),
    });
  });

  it("hides the focus bar when required fields are missing and defaults to warning tone", () => {
    expect(
      buildMonitorDeckFocusBarState({
        focusBadgeLabel: null,
        focusBadgeTone: null,
        focusTimestamp: null,
        focusMessage: null,
        focusCueCode: null,
      }),
    ).toEqual({
      shouldRender: false,
      containerClassName: "monitor-deck-focusbar warning",
      badgeClassName: "monitor-deck-focusbar__badge warning",
      cueLabel: "A-0000",
    });
  });
});
