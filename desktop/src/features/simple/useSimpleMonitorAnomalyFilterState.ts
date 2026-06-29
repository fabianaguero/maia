import { useState } from "react";

import {
  createClearAnomalyFilterHandler,
  createToggleAnomalyFilterHandler,
} from "./simpleMonitorScreenRuntime";

interface UseSimpleMonitorAnomalyFilterStateInput {
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
}

export function useSimpleMonitorAnomalyFilterState({
  isConsoleExpanded,
  onToggleConsole,
}: UseSimpleMonitorAnomalyFilterStateInput) {
  const [isAnomalyFilterActive, setIsAnomalyFilterActive] = useState(false);

  const handleToggleAnomalyFilter = createToggleAnomalyFilterHandler({
    toggleAnomalyFilter: (updater) => setIsAnomalyFilterActive(updater),
    isConsoleExpanded,
    onToggleConsole,
  });
  const handleClearAnomalyFilter = createClearAnomalyFilterHandler(setIsAnomalyFilterActive);

  return {
    isAnomalyFilterActive,
    handleToggleAnomalyFilter,
    handleClearAnomalyFilter,
  };
}
