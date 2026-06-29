import type { AppPillar, AppScreen } from "./types/library";

type UserMode = "simple" | "expert";

export interface AppSectionContentState {
  showSimpleWizard: boolean;
  showSimpleLibrary: boolean;
  showExpertLibrary: boolean;
  showInspect: boolean;
  showCompose: boolean;
  showSession: boolean;
}

export function buildAppSectionContentState(input: {
  userMode: UserMode;
  effectivePillar: AppPillar;
  effectiveScreen: AppScreen;
  hasMonitorSession: boolean;
  repositoryCount: number;
}): AppSectionContentState {
  const inCurateLibrary = input.effectivePillar === "curate" && input.effectiveScreen === "library";

  return {
    showSimpleWizard:
      inCurateLibrary &&
      input.userMode === "simple" &&
      !input.hasMonitorSession &&
      input.repositoryCount === 0,
    showSimpleLibrary: inCurateLibrary && input.userMode === "simple" && input.repositoryCount > 0,
    showExpertLibrary: inCurateLibrary && input.userMode === "expert",
    showInspect:
      input.userMode === "expert" &&
      input.effectivePillar === "curate" &&
      input.effectiveScreen === "inspect",
    showCompose: input.userMode === "expert" && input.effectivePillar === "design",
    showSession: input.effectivePillar === "perform",
  };
}
