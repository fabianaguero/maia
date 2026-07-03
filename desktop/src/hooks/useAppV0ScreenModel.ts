import { buildAppV0ScreenModel } from "../appV0ScreenCompositionRuntime";
import {
  buildAppV0ScreenModelArgs,
  buildAppV0ScreenModelHookResult,
} from "./appV0ScreenModelHookRuntime";
import type { UseAppV0ScreenModelInput } from "./appV0ScreenModelTypes";
import { useAppV0SectionContentModel } from "./useAppV0SectionContentModel";

export function useAppV0ScreenModel(input: UseAppV0ScreenModelInput) {
  const sectionContentModel = useAppV0SectionContentModel(input);

  const screenModel = buildAppV0ScreenModel(buildAppV0ScreenModelArgs(input, sectionContentModel));

  return buildAppV0ScreenModelHookResult({
    ...sectionContentModel,
    screenModel,
  });
}
