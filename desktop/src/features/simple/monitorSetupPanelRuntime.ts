import type { AppTranslations } from "../../i18n/types";
import type { MonitorSourceFilter } from "./monitorSourceOptions";

export interface MonitorSetupSourceFilterOption {
  id: MonitorSourceFilter;
  label: string;
}

export function buildMonitorSetupSourceFilterOptions(
  t: AppTranslations,
): MonitorSetupSourceFilterOption[] {
  return [
    { id: "all", label: t.simpleMode.setup.all },
    { id: "file", label: t.simpleMode.setup.logFile },
    { id: "folder", label: t.simpleMode.setup.folder },
    { id: "cloud", label: t.simpleMode.setup.cloud },
  ];
}
