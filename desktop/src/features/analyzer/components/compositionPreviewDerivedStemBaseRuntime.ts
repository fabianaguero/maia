import type { RenderStem } from "./compositionPreviewTypes";
import type { BuildDerivedRenderStemsInput } from "./compositionPreviewDerivedStemRuntime";
import { buildDerivedRenderFoundationStem } from "./compositionPreviewFoundationStemRuntime";
import { buildDerivedRenderGlueStem } from "./compositionPreviewGlueStemRuntime";
import { buildDerivedRenderMotionStem } from "./compositionPreviewMotionStemRuntime";

export function buildDerivedRenderBaseStems(input: BuildDerivedRenderStemsInput): RenderStem[] {
  return [
    buildDerivedRenderFoundationStem(input),
    buildDerivedRenderMotionStem(input),
    buildDerivedRenderGlueStem(input),
  ];
}
