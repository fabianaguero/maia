export type AppShellUserMode = "simple" | "expert";

export interface AppTopbarState {
  showWordmark: boolean;
  showLockup: boolean;
  showWorkspaceSubtitle: boolean;
}

export interface AppMonitorOverviewState {
  selectedItemTitle: string | null;
  show: boolean;
  showLiveStatus: boolean;
  anomalyCountLabel: string | null;
}

export function buildAppTopbarState(userMode: AppShellUserMode): AppTopbarState {
  return {
    showWordmark: userMode === "expert",
    showLockup: userMode === "simple",
    showWorkspaceSubtitle: userMode === "expert",
  };
}

export function buildAppMonitorOverviewState(input: {
  userMode: AppShellUserMode;
  selectedItemTitle: string | null;
  hasMonitorSession: boolean;
  totalAnomalies: number;
  anomalyLabel: string;
}): AppMonitorOverviewState {
  const selectedItemTitle = input.selectedItemTitle?.trim() || null;
  const show = input.userMode === "expert" && selectedItemTitle !== null;

  return {
    selectedItemTitle,
    show,
    showLiveStatus: show && input.hasMonitorSession,
    anomalyCountLabel:
      show && input.hasMonitorSession
        ? `${input.totalAnomalies} ${input.anomalyLabel.toLowerCase()}`
        : null,
  };
}
