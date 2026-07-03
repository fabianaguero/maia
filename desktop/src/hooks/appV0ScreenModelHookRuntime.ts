import type { BuildAppV0ScreenModelArgs } from "../appV0ScreenCompositionRuntime";
import type { AppV0ContentActions } from "../appV0ScreenCompositionRuntime";
import type { buildAppV0ScreenModel } from "../appV0ScreenCompositionRuntime";
import type { AppV0SectionContentInput } from "../appV0SectionContentRuntime";
import type { UseAppV0ScreenModelInput } from "./appV0ScreenModelTypes";

export function buildAppV0ScreenModelArgs(
  input: UseAppV0ScreenModelInput,
  state: {
    contentActions: AppV0ContentActions;
    sectionContentInput: BuildAppV0ScreenModelArgs["sectionContentInput"];
  },
): BuildAppV0ScreenModelArgs {
  return {
    shell: {
      currentSection: input.currentSection,
      isSidebarCollapsed: input.isSidebarCollapsed,
      toggleSidebarCollapsed: input.toggleSidebarCollapsed,
      isConsoleExpanded: input.isConsoleExpanded,
      toggleConsoleExpanded: input.toggleConsoleExpanded,
      openMonitorInspector: input.openMonitorInspector,
    },
    contentActions: state.contentActions,
    shellViewModel: input.shellViewModel,
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    trackCount: input.library.tracks.length,
    repositoryCount: input.repositories.repositories.length,
    baseAssetCount: input.baseAssets.baseAssets.length,
    sectionContentInput: state.sectionContentInput,
  };
}

export interface AppV0ScreenModelHookResult {
  contentActions: AppV0ContentActions;
  sectionContentInput: AppV0SectionContentInput;
  screenModel: ReturnType<typeof buildAppV0ScreenModel>;
}

export function buildAppV0ScreenModelHookResult(
  state: AppV0ScreenModelHookResult,
): AppV0ScreenModelHookResult {
  return state;
}
