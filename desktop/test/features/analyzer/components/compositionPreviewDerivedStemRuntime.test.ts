import { describe, expect, it } from "vitest";

import { buildDerivedRenderStems } from "../../../../src/features/analyzer/components/compositionPreviewDerivedStemRuntime";

describe("compositionPreviewDerivedStemRuntime", () => {
  it("builds foundation, motion, glue and optional spotlight stems from domain inputs", () => {
    const stems = buildDerivedRenderStems({
      categoryId: "vocal-hook",
      peakSection: "hook",
      mainSectionIds: ["build", "hook"],
      sectionIds: ["intro", "build", "hook", "outro"],
      referenceType: "track",
      buildSectionId: "build",
    });

    expect(stems.map((stem) => stem.id)).toEqual([
      "stem-foundation",
      "stem-motion",
      "stem-reference-glue",
      "stem-spotlight",
    ]);
    expect(stems[1]).toMatchObject({
      label: "Energy motion",
      sectionIds: ["build", "hook"],
    });
    expect(stems[2]).toMatchObject({
      label: "Base groove glue",
      source: "reference",
      sectionIds: ["build", "hook"],
    });
    expect(stems[3]).toMatchObject({
      label: "Hook spotlight",
      pan: 0.08,
      sectionIds: ["hook"],
    });
  });
});
