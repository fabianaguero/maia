import type { RenderStem } from "./compositionPreviewTypes";
import type { BuildDerivedRenderStemsInput } from "./compositionPreviewDerivedStemRuntime";

export function buildDerivedRenderSpotlightStem(
  input: BuildDerivedRenderStemsInput,
): RenderStem | null {
  if (input.categoryId !== "vocal-hook" && input.categoryId !== "bass-motif") {
    return null;
  }

  return {
    id: "stem-spotlight",
    label: input.categoryId === "vocal-hook" ? "Hook spotlight" : "Low-end spotlight",
    role: "spotlight",
    source: "base-asset",
    focus:
      input.categoryId === "vocal-hook"
        ? "reserve space for the hook entry at the main section"
        : "push the bass motif forward without collapsing headroom",
    gainDb: -7.5,
    pan: input.categoryId === "vocal-hook" ? 0.08 : 0,
    sectionIds: [input.peakSection],
  };
}
