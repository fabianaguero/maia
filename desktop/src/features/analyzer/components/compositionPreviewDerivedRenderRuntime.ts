import type { CompositionResultRecord } from "../../../types/library";
import {
  resolveArrangementSections,
  resolveCompositionPreviewCategoryId,
} from "./compositionPreviewArrangementRuntime";
import { buildDerivedRenderAutomation } from "./compositionPreviewDerivedAutomationRuntime";
import { buildDerivedRenderStems } from "./compositionPreviewDerivedStemRuntime";
import type { RenderPreview } from "./compositionPreviewTypes";

export function buildDerivedRenderPreview(composition: CompositionResultRecord): RenderPreview {
  const categoryId = resolveCompositionPreviewCategoryId(composition);
  const referenceType = composition.referenceType;
  const strategy = composition.strategy;
  const sections = resolveArrangementSections(composition);
  const mainSections = sections.filter((section) => section.role !== "outro");
  const peakSection = sections[2]?.id ?? "drop";

  return {
    mode: "deterministic-stem-preview",
    headroomDb: categoryId === "fx-palette" ? -7.5 : -6,
    masterChain: [
      "sub cleanup",
      referenceType === "repo" ? "structural glue compression" : "glue compression",
      categoryId === "fx-palette" ? "transition tame limiter" : "soft clip guard",
    ],
    exportTargets: ["preview-loop", "stem-balance-pass", "arrangement-audit"],
    stems: buildDerivedRenderStems({
      categoryId,
      peakSection,
      mainSectionIds: mainSections.map((section) => section.id),
      sectionIds: sections.map((section) => section.id),
      referenceType,
      buildSectionId: sections[1]?.id ?? "build",
    }),
    automation: buildDerivedRenderAutomation({
      categoryId,
      strategy,
      sections,
      peakSection,
    }),
  };
}
