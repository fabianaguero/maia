import type { BuildAppV0ScreenModelArgs } from "../appV0ScreenCompositionRuntime";
import type { AppV0ContentActions } from "../appV0ScreenCompositionRuntime";
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

export function buildAppV0ScreenModelHookResult<
  TState extends {
    contentActions: AppV0ContentActions;
    sectionContentInput: BuildAppV0ScreenModelArgs["sectionContentInput"];
    screenModel: ReturnType<
      typeof import("../appV0ScreenCompositionRuntime").buildAppV0ScreenModel
    >;
  },
>(state: TState) {
  return state;
}
