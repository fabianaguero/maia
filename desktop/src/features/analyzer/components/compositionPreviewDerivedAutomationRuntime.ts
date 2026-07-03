import type { CompositionResultRecord } from "../../../types/library";
import type { ArrangementSection, RenderAutomationMove } from "./compositionPreviewTypes";

export function buildDerivedRenderAutomation(input: {
  categoryId: string;
  strategy: CompositionResultRecord["strategy"];
  sections: ArrangementSection[];
  peakSection: string;
}): RenderAutomationMove[] {
  return [
    {
      id: "auto-build-rise",
      target: "stem-motion",
      move: input.categoryId === "fx-palette" ? "riser emphasis" : "filter open",
      sectionId: input.sections[1]?.id ?? "build",
      startBar: input.sections[1]?.startBar ?? 5,
      endBar: input.sections[1]?.endBar ?? 8,
    },
    {
      id: "auto-main-impact",
      target: "stem-foundation",
      move: input.strategy === "pattern-translation" ? "pattern spotlight" : "transient lift",
      sectionId: input.peakSection,
      startBar: input.sections[2]?.startBar ?? 9,
      endBar: input.sections[2]?.endBar ?? 12,
    },
    {
      id: "auto-outro-clear",
      target: "master",
      move: "headroom release",
      sectionId: input.sections[3]?.id ?? "outro",
      startBar: input.sections[3]?.startBar ?? 13,
      endBar: input.sections[3]?.endBar ?? 16,
    },
  ];
}
