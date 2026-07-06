import type { CompositionResultRecord } from "../../../types/library";
import type { RenderStem } from "./compositionPreviewTypes";
import type { BuildDerivedRenderStemsInput } from "./compositionPreviewDerivedStemRuntime";

export function buildDerivedRenderGlueStem(input: BuildDerivedRenderStemsInput): RenderStem {
  return {
    id: "stem-reference-glue",
    label:
      input.referenceType === "repo"
        ? "Structural glue"
        : input.referenceType === "track" || input.referenceType === "playlist"
          ? "Base groove glue"
          : "Tempo guide glue",
    role: "glue",
    source: resolveDerivedRenderGlueSource(input.referenceType),
    focus:
      input.referenceType === "repo"
        ? "translate structure pacing into arrangement density"
        : input.referenceType === "track" || input.referenceType === "playlist"
          ? "keep section changes aligned with the base groove"
          : "stabilize the typed tempo through each section boundary",
    gainDb: -11,
    pan: 0,
    sectionIds: [input.buildSectionId, input.peakSection],
  };
}

function resolveDerivedRenderGlueSource(
  referenceType: CompositionResultRecord["referenceType"],
): RenderStem["source"] {
  return referenceType === "manual" ? "manual" : "reference";
}
