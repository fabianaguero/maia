import type { ActiveMonitorSession, MonitorMetrics } from "./features/monitor/monitorContextTypes";
import type { AppSection } from "./features/simple/appSections";
import type { AppTranslations } from "./i18n/en";

export interface AppV0ShellViewModel {
  monitoringStatus: {
    source?: string;
    anomalies: number;
    uptime: string;
    confidence: number;
  };
  selectedItem: string;
  floatingWaveformBar:
    | {
        isVisible: false;
      }
    | {
        isVisible: true;
        source: string;
        anomalies: number;
        uptime: string;
      };
}

export function resolveAppV0SelectedItemLabel(input: {
  currentSection: AppSection;
  t: AppTranslations;
  session: ActiveMonitorSession | null;
  selectedRepositoryTitle?: string | null;
  selectedTrackTitle?: string | null;
}): string {
  switch (input.currentSection) {
    case "monitor":
      return input.session?.repoTitle || input.t.simpleMode.nav.monitor;
    case "library":
      return (
        input.selectedRepositoryTitle || input.selectedTrackTitle || input.t.simpleMode.nav.files
      );
    case "connections":
      return input.t.simpleMode.nav.connections;
    case "setup":
      return input.t.simpleMode.nav.setup;
    case "inspect":
    case "compose":
    default:
      return input.t.simpleMode.shell.none;
  }
}

export function buildAppV0ShellViewModel(input: {
  currentSection: AppSection;
  isMonitoring: boolean;
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  uptimeLabel: string;
  t: AppTranslations;
  selectedRepositoryTitle?: string | null;
  selectedTrackTitle?: string | null;
}): AppV0ShellViewModel {
  const selectedItem = resolveAppV0SelectedItemLabel({
    currentSection: input.currentSection,
    t: input.t,
    session: input.session,
    selectedRepositoryTitle: input.selectedRepositoryTitle,
    selectedTrackTitle: input.selectedTrackTitle,
  });

  const monitoringStatus = {
    source: input.session?.repoTitle,
    anomalies: input.metrics.totalAnomalies,
    uptime: input.uptimeLabel,
    confidence: 87,
  };

  if (!input.isMonitoring || input.currentSection === "monitor") {
    return {
      monitoringStatus,
      selectedItem,
      floatingWaveformBar: {
        isVisible: false,
      },
    };
  }

  return {
    monitoringStatus,
    selectedItem,
    floatingWaveformBar: {
      isVisible: true,
      source: input.session?.repoTitle || input.t.simpleMode.common.unknown,
      anomalies: input.metrics.totalAnomalies,
      uptime: input.uptimeLabel,
    },
  };
}
