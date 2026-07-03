import type { AppShellProps } from "./components/AppShell";
import type { AppSection } from "./features/simple/appSections";

export function buildAppV0ShellProps(input: {
  currentSection: AppSection;
  isMonitoring: boolean;
  monitoringStatus: AppShellProps["monitoringStatus"];
  selectedItem: string;
  trackCount: number;
  repositoryCount: number;
  baseAssetCount: number;
  onSectionChange: NonNullable<AppShellProps["onSectionChange"]>;
  onInspect: NonNullable<AppShellProps["onInspect"]>;
  onStopMonitoring: NonNullable<AppShellProps["onStopMonitoring"]>;
  isCollapsed: boolean;
  onToggleCollapse: NonNullable<AppShellProps["onToggleCollapse"]>;
}): Omit<AppShellProps, "children"> {
  return {
    currentSection: input.currentSection,
    isMonitoring: input.isMonitoring,
    monitoringStatus: input.monitoringStatus,
    selectedItem: input.selectedItem,
    trackCount: input.trackCount,
    repositoryCount: input.repositoryCount,
    baseAssetCount: input.baseAssetCount,
    onSectionChange: input.onSectionChange,
    onInspect: input.onInspect,
    onStopMonitoring: input.onStopMonitoring,
    isCollapsed: input.isCollapsed,
    onToggleCollapse: input.onToggleCollapse,
  };
}
