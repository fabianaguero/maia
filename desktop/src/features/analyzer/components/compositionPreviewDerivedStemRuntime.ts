import type { CompositionResultRecord } from "../../../types/library";
import type { RenderStem } from "./compositionPreviewTypes";
import { buildDerivedRenderBaseStems } from "./compositionPreviewDerivedStemBaseRuntime";
import { buildDerivedRenderSpotlightStem } from "./compositionPreviewDerivedSpotlightStemRuntime";

export interface BuildDerivedRenderStemsInput {
  categoryId: string;
  peakSection: string;
  mainSectionIds: string[];
  sectionIds: string[];
  referenceType: CompositionResultRecord["referenceType"];
  buildSectionId: string;
}

export function buildDerivedRenderStems(input: BuildDerivedRenderStemsInput): RenderStem[] {
  const stems = buildDerivedRenderBaseStems(input);
  const spotlightStem = buildDerivedRenderSpotlightStem(input);
  if (spotlightStem) {
    stems.push(spotlightStem);
  }

  return stems;
}
