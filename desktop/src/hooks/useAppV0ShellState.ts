import { useState, type Dispatch, type SetStateAction } from "react";

import type { AppSection } from "../features/simple/appSections";

export interface UseAppV0ShellStateResult {
  currentSection: AppSection;
  setCurrentSection: Dispatch<SetStateAction<AppSection>>;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isConsoleExpanded: boolean;
  setIsConsoleExpanded: Dispatch<SetStateAction<boolean>>;
  openMonitorInspector: () => void;
  toggleConsoleExpanded: () => void;
}

export function useAppV0ShellState(
  initialSection: AppSection = "monitor",
): UseAppV0ShellStateResult {
  const [currentSection, setCurrentSection] = useState<AppSection>(initialSection);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  return {
    currentSection,
    setCurrentSection,
    isSidebarCollapsed,
    toggleSidebarCollapsed: () => setIsSidebarCollapsed((current) => !current),
    isConsoleExpanded,
    setIsConsoleExpanded,
    openMonitorInspector: () => {
      setCurrentSection("monitor");
      setIsConsoleExpanded(true);
    },
    toggleConsoleExpanded: () => setIsConsoleExpanded((current) => !current),
  };
}
