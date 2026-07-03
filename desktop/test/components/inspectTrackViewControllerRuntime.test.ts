import { describe, expect, it } from "vitest";

import { buildInspectTrackCompareAuditionViewState } from "../../src/features/inspect/inspectTrackViewControllerRuntime";

describe("inspectTrackViewControllerRuntime", () => {
  it("builds compare audition state with an incremented cue request id", () => {
    expect(
      buildInspectTrackCompareAuditionViewState({
        previousCueRequest: { id: 2, second: 8, autoplay: true },
        point: {
          id: "compare-1",
          label: "Intro",
          second: 32,
        },
      }),
    ).toEqual({
      currentTime: 32,
      activeCompareAuditionId: "compare-1",
      activeCompareAuditionLabel: "Intro",
      cueRequest: {
        id: 3,
        second: 32,
        autoplay: true,
      },
    });
  });
});
