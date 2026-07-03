import type { RenderStem } from "./compositionPreviewTypes";
import type { BuildDerivedRenderStemsInput } from "./compositionPreviewDerivedStemRuntime";

export function buildDerivedRenderFoundationStem(input: BuildDerivedRenderStemsInput): RenderStem {
  return {
    id: "stem-foundation",
    label:
      input.categoryId === "drum-kit"
        ? "Rhythm foundation"
        : input.categoryId === "code-pattern"
          ? "Pattern foundation"
          : "Base foundation",
    role: "foundation",
    source: "base-asset",
    focus: "carry the groove and preserve the reusable source identity",
    gainDb: -6.5,
    pan: 0,
    sectionIds: input.sectionIds,
  };
}
