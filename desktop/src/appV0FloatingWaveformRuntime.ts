import type { AppShellProps } from "./components/AppShell";
import type { AppV0SectionContentInput } from "./appV0SectionContentRuntime";
import type { AppV0ShellViewModel } from "./appV0ShellViewModel";
import { buildAppV0ShellProps } from "./appV0ShellPropsRuntime";
import type { AppSection } from "./features/simple/appSections";
import type { AppV0ContentActions } from "./appV0ContentActionsRuntime";

export interface BuildAppV0ScreenModelArgs {
  shell: {
    currentSection: AppSection;
    isSidebarCollapsed: boolean;
    toggleSidebarCollapsed: () => void;
    isConsoleExpanded: boolean;
    toggleConsoleExpanded: () => void;
    openMonitorInspector: () => void;
  };
  contentActions: AppV0ContentActions;
  shellViewModel: AppV0ShellViewModel;
  currentSection: AppSection;
  isMonitoring: boolean;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  sectionContentInput: AppV0SectionContentInput;
}

export function buildAppV0FloatingWaveformBarProps(input: {
  floatingWaveformBar: AppV0ShellViewModel["floatingWaveformBar"];
  onStop: () => void;
  onInspect: () => void;
}): {
  isActive: true;
  source: string;
  anomalies: number;
  uptime: string;
  onStop: () => void;
  onInspect: () => void;
} | null {
  return input.floatingWaveformBar.isVisible
    ? {
        isActive: true,
        source: input.floatingWaveformBar.source,
        anomalies: input.floatingWaveformBar.anomalies,
        uptime: input.floatingWaveformBar.uptime,
        onStop: input.onStop,
        onInspect: input.onInspect,
      }
    : null;
}

export function buildAppV0ScreenModel(input: BuildAppV0ScreenModelArgs): {
  appShellProps: Omit<AppShellProps, "children">;
  sectionContentInput: AppV0SectionContentInput;
  floatingWaveformBarProps: ReturnType<typeof buildAppV0FloatingWaveformBarProps>;
} {
  const appShellProps = buildAppV0ShellProps({
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    monitoringStatus: input.shellViewModel.monitoringStatus,
    selectedItem: input.shellViewModel.selectedItem,
    trackCount: input.trackCount,
    repositoryCount: input.repositoryCount,
    baseAssetCount: input.baseAssetCount,
    onSectionChange: input.contentActions.onSectionChange,
    onInspect: input.shell.openMonitorInspector,
    onStopMonitoring: input.contentActions.onStopMonitoring,
    isCollapsed: input.shell.isSidebarCollapsed,
    onToggleCollapse: input.shell.toggleSidebarCollapsed,
  });

  return {
    appShellProps,
    sectionContentInput: input.sectionContentInput,
    floatingWaveformBarProps: buildAppV0FloatingWaveformBarProps({
      floatingWaveformBar: input.shellViewModel.floatingWaveformBar,
      onStop: input.contentActions.onStopMonitoring,
      onInspect: input.contentActions.onInspectFloatingWaveform,
    }),
  };
}
