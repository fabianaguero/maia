import { describe, expect, it } from "vitest";

import { buildAppContentControllerDerivedState } from "../../src/hooks/appContentControllerDerivedRuntime";

describe("appContentControllerDerivedRuntime", () => {
  it("preserves the derived controller state contract", () => {
    expect(
      buildAppContentControllerDerivedState({
        effectivePillar: "curate",
        effectiveScreen: "library",
        analyzerLabel: "Booting analyzer bridge",
        detailDeckLabel: "Source deck armed",
        screenLabel: "Library",
        selectedItemTitle: "Track One",
        isMutating: true,
        mutateLabel: "Mapping repository",
      }),
    ).toEqual({
      effectivePillar: "curate",
      effectiveScreen: "library",
      analyzerLabel: "Booting analyzer bridge",
      detailDeckLabel: "Source deck armed",
      screenLabel: "Library",
      selectedItemTitle: "Track One",
      isMutating: true,
      mutateLabel: "Mapping repository",
    });
  });
});
