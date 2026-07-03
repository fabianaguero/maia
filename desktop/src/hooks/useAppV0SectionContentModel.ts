import {
  buildAppV0ContentActions,
  buildAppV0SectionContentInput,
} from "../appV0ScreenCompositionRuntime";
import {
  buildAppV0SectionContentActionsInput,
  buildAppV0SectionContentHookResult,
  buildAppV0SectionContentStateInput,
} from "./appV0SectionContentModelHookRuntime";
import type { AppV0SectionContentModelInput } from "./appV0ScreenModelTypes";

export function useAppV0SectionContentModel(input: AppV0SectionContentModelInput) {
  const contentActions = buildAppV0ContentActions(buildAppV0SectionContentActionsInput(input));

  const sectionContentInput = buildAppV0SectionContentInput(
    buildAppV0SectionContentStateInput(input, contentActions),
  );

  return buildAppV0SectionContentHookResult({
    contentActions,
    sectionContentInput,
  });
}
