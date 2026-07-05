import type { BuildAppV0ScreenModelArgs } from "../appV0ScreenCompositionRuntime";
import type { AppV0ContentActions } from "../appV0ScreenCompositionRuntime";
import type { buildAppV0ScreenModel } from "../appV0ScreenCompositionRuntime";
import type { AppV0SectionContentInput } from "../appV0SectionContentRuntime";
import type { UseAppV0ScreenModelInput } from "./appV0ScreenModelTypes";

export function buildAppV0ScreenShellState(input: UseAppV0ScreenModelInput) {
  return {
    currentSection: input.currentSection,
    isSidebarCollapsed: input.isSidebarCollapsed,
    toggleSidebarCollapsed: input.toggleSidebarCollapsed,
    isConsoleExpanded: input.isConsoleExpanded,
    toggleConsoleExpanded: input.toggleConsoleExpanded,
    openMonitorInspector: input.openMonitorInspector,
  };
}

export function buildAppV0ScreenCounts(input: UseAppV0ScreenModelInput) {
  return {
    trackCount: input.library.tracks.length,
    repositoryCount: input.repositories.repositories.length,
    baseAssetCount: input.baseAssets.baseAssets.length,
  };
}

export function buildAppV0ScreenState(input: UseAppV0ScreenModelInput) {
  return {
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    shellViewModel: input.shellViewModel,
  };
}

export function buildAppV0ScreenModelArgs(
  input: UseAppV0ScreenModelInput,
  state: {
    contentActions: AppV0ContentActions;
    sectionContentInput: BuildAppV0ScreenModelArgs["sectionContentInput"];
  },
): BuildAppV0ScreenModelArgs {
  const shell = buildAppV0ScreenShellState(input);
  const counts = buildAppV0ScreenCounts(input);
  const screenState = buildAppV0ScreenState(input);

  return {
    shell,
    contentActions: state.contentActions,
    shellViewModel: screenState.shellViewModel,
    currentSection: screenState.currentSection,
    isMonitoring: screenState.isMonitoring,
    trackCount: counts.trackCount,
    repositoryCount: counts.repositoryCount,
    baseAssetCount: counts.baseAssetCount,
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
