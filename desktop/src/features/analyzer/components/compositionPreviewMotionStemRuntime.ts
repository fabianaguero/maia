import type { RenderStem } from "./compositionPreviewTypes";
import type { BuildDerivedRenderStemsInput } from "./compositionPreviewDerivedStemRuntime";

export function buildDerivedRenderMotionStem(input: BuildDerivedRenderStemsInput): RenderStem {
  return {
    id: "stem-motion",
    label:
      input.categoryId === "fx-palette"
        ? "Transition motion"
        : input.categoryId === "pad-texture"
          ? "Texture motion"
          : "Energy motion",
    role: "support",
    source: "base-asset",
    focus: "increase motion through the middle sections without masking the foundation",
    gainDb: -9,
    pan: input.categoryId === "pad-texture" ? -0.18 : 0.12,
    sectionIds: input.mainSectionIds,
  };
}
